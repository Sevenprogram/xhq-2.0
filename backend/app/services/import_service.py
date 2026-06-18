from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.connectors.csv_import import CSVImportConnector
from app.connectors.json_import import JSONImportConnector
from app.connectors.third_party_mock import ThirdPartyAPIConnector
from app.models import CollectionJob, Creator, CreatorSnapshot, Keyword, Post, PostSnapshot, Project
from app.services.normalize_service import NormalizedPost, normalize_post
from app.services.scoring_service import batch_medians, calculate_relevance_score


def import_csv_content(db: Session, content: str, project_id: int, keyword_id: int | None = None) -> CollectionJob:
    rows = CSVImportConnector(content).search_posts(limit=0)
    return ingest_raw_records(db, rows, project_id, keyword_id, source_type="csv", job_type="csv_import")


def import_json_content(db: Session, content: str, project_id: int, keyword_id: int | None = None) -> CollectionJob:
    rows = JSONImportConnector(content).search_posts(limit=0)
    return ingest_raw_records(db, rows, project_id, keyword_id, source_type="json", job_type="json_import")


def run_keyword_mock_collection(db: Session, keyword_id: int) -> CollectionJob:
    keyword = db.get(Keyword, keyword_id)
    if not keyword:
        raise ValueError("Keyword not found")
    rows = ThirdPartyAPIConnector().search_posts(keyword.keyword, keyword.collect_limit)
    job = ingest_raw_records(
        db,
        rows,
        project_id=keyword.project_id,
        keyword_id=keyword.id,
        source_type="third_party_mock",
        job_type="keyword_collection",
    )
    keyword.last_checked_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(job)
    return job


def ingest_raw_records(
    db: Session,
    rows: list[dict],
    project_id: int,
    keyword_id: int | None = None,
    source_type: str = "manual",
    job_type: str = "import",
) -> CollectionJob:
    project = db.get(Project, project_id)
    if not project:
        raise ValueError("Project not found")

    job = CollectionJob(
        project_id=project_id,
        keyword_id=keyword_id,
        platform="mixed",
        job_type=job_type,
        status="running",
        source_type=source_type,
        started_at=datetime.now(timezone.utc),
        raw_result_count=len(rows),
    )
    db.add(job)
    db.flush()

    try:
        normalized_posts = [normalize_post(row) for row in rows]
        like_median, comment_median = batch_medians(normalized_posts)
        inserted = 0
        updated = 0

        for index, normalized in enumerate(normalized_posts, start=1):
            resolved_keyword = _resolve_keyword(db, project_id, keyword_id, normalized)
            post, created = _upsert_post(db, project_id, resolved_keyword, normalized, like_median, comment_median)
            _write_post_snapshot(db, post, index)
            if post.creator_id:
                _write_creator_snapshot(db, post.creator_id, post.platform)
                _refresh_creator_score(db, post.creator_id)
            inserted += 1 if created else 0
            updated += 0 if created else 1

        job.status = "success"
        job.finished_at = datetime.now(timezone.utc)
        job.inserted_count = inserted
        job.updated_count = updated
        db.commit()
    except Exception as exc:
        db.rollback()
        job = db.merge(job)
        job.status = "failed"
        job.finished_at = datetime.now(timezone.utc)
        job.error_message = str(exc)
        db.commit()

    db.refresh(job)
    return job


def _resolve_keyword(db: Session, project_id: int, keyword_id: int | None, post: NormalizedPost) -> Keyword | None:
    if keyword_id:
        return db.get(Keyword, keyword_id)
    if not post.keyword or post.platform == "unknown":
        return None
    keyword = db.scalar(
        select(Keyword).where(
            Keyword.project_id == project_id,
            Keyword.keyword == post.keyword,
            Keyword.platform == post.platform,
        )
    )
    if keyword:
        return keyword
    keyword = Keyword(project_id=project_id, keyword=post.keyword, platform=post.platform)
    db.add(keyword)
    db.flush()
    return keyword


