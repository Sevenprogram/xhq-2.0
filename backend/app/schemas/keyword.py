from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class KeywordBase(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=255)
    parent_keyword_id: int | None = None
    platform: str
    priority_level: str = "B"
    collect_limit: int = 100
    collect_frequency: str = "daily"
    collect_comments: bool = False
    track_creators: bool = True
    status: str = "active"


class KeywordCreate(KeywordBase):
    pass


class KeywordUpdate(BaseModel):
    keyword: str | None = Field(default=None, min_length=1, max_length=255)
    parent_keyword_id: int | None = None
    platform: str | None = None
    priority_level: str | None = None
    collect_limit: int | None = None
    collect_frequency: str | None = None
    collect_comments: bool | None = None
    track_creators: bool | None = None
    status: str | None = None


class KeywordRead(KeywordBase, ORMModel):
    id: int
    project_id: int
    last_checked_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
