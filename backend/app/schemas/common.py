from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, field_serializer


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class DecimalAsFloatModel(ORMModel):
    @field_serializer("relevance_score", "creator_score", "hot_score", check_fields=False)
    def serialize_decimal(self, value: Decimal | None) -> float | None:
        return float(value) if value is not None else None


class TimeRangePoint(BaseModel):
    date: datetime | str
    count: int
