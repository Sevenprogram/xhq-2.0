from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.analytics import DashboardSummary, KeywordTrendPoint, PostGrowthPoint
from app.schemas.creator import CreatorRead
from app.schemas.post import HotPostRead
from app.services.analytics_service import dashboard_summary, hot_posts, keyword_trend, post_growth

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard-summary", response_model=DashboardSummary)
def get_dashboard_summary(project_id: int | None = None, db: Session = Depends(get_db)):
    return dashboard_summary(db, project_id)


@router.get("/keyword-trend", response_model=list[KeywordTrendPoint])
def get_keyword_trend(project_id: int | None = None, days: int = Query(30, ge=1, le=365), db: Session = Depends(get_db)):
    return keyword_trend(db, project_id, days)


@router.get("/post-growth", response_model=list[PostGrowthPoint])
def get_post_growth(project_id: int | None = None, limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    return post_growth(db, project_id, limit)


@router.get("/hot-posts", response_model=list[HotPostRead])
def get_hot_posts(project_id: int | None = None, limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
    return hot_posts(db, project_id, limit)


@router.get("/creator-ranking", response_model=list[CreatorRead])
def get_creator_ranking(limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
    from app.models import Creator
    from sqlalchemy import select

    return list(db.scalars(select(Creator).order_by(Creator.creator_score.desc()).limit(limit)))