def _upsert_post(
    db: Session,
    project_id: int,
    keyword: Keyword | None,
    normalized: NormalizedPost,
    like_median: float,
    comment_median: float,
) -> tuple[Post, bool]:
    creator = _upsert_creator(db, normalized)
    related_keywords = _project_keywords(db, project_id, normalized.platform)
    main_keyword = keyword.keyword if keyword else normalized.keyword
    relevance_score = Decimal(
        calculate_relevance_score(normalized, main_keyword, related_keywords, like_median, comment_median)
    )

    post = db.scalar(
        select(Post).where(Post.platform == normalized.platform, Post.platform_post_id == normalized.platform_post_id)
    )
    created = post is None
    if created:
        post = Post(
            platform=normalized.platform,
            platform_post_id=normalized.platform_post_id,
            project_id=project_id,
            keyword_id=keyword.id if keyword else None,
            creator_id=creator.id if creator else None,
            first_seen_at=datetime.now(timezone.utc),
        )
        db.add(post)

    if post.project_id is None:
        post.project_id = project_id
    if post.keyword_id is None and keyword:
        post.keyword_id = keyword.id
    post.creator_id = creator.id if creator else post.creator_id
    post.url = normalized.url
    post.title = normalized.title
    post.content_text = normalized.content_text
    post.summary = normalized.summary
    post.media_type = normalized.media_type
    post.publish_time = normalized.publish_time
    post.cover_url = normalized.cover_url
    post.tags = normalized.tags
    post.like_count = normalized.like_count
    post.comment_count = normalized.comment_count
    post.collect_count = normalized.collect_count
    post.share_count = normalized.share_count
    post.relevance_score = relevance_score
    post.brand_mentions = normalized.brand_mentions
    post.is_ad_suspected = _suspect_ad(normalized)
    post.raw_json = normalized.raw_json
    post.last_seen_at = datetime.now(timezone.utc)
    db.flush()
    return post, created


def _upsert_creator(db: Session, normalized: NormalizedPost) -> Creator | None:
    if not normalized.creator:
        return None
    creator_payload = normalized.creator
    creator = db.scalar(
        select(Creator).where(
            Creator.platform == normalized.platform,
            Creator.platform_creator_id == creator_payload.platform_creator_id,
        )
    )
    if creator is None:
        creator = Creator(
            platform=normalized.platform,
            platform_creator_id=creator_payload.platform_creator_id,
            first_seen_at=datetime.now(timezone.utc),
        )
        db.add(creator)
    creator.nickname = creator_payload.nickname
    creator.profile_url = creator_payload.profile_url
    creator.bio = creator_payload.bio
    creator.avatar_url = creator_payload.avatar_url
    creator.follower_count = creator_payload.follower_count
    creator.following_count = creator_payload.following_count
    creator.total_likes = creator_payload.total_likes
    creator.content_count = creator_payload.content_count
    creator.category_tags = creator_payload.category_tags
    creator.raw_json = creator_payload.raw_json
    creator.last_seen_at = datetime.now(timezone.utc)
    db.flush()
    return creator


def _write_post_snapshot(db: Session, post: Post, rank_position: int | None = None) -> None:
    db.add(
        PostSnapshot(
            post_id=post.id,
            platform=post.platform,
            like_count=post.like_count,
            comment_count=post.comment_count,
            collect_count=post.collect_count,
            share_count=post.share_count,
            rank_position=rank_position,
        )
    )


def _write_creator_snapshot(db: Session, creator_id: int, platform: str) -> None:
    creator = db.get(Creator, creator_id)
    if not creator:
        return
    db.add(
        CreatorSnapshot(
            creator_id=creator_id,
            platform=platform,
            follower_count=creator.follower_count,
            following_count=creator.following_count,
            total_likes=creator.total_likes,
            content_count=creator.content_count,
        )
    )


def _refresh_creator_score(db: Session, creator_id: int) -> None:
    creator = db.get(Creator, creator_id)
    if not creator:
        return
    posts = db.scalars(select(Post).where(Post.creator_id == creator_id)).all()
    if not posts:
        creator.creator_score = Decimal(0)
        return

    related_count = len(posts)
    hot_count = sum(1 for post in posts if post.like_count >= 500 or post.comment_count >= 100)
    avg_interaction = sum(post.like_count + post.comment_count + post.collect_count + post.share_count for post in posts) / related_count
    avg_relevance = sum(float(post.relevance_score or 0) for post in posts) / related_count
    keyword_count = len({post.keyword_id for post in posts if post.keyword_id})
    recent_count = sum(1 for post in posts if post.publish_time and (datetime.now(timezone.utc) - post.publish_time).days <= 30)
    score = (
        min(100, related_count * 10) * 0.2
        + min(100, hot_count * 20) * 0.25
        + min(100, avg_interaction / 50) * 0.2
        + avg_relevance * 0.15
        + min(100, keyword_count * 20) * 0.1
        + min(100, recent_count * 20) * 0.1
    )
    creator.creator_score = Decimal(round(score, 2))


def _project_keywords(db: Session, project_id: int, platform: str) -> list[str]:
    return list(
        db.scalars(
            select(Keyword.keyword).where(
                Keyword.project_id == project_id,
                Keyword.platform == platform,
            )
        )
    )


def _suspect_ad(post: NormalizedPost) -> bool:
    text = f"{post.title or ''} {post.content_text or ''} {post.creator.bio if post.creator else ''}"
    signals = ["合作", "体验", "测评", "推荐", "优惠", "报名", "课程", "咨询", "商务合作"]
    return bool(post.brand_mentions) or any(signal in text for signal in signals)
