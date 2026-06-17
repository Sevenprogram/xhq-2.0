from app.database import SessionLocal
from app.models import Keyword
from app.services.import_service import run_keyword_mock_collection
from app.workers.celery_app import celery_app


@celery_app.task(bind=True, autoretry_for=(Exception,), retry_kwargs={"max_retries": 3, "countdown": 300})
def daily_keyword_collection(self, keyword_id: int) -> int:
    with SessionLocal() as db:
        job = run_keyword_mock_collection(db, keyword_id)
        return job.id


@celery_app.task
def enqueue_active_keywords() -> int:
    with SessionLocal() as db:
        keywords = db.query(Keyword).filter(Keyword.status == "active").all()
        for keyword in keywords:
            daily_keyword_collection.delay(keyword.id)
        return len(keywords)
