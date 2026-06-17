from pydantic import BaseModel

from app.schemas.creator import CreatorRead
from app.schemas.post import HotPostRead


class CountPoint(BaseModel):
    date: str
    count: int


class PlatformPoint(BaseModel):
    platform: str
    count: int


class DashboardSummary(BaseModel):
    project_count: int
    keyword_count: int
    post_count: int
    creator_count: int
    today_new_posts: int
    today_hot_posts: int
    seven_day_growth: list[CountPoint]
    platform_distribution: list[PlatformPoint]
    hot_posts: list[HotPostRead]
    top_creators: list[CreatorRead]


class KeywordTrendPoint(BaseModel):
    date: str
    keyword_id: int | None = None
    keyword: str | None = None
    platform: str | None = None
    count: int


class PostGrowthPoint(BaseModel):
    post_id: int
    title: str | None = None
    platform: str
    like_growth_24h: int
    comment_growth_24h: int
    collect_growth_24h: int
    share_growth_24h: int
