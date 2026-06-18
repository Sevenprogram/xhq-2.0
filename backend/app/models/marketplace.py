from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, JSON, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.project import utc_now
from app.models.types import id_type


class MarketplaceDeal(Base):
    __tablename__ = "marketplace_deals"
    __table_args__ = (UniqueConstraint("external_id", name="uq_marketplace_deals_external_id"),)

    id: Mapped[int] = mapped_column(id_type(), primary_key=True, index=True)
    external_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    brand_name: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(80), default="全国", index=True)
    budget_min: Mapped[int] = mapped_column(default=0)
    budget_max: Mapped[int] = mapped_column(default=0)
    target_tracks: Mapped[list[str]] = mapped_column(JSON, default=list)
    target_audience: Mapped[str] = mapped_column(Text, default="")
    deliverable: Mapped[str] = mapped_column(Text, default="")
    brief: Mapped[str] = mapped_column(Text, default="")
    contact_wechat: Mapped[str] = mapped_column(String(120), default="")
    merchant_key: Mapped[str | None] = mapped_column(String(120), index=True)
    merchant_display_name: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(50), default="published", index=True)
    source: Mapped[str] = mapped_column(String(50), default="merchant")
    reason_tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    min_followers: Mapped[int] = mapped_column(default=0)
    max_followers: Mapped[int] = mapped_column(default=0)
    match_score: Mapped[int] = mapped_column(default=0)
    suggested_payout: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    applications = relationship("DealApplication", back_populates="deal", cascade="all, delete-orphan")


class MerchantProfile(Base):
    __tablename__ = "merchant_profiles"

    id: Mapped[int] = mapped_column(id_type(), primary_key=True, index=True)
    merchant_key: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class DealApplication(Base):
    __tablename__ = "deal_applications"
    __table_args__ = (UniqueConstraint("deal_id", "wechat", "profile_link", name="uq_deal_applications_contact"),)

    id: Mapped[int] = mapped_column(id_type(), primary_key=True, index=True)
    deal_id: Mapped[int] = mapped_column(id_type(), ForeignKey("marketplace_deals.id"), nullable=False, index=True)
    nickname: Mapped[str | None] = mapped_column(String(120))
    wechat: Mapped[str] = mapped_column(String(120), nullable=False)
    profile_link: Mapped[str] = mapped_column(Text, nullable=False)
    expected_quote: Mapped[int | None] = mapped_column()
    note: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="pending_contact", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    deal = relationship("MarketplaceDeal", back_populates="applications")
