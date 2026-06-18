from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, JSON, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.project import utc_now
from app.models.types import id_type


class Post(Base):
    __tablename__ = "posts"
    __table_args__ = (UniqueConstraint("platform", "platform_post_id", name="uq_posts_platform_post_id"),)

    id: Mapped[int] = mapped_column(id_type(), primary_key=True, index=True)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    platform_post_id: Mapped[str] = mapped_column(String(255), nullable=False)
    project_id: Mapped[int | None] = mapped_column(id_type(), ForeignKey("projects.id"))
    keyword_id: Mapped[int | None] = mapped_column(id_type(), ForeignKey("keywords.id"))
    creator_id: Mapped[int | None] = mapped_column(id_type(), ForeignKey("creators.id"))
    url: Mapped[str | None] = mapped_column(Text)
    title: Mapped[str | None] = mapped_column(Text)
    content_text: Mapped[str | None] = mapped_column(Text)
    summary: Mapped[str | None] = mapped_column(Text)
    media_type: Mapped[str] = mapped_column(String(50), default="unknown")
    publish_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cover_url: Mapped[str | None] = mapped_column(Text)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    like_count: Mapped[int] = mapped_column(BigInteger, default=0)
    comment_count: Mapped[int] = mapped_column(BigInteger, default=0)
    collect_count: Mapped[int] = mapped_column(BigInteger, default=0)
    share_count: Mapped[int] = mapped_column(BigInteger, default=0)
    relevance_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)
    is_ad_suspected: Mapped[bool] = mapped_column(Boolean, default=False)
    brand_mentions: Mapped[list[str]] = mapped_column(JSON, default=list)
    raw_json: Mapped[dict | None] = mapped_column(JSON)
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    project = relationship("Project", back_populates="posts")
    keyword = relationship("Keyword", back_populates="posts")
    creator = relationship("Creator", back_populates="posts")
    snapshots = relationship("PostSnapshot", back_populates="post", cascade="all, delete-orphan")
