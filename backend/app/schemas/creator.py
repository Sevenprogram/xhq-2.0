from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.common import DecimalAsFloatModel, ORMModel
from app.schemas.post import PostRead


class CreatorRead(DecimalAsFloatModel):
    id: int
    platform: str
    platform_creator_id: str
    nickname: str | None = None
    profile_url: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    follower_count: int
    following_count: int
    total_likes: int
    content_count: int
    category_tags: list[str] = []
    is_brand_account: bool
    is_mcn_account: bool
    creator_type: str | None = None
    creator_score: Decimal
    raw_json: dict | None = None
    first_seen_at: datetime
    last_seen_at: datetime
    created_at: datetime
    updated_at: datetime


class CreatorSnapshotRead(ORMModel):
    id: int
    creator_id: int
    platform: str
    follower_count: int
    following_count: int
    total_likes: int
    content_count: int
    captured_at: datetime


class CreatorListResponse(BaseModel):
    items: list[CreatorRead]
    total: int


class CreatorPostsResponse(BaseModel):
    creator: CreatorRead
    posts: list[PostRead]
