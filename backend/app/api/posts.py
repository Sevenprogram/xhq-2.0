from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Creator, Post, PostSnapshot
from app.schemas.post import HotPostRead, PostListResponse, PostRead, PostSnapshotRead
from app.services.analytics_service import build_hot_post, hot_posts

router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("", response_model=PostListResponse)
def list_posts(
    project_id: int | None = None,
    platform: str | None = None,
    keyword_id: int | None = None,
    creator_id: int | None = None,
    min_relevance_score: float | None = None,
    min_like_count: int | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    is_ad_suspected: bool | None = None,
    brand: str | None = None,
    search: str | None = None,
    sort_by: str = "created_at",
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> dict:
    query = select(Post).options(selectinload(Post.creator)).join(Creator, Post.creator_id == Creator.id, isouter=True)
    if project_id:
        query = query.where(Post.project_id == project_id)
    if platform:
        query = query.where(Post.platform == platform)
    if keyword_id:
        query = query.where(Post.keyword_id == keyword_id)
    if creator_id:
        query = query.where(Post.creator_id == creator_id)
    if min_relevance_score is not None:
        query = query.where(Post.relevance_score >= min_relevance_score)
    if min_like_count is not None:
        query = query.where(Post.like_count >= min_like_count)
    if date_from:
        query = query.where(Post.publish_time >= date_from)
    if date_to:
        query = query.where(Post.publish_time <= date_to)
    if is_ad_suspected is not None:
        query = query.where(Post.is_ad_suspected == is_ad_suspected)
    if brand:
        query = query.where(cast(Post.brand_mentions, String).ilike(f"%{brand}%"))
    if search:
        pattern = f"%{search}%"
        query = query.where(
            or_(
                Post.title.ilike(pattern),
                Post.content_text.ilike(pattern),
                cast(Post.tags, String).ilike(pattern),
                Creator.nickname.ilike(pattern),
                cast(Post.brand_mentions, String).ilike(pattern),
            )
        )

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    sort_map = {
        "like_count": Post.like_count.desc(),
        "comment_count": Post.comment_count.desc(),
        "relevance_score": Post.relevance_score.desc(),
        "publish_time": Post.publish_time.desc(),
        "created_at": Post.created_at.desc(),
    }
    items = db.scalars(query.order_by(sort_map.get(sort_by, Post.created_at.desc())).offset(offset).limit(limit)).all()
    return {"items": items, "total": total}


@router.get("/ranking/growth", response_model=list[HotPostRead])
def ranking_growth(project_id: int | None = None, limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
    return hot_posts(db, project_id, limit)


@router.get("/ranking/relevance", response_model=list[PostRead])
def ranking_relevance(project_id: int | None = None, limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
    query = select(Post).options(selectinload(Post.creator))
    if project_id:
        query = query.where(Post.project_id == project_id)
    return list(db.scalars(query.order_by(Post.relevance_score.desc()).limit(limit)))


@router.get("/{post_id}", response_model=PostRead)
def get_post(post_id: int, db: Session = Depends(get_db)) -> Post:
    post = db.scalar(select(Post).options(selectinload(Post.creator)).where(Post.id == post_id))
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.get("/{post_id}/snapshots", response_model=list[PostSnapshotRead])
def get_post_snapshots(post_id: int, db: Session = Depends(get_db)) -> list[PostSnapshot]:
    return list(
        db.scalars(
            select(PostSnapshot).where(PostSnapshot.post_id == post_id).order_by(PostSnapshot.captured_at.asc())
        )
    )
