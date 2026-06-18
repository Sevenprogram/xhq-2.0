from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_serializer, field_validator

from app.schemas.common import ORMModel


DEAL_STATUSES = {"published", "offline", "pending_review"}
APPLICATION_STATUSES = {"pending_contact", "contacted", "selected", "rejected"}


class DealBase(BaseModel):
    brand_name: str = Field(..., min_length=1, max_length=255)
    title: str = Field(..., min_length=1, max_length=255)
    city: str = Field(default="全国", min_length=1, max_length=80)
    budget_min: int = Field(..., ge=0)
    budget_max: int = Field(..., ge=0)
    target_tracks: list[str] = Field(default_factory=list)
    target_audience: str = ""
    deliverable: str = ""
    brief: str = ""
    contact_wechat: str = ""

    @field_validator("budget_max")
    @classmethod
    def validate_budget_range(cls, value: int, info) -> int:
        min_value = info.data.get("budget_min")
        if min_value is not None and value < min_value:
            raise ValueError("budget_max must be greater than or equal to budget_min")
        return value

    @field_validator("target_tracks")
    @classmethod
    def clean_tracks(cls, value: list[str]) -> list[str]:
        return [item.strip() for item in value if item.strip()]


class DealCreate(DealBase):
    pass


class DealRead(DealBase, ORMModel):
    id: int
    external_id: str
    status: str
    source: str
    merchant_key: str | None = None
    merchant_display_name: str | None = None
    reason_tags: list[str] = []
    min_followers: int
    max_followers: int
    match_score: int
    suggested_payout: Decimal
    application_count: int = 0
    created_at: datetime
    updated_at: datetime

    @field_serializer("suggested_payout")
    def serialize_suggested_payout(self, value: Decimal) -> float:
        return float(value)


class DealListResponse(BaseModel):
    items: list[DealRead]
    total: int


class ApplicationCreate(BaseModel):
    wechat: str = Field(..., min_length=1, max_length=120)
    profile_link: str = Field(..., min_length=1)
    expected_quote: int | None = Field(default=None, ge=0)
    note: str | None = None
    nickname: str | None = Field(default=None, max_length=120)


class ApplicationStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in APPLICATION_STATUSES:
            raise ValueError("Unsupported application status")
        return value


class ApplicationRead(ORMModel):
    id: int
    deal_id: int
    nickname: str | None = None
    wechat: str
    profile_link: str
    expected_quote: int | None = None
    note: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime
    deal: DealRead | None = None


class ApplicationListResponse(BaseModel):
    items: list[ApplicationRead]
    total: int


class MerchantProfileRead(ORMModel):
    merchant_key: str
    display_name: str
    created_at: datetime
    updated_at: datetime


class MerchantProfileUpdate(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=255)
