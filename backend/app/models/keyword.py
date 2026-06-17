from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.project import utc_now
from app.models.types import id_type


class Keyword(Base):
    __tablename__ = "keywords"
    __table_args__ = (UniqueConstraint("project_id", "keyword", "platform", name="uq_keywords_project_keyword_platform"),)

    id: Mapped[int] = mapped_column(id_type(), primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(id_type(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    keyword: Mapped[str] = mapped_column(String(255), nullable=False)
    parent_keyword_id: Mapped[int | None] = mapped_column(id_type(), ForeignKey("keywords.id"))
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    priority_level: Mapped[str] = mapped_column(String(20), default="B")
    collect_limit: Mapped[int] = mapped_column(Integer, default=100)
    collect_frequency: Mapped[str] = mapped_column(String(50), default="daily")
    collect_comments: Mapped[bool] = mapped_column(Boolean, default=False)
    track_creators: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[str] = mapped_column(String(50), default="active")
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    project = relationship("Project", back_populates="keywords")
    parent = relationship("Keyword", remote_side=[id])
    posts = relationship("Post", back_populates="keyword")
    jobs = relationship("CollectionJob", back_populates="keyword")
