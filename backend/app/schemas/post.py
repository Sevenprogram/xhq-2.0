from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.common import DecimalAsFloatModel, ORMModel


class CreatorMini(ORMModel):
    id: int
    platform: str
    platform_creator_id: str
    nickname: str | None = None
    profile_url: str | None = None


class PostRead(DecimalAsFloatModel):
    id: int
    platform: str
    platform_post_id: str
    project_id: int | None = None
    keyword_id: int | None = None
    creator_id: int | None = None
    url: str | None = None
    title: str | None = None
    content_text: str | None = None
    summary: str | None = None
    media_type: str
    publish_time: datetime | None = None
    cover_url: str | None = None
    tags: list[str] = []
    like_count: int
    comment_count: int
    collect_count: int
    share_count: int
    relevance_score: Decimal
    is_ad_suspected: bool
    brand_mentions: list[str] = []
    raw_json: dict | None = None
    first_seen_at: datetime
    last_seen_at: datetime
    created_at: datetime
    updated_at: datetime
    creator: CreatorMini | None = None


class PostSnapshotRead(ORMModel):
    id: int
    post_id: int
    platform: str
    like_count: int
    comment_count: int
    collect_count: int
    share_count: int
    rank_position: int | None = None
    captured_at: datetime


class HotPostRead(PostRead):
    hot_score: float = 0
    like_growth_24h: int = 0
    comment_growth_24h: int = 0
    collect_like_ratio: float = 0
    comment_like_ratio: float = 0


class PostListResponse(BaseModel):
    items: list[PostRead]
    total: int
