from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Creator, CreatorSnapshot, Post
from app.schemas.creator import CreatorListResponse, CreatorPostsResponse, CreatorRead, CreatorSnapshotRead

router = APIRouter(prefix="/creators", tags=["creators"])


@router.get("", response_model=CreatorListResponse)
def list_creators(
    platform: str | None = None,
    min_followers: int | None = None,
    max_followers: int | None = None,
    search: str | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> dict:
    query = select(Creator)
    if platform:
        query = query.where(Creator.platform == platform)
    if min_followers is not None:
        query = query.where(Creator.follower_count >= min_followers)
    if max_followers is not None:
        query = query.where(Creator.follower_count <= max_followers)
    if search:
        query = query.where(Creator.nickname.ilike(f"%{search}%"))
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(query.order_by(Creator.creator_score.desc(), Creator.follower_count.desc()).offset(offset).limit(limit)).all()
    return {"items": items, "total": total}


@router.get("/ranking", response_model=list[CreatorRead])
def creator_ranking(limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)) -> list[Creator]:
    return list(db.scalars(select(Creator).order_by(Creator.creator_score.desc(), Creator.follower_count.desc()).limit(limit)))


@router.get("/{creator_id}", response_model=CreatorRead)
def get_creator(creator_id: int, db: Session = Depends(get_db)) -> Creator:
    creator = db.get(Creator, creator_id)
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    return creator


@router.get("/{creator_id}/posts", response_model=CreatorPostsResponse)
def get_creator_posts(creator_id: int, db: Session = Depends(get_db)) -> dict:
    creator = db.get(Creator, creator_id)
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    posts = db.scalars(select(Post).options(selectinload(Post.creator)).where(Post.creator_id == creator_id).order_by(Post.publish_time.desc())).all()
    return {"creator": creator, "posts": posts}


@router.get("/{creator_id}/snapshots", response_model=list[CreatorSnapshotRead])
def get_creator_snapshots(creator_id: int, db: Session = Depends(get_db)) -> list[CreatorSnapshot]:
    return list(
        db.scalars(
            select(CreatorSnapshot)
            .where(CreatorSnapshot.creator_id == creator_id)
            .order_by(CreatorSnapshot.captured_at.asc())
        )
    )
