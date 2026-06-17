from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, Boolean, DateTime, JSON, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.project import utc_now
from app.models.types import id_type


class Creator(Base):
    __tablename__ = "creators"
    __table_args__ = (UniqueConstraint("platform", "platform_creator_id", name="uq_creators_platform_creator_id"),)

    id: Mapped[int] = mapped_column(id_type(), primary_key=True, index=True)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    platform_creator_id: Mapped[str] = mapped_column(String(255), nullable=False)
    nickname: Mapped[str | None] = mapped_column(String(255))
    profile_url: Mapped[str | None] = mapped_column(Text)
    bio: Mapped[str | None] = mapped_column(Text)
    avatar_url: Mapped[str | None] = mapped_column(Text)
    follower_count: Mapped[int] = mapped_column(BigInteger, default=0)
    following_count: Mapped[int] = mapped_column(BigInteger, default=0)
    total_likes: Mapped[int] = mapped_column(BigInteger, default=0)
    content_count: Mapped[int] = mapped_column(BigInteger, default=0)
    category_tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    is_brand_account: Mapped[bool] = mapped_column(Boolean, default=False)
    is_mcn_account: Mapped[bool] = mapped_column(Boolean, default=False)
    creator_type: Mapped[str | None] = mapped_column(String(50))
    creator_score: Mapped[Decimal] = mapped_column(Numeric(7, 2), default=0)
    raw_json: Mapped[dict | None] = mapped_column(JSON)
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    posts = relationship("Post", back_populates="creator")
    snapshots = relationship("CreatorSnapshot", back_populates="creator", cascade="all, delete-orphan")
