from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import Select, cast, func, select
from sqlalchemy.orm import Session, selectinload

from app.models import Creator, Keyword, Post, PostSnapshot, Project


def hot_metrics_for_post(db: Session, post: Post) -> dict:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    previous = db.scalar(
        select(PostSnapshot)
        .where(PostSnapshot.post_id == post.id, PostSnapshot.captured_at <= cutoff)
        .order_by(PostSnapshot.captured_at.desc())
        .limit(1)
    )
    latest = db.scalar(
        select(PostSnapshot)
        .where(PostSnapshot.post_id == post.id)
        .order_by(PostSnapshot.captured_at.desc())
        .limit(1)
    )
    base_like = previous.like_count if previous else post.like_count
    base_comment = previous.comment_count if previous else post.comment_count
    base_collect = previous.collect_count if previous else post.collect_count
    base_share = previous.share_count if previous else post.share_count

    like_growth = max(0, (latest.like_count if latest else post.like_count) - base_like)
    comment_growth = max(0, (latest.comment_count if latest else post.comment_count) - base_comment)
    collect_growth = max(0, (latest.collect_count if latest else post.collect_count) - base_collect)
    share_growth = max(0, (latest.share_count if latest else post.share_count) - base_share)
    collect_like_ratio = post.collect_count / post.like_count if post.like_count else 0
    comment_like_ratio = post.comment_count / post.like_count if post.like_count else 0

    hot_score = (
        min(40, like_growth / 20)
        + min(30, comment_growth / 5)
        + min(15, collect_like_ratio * 30)
        + min(15, comment_like_ratio * 100)
        + min(20, float(post.relevance_score or Decimal(0)) / 5)
    )
    return {
        "hot_score": round(float(hot_score), 2),
        "like_growth_24h": like_growth,
        "comment_growth_24h": comment_growth,
        "collect_growth_24h": collect_growth,
        "share_growth_24h": share_growth,
        "collect_like_ratio": round(collect_like_ratio, 4),
        "comment_like_ratio": round(comment_like_ratio, 4),
    }


def is_hot_post(db: Session, post: Post) -> bool:
    metrics = hot_metrics_for_post(db, post)
    return (
        metrics["like_growth_24h"] >= 500
        or metrics["comment_growth_24h"] >= 100
        or metrics["collect_like_ratio"] >= 0.35
        or metrics["comment_like_ratio"] >= 0.08
        or (post.like_count + post.comment_count + post.collect_count + post.share_count) >= 3000
    )


def build_hot_post(db: Session, post: Post) -> dict:
    data = {column.name: getattr(post, column.name) for column in Post.__table__.columns}
    data["creator"] = post.creator
    data.update(hot_metrics_for_post(db, post))
    return data


def hot_posts(db: Session, project_id: int | None = None, limit: int = 10) -> list[dict]:
    query = select(Post).options(selectinload(Post.creator))
    if project_id:
        query = query.where(Post.project_id == project_id)
    posts = db.scalars(query.order_by(Post.like_count.desc(), Post.comment_count.desc()).limit(max(limit * 3, 30))).all()
    ranked = [build_hot_post(db, post) for post in posts]
    ranked.sort(key=lambda item: item["hot_score"], reverse=True)
    return ranked[:limit]


def seven_day_growth(db: Session, project_id: int | None = None) -> list[dict]:
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=6)
    query: Select = select(func.date(Post.first_seen_at), func.count(Post.id)).where(func.date(Post.first_seen_at) >= start)
    if project_id:
        query = query.where(Post.project_id == project_id)
    query = query.group_by(func.date(Post.first_seen_at)).order_by(func.date(Post.first_seen_at))
    rows = {str(date): count for date, count in db.execute(query).all()}
    return [{"date": str(start + timedelta(days=i)), "count": int(rows.get(str(start + timedelta(days=i)), 0))} for i in range(7)]


def platform_distribution(db: Session, project_id: int | None = None) -> list[dict]:
    query: Select = select(Post.platform, func.count(Post.id))
    if project_id:
        query = query.where(Post.project_id == project_id)
    rows = db.execute(query.group_by(Post.platform)).all()
    return [{"platform": platform, "count": count} for platform, count in rows]


def dashboard_summary(db: Session, project_id: int | None = None) -> dict:
    today = datetime.now(timezone.utc).date()
    post_query = select(func.count(Post.id))
    creator_query = select(func.count(Creator.id))
    keyword_query = select(func.count(Keyword.id))
    if project_id:
        post_query = post_query.where(Post.project_id == project_id)
        keyword_query = keyword_query.where(Keyword.project_id == project_id)

    recent_posts = db.scalars(
        select(Post)
        .options(selectinload(Post.creator))
        .where(func.date(Post.first_seen_at) == today)
        .where(Post.project_id == project_id if project_id else True)
    ).all()
    return {
        "project_count": db.scalar(select(func.count(Project.id))) or 0,
        "keyword_count": db.scalar(keyword_query) or 0,
        "post_count": db.scalar(post_query) or 0,
        "creator_count": db.scalar(creator_query) or 0,
        "today_new_posts": len(recent_posts),
        "today_hot_posts": sum(1 for post in recent_posts if is_hot_post(db, post)),
        "seven_day_growth": seven_day_growth(db, project_id),
        "platform_distribution": platform_distribution(db, project_id),
        "hot_posts": hot_posts(db, project_id, 10),
        "top_creators": db.scalars(select(Creator).order_by(Creator.creator_score.desc()).limit(10)).all(),
    }


def keyword_trend(db: Session, project_id: int | None = None, days: int = 30) -> list[dict]:
    start = datetime.now(timezone.utc).date() - timedelta(days=days - 1)
    query = (
        select(func.date(Post.first_seen_at), Keyword.id, Keyword.keyword, Keyword.platform, func.count(Post.id))
        .join(Keyword, Post.keyword_id == Keyword.id, isouter=True)
        .where(func.date(Post.first_seen_at) >= start)
    )
    if project_id:
        query = query.where(Post.project_id == project_id)
    query = query.group_by(func.date(Post.first_seen_at), Keyword.id, Keyword.keyword, Keyword.platform).order_by(func.date(Post.first_seen_at))
    return [
        {"date": str(date), "keyword_id": keyword_id, "keyword": keyword, "platform": platform, "count": count}
        for date, keyword_id, keyword, platform, count in db.execute(query).all()
    ]


def post_growth(db: Session, project_id: int | None = None, limit: int = 20) -> list[dict]:
    query = select(Post).options(selectinload(Post.creator))
    if project_id:
        query = query.where(Post.project_id == project_id)
    posts = db.scalars(query.order_by(Post.like_count.desc()).limit(max(limit * 2, 20))).all()
    rows = []
    for post in posts:
        metrics = hot_metrics_for_post(db, post)
        rows.append(
            {
                "post_id": post.id,
                "title": post.title,
                "platform": post.platform,
                "like_growth_24h": metrics["like_growth_24h"],
                "comment_growth_24h": metrics["comment_growth_24h"],
                "collect_growth_24h": metrics["collect_growth_24h"],
                "share_growth_24h": metrics["share_growth_24h"],
            }
        )
    rows.sort(key=lambda item: item["like_growth_24h"] + item["comment_growth_24h"] * 5, reverse=True)
    return rows[:limit]
