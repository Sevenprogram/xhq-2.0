from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.connectors.justone_pgy import JustOneAPIError, JustOneConfigError, search_pgy_creators
from app.database import get_db
from app.models import DealApplication, MarketplaceDeal
from app.schemas.marketplace import (
    APPLICATION_STATUSES,
    ApplicationCreate,
    ApplicationListResponse,
    ApplicationRead,
    ApplicationStatusUpdate,
    DealCreate,
    DealListResponse,
    DealRead,
    MerchantProfileRead,
    MerchantProfileUpdate,
)
from app.services.merchant_defaults import DEFAULT_MERCHANT_KEY
from app.services.merchant_profile import get_or_create_merchant_profile

router = APIRouter(prefix="/marketplace", tags=["marketplace"])


@router.get("/pgy-creators")
def pgy_creators(track: str = Query("全部教育"), limit: int = Query(20, ge=1, le=50)) -> dict:
    try:
        creators = search_pgy_creators(track=track, limit=limit)
    except JustOneConfigError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except JustOneAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {"track": track, "items": creators}


@router.get("/deals", response_model=DealListResponse)
def list_deals(
    search: str | None = None,
    track: str | None = None,
    city: str | None = None,
    merchant_key: str | None = None,
    include_offline: bool = False,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> dict:
    query = select(MarketplaceDeal)
    if not include_offline:
        query = query.where(MarketplaceDeal.status == "published")
    if merchant_key:
        query = query.where(MarketplaceDeal.merchant_key == merchant_key)
    if city and city != "全部城市":
        query = query.where(MarketplaceDeal.city == city)
    if search:
        keyword = f"%{search.strip()}%"
        query = query.where(
            or_(
                MarketplaceDeal.brand_name.ilike(keyword),
                MarketplaceDeal.title.ilike(keyword),
                MarketplaceDeal.target_audience.ilike(keyword),
                MarketplaceDeal.deliverable.ilike(keyword),
                MarketplaceDeal.brief.ilike(keyword),
            )
        )

    all_deals = db.scalars(query.order_by(MarketplaceDeal.created_at.desc())).all()
    if track and track != "全部赛道":
        all_deals = [deal for deal in all_deals if track in (deal.target_tracks or [])]
    total = len(all_deals)
    deals = all_deals[offset : offset + limit]
    counts = _application_counts(db, [deal.id for deal in deals])
    return {"items": [_deal_read(deal, counts.get(deal.id, 0)) for deal in deals], "total": total}


@router.post("/deals", response_model=DealRead, status_code=status.HTTP_201_CREATED)
def create_deal(payload: DealCreate, db: Session = Depends(get_db)) -> dict:
    profile = get_or_create_merchant_profile(db)
    deal = MarketplaceDeal(
        **payload.model_dump(),
        external_id=_merchant_external_id(payload.brand_name, payload.title),
        status="published",
        source="merchant",
        merchant_key=DEFAULT_MERCHANT_KEY,
        merchant_display_name=profile.display_name,
        reason_tags=[],
        min_followers=0,
        max_followers=0,
        match_score=0,
        suggested_payout=(payload.budget_min + payload.budget_max) / 2 if payload.budget_max else payload.budget_min,
    )
    db.add(deal)
    db.commit()
    db.refresh(deal)
    return _deal_read(deal, 0)


@router.get("/merchant-profile", response_model=MerchantProfileRead)
def get_merchant_profile(db: Session = Depends(get_db)) -> dict:
    profile = get_or_create_merchant_profile(db)
    return {
        "merchant_key": profile.merchant_key,
        "display_name": profile.display_name,
        "created_at": profile.created_at,
        "updated_at": profile.updated_at,
    }


@router.patch("/merchant-profile", response_model=MerchantProfileRead)
def update_merchant_profile(payload: MerchantProfileUpdate, db: Session = Depends(get_db)) -> dict:
    profile = get_or_create_merchant_profile(db)
    profile.display_name = payload.display_name.strip()
    db.commit()
    db.refresh(profile)
    return {
        "merchant_key": profile.merchant_key,
        "display_name": profile.display_name,
        "created_at": profile.created_at,
        "updated_at": profile.updated_at,
    }


@router.get("/deals/{deal_id}", response_model=DealRead)
def get_deal(deal_id: int, db: Session = Depends(get_db)) -> dict:
    deal = db.get(MarketplaceDeal, deal_id)
    if not deal or deal.status != "published":
        raise HTTPException(status_code=404, detail="Deal not found")
    count = _application_counts(db, [deal.id]).get(deal.id, 0)
    return _deal_read(deal, count)


@router.post("/deals/{deal_id}/applications", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
def submit_application(deal_id: int, payload: ApplicationCreate, db: Session = Depends(get_db)) -> dict:
    deal = db.get(MarketplaceDeal, deal_id)
    if not deal or deal.status != "published":
        raise HTTPException(status_code=404, detail="Deal not found")

    existing = db.scalar(
        select(DealApplication).where(
            DealApplication.deal_id == deal_id,
            DealApplication.wechat == payload.wechat.strip(),
            DealApplication.profile_link == payload.profile_link.strip(),
        )
    )
    if existing:
        raise HTTPException(status_code=409, detail="你已经报名过这个商单")

    application = DealApplication(
        deal_id=deal_id,
        status="pending_contact",
        **payload.model_dump(),
    )
    application.wechat = application.wechat.strip()
    application.profile_link = application.profile_link.strip()
    db.add(application)
    db.commit()
    db.refresh(application)
    return _application_read(application)


@router.get("/applications", response_model=ApplicationListResponse)
def list_applications(
    deal_id: int | None = None,
    limit: int = Query(100, ge=1, le=300),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> dict:
    query = select(DealApplication).options(selectinload(DealApplication.deal))
    if deal_id is not None:
        query = query.where(DealApplication.deal_id == deal_id)
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(query.order_by(DealApplication.created_at.desc()).offset(offset).limit(limit)).all()
    return {"items": [_application_read(item, include_deal=True) for item in items], "total": total}


@router.patch("/applications/{application_id}", response_model=ApplicationRead)
def update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
) -> dict:
    if payload.status not in APPLICATION_STATUSES:
        raise HTTPException(status_code=422, detail="Unsupported application status")
    application = db.get(DealApplication, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    application.status = payload.status
    db.commit()
    db.refresh(application)
    return _application_read(application)


def _application_counts(db: Session, deal_ids: list[int]) -> dict[int, int]:
    if not deal_ids:
        return {}
    rows = db.execute(
        select(DealApplication.deal_id, func.count(DealApplication.id))
        .where(DealApplication.deal_id.in_(deal_ids))
        .group_by(DealApplication.deal_id)
    ).all()
    return {deal_id: count for deal_id, count in rows}


def _deal_read(deal: MarketplaceDeal, application_count: int) -> dict:
    return {
        "id": deal.id,
        "external_id": deal.external_id,
        "brand_name": deal.brand_name,
        "title": deal.title,
        "city": deal.city,
        "budget_min": deal.budget_min,
        "budget_max": deal.budget_max,
        "target_tracks": deal.target_tracks or [],
        "target_audience": deal.target_audience,
        "deliverable": deal.deliverable,
        "brief": deal.brief,
        "contact_wechat": deal.contact_wechat,
        "status": deal.status,
        "source": deal.source,
        "merchant_key": deal.merchant_key,
        "merchant_display_name": deal.merchant_display_name,
        "reason_tags": deal.reason_tags or [],
        "min_followers": deal.min_followers,
        "max_followers": deal.max_followers,
        "match_score": deal.match_score,
        "suggested_payout": deal.suggested_payout,
        "application_count": application_count,
        "created_at": deal.created_at,
        "updated_at": deal.updated_at,
    }


def _application_read(application: DealApplication, include_deal: bool = False) -> dict:
    return {
        "id": application.id,
        "deal_id": application.deal_id,
        "nickname": application.nickname,
        "wechat": application.wechat,
        "profile_link": application.profile_link,
        "expected_quote": application.expected_quote,
        "note": application.note,
        "status": application.status,
        "created_at": application.created_at,
        "updated_at": application.updated_at,
        "deal": _deal_read(application.deal, 0) if include_deal and application.deal else None,
    }


def _merchant_external_id(brand_name: str, title: str) -> str:
    base = f"merchant-{brand_name.strip()}-{title.strip()}".replace(" ", "-")
    return f"{base[:120]}-{uuid4().hex[:10]}"
