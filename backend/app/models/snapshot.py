from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.project import utc_now
from app.models.types import id_type


class PostSnapshot(Base):
    __tablename__ = "post_snapshots"

    id: Mapped[int] = mapped_column(id_type(), primary_key=True, index=True)
    post_id: Mapped[int] = mapped_column(id_type(), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    like_count: Mapped[int] = mapped_column(BigInteger, default=0)
    comment_count: Mapped[int] = mapped_column(BigInteger, default=0)
    collect_count: Mapped[int] = mapped_column(BigInteger, default=0)
    share_count: Mapped[int] = mapped_column(BigInteger, default=0)
    rank_position: Mapped[int | None] = mapped_column(Integer)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)

    post = relationship("Post", back_populates="snapshots")


class CreatorSnapshot(Base):
    __tablename__ = "creator_snapshots"

    id: Mapped[int] = mapped_column(id_type(), primary_key=True, index=True)
    creator_id: Mapped[int] = mapped_column(id_type(), ForeignKey("creators.id", ondelete="CASCADE"), nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    follower_count: Mapped[int] = mapped_column(BigInteger, default=0)
    following_count: Mapped[int] = mapped_column(BigInteger, default=0)
    total_likes: Mapped[int] = mapped_column(BigInteger, default=0)
    content_count: Mapped[int] = mapped_column(BigInteger, default=0)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)

    creator = relationship("Creator", back_populates="snapshots")
