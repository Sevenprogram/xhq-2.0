from typing import Any

from pydantic import BaseModel


class XhsCreatorProfile(BaseModel):
    source: str = "dataflow"
    user_id: str
    nickname: str | None = None
    avatar_url: str | None = None
    red_id: str | None = None
    bio: str | None = None
    location: str | None = None
    gender: str | None = None
    ip_location: str | None = None
    account_status: str | None = None
    account_status_type: int | None = None
    follower_count: int = 0
    follower_count_display: str | None = None
    following_count: int = 0
    following_count_display: str | None = None
    liked_count: int = 0
    collected_count: int = 0
    like_and_collect_display: str | None = None
    note_count: int = 0
    note_count_display: str | None = None
    engagement_rate: float = 0
    category_tags: list[str] = []
    raw: dict[str, Any]


class XhsResolvedUser(BaseModel):
    source: str = "tikhub"
    input: str
    user_id: str
    red_id: str | None = None
    nickname: str | None = None
    avatar_url: str | None = None
    match_type: str
    raw: dict[str, Any] = {}


class XhsTrackAnalysis(BaseModel):
    user_id: str
    tracks: list[str]
    source: str
    confidence: float
    evidence: list[str] = []
    note_count: int = 0
    message: str | None = None
    raw_code: int | None = None
