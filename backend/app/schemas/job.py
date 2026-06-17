from datetime import datetime

from app.schemas.common import ORMModel


class CollectionJobRead(ORMModel):
    id: int
    project_id: int | None = None
    keyword_id: int | None = None
    platform: str
    job_type: str
    status: str
    source_type: str | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    error_message: str | None = None
    raw_result_count: int
    inserted_count: int
    updated_count: int
    created_at: datetime
