from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CollectionJob
from app.schemas.job import CollectionJobRead

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("", response_model=list[CollectionJobRead])
def list_jobs(limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)) -> list[CollectionJob]:
    return list(db.scalars(select(CollectionJob).order_by(CollectionJob.created_at.desc()).limit(limit)))


@router.get("/{job_id}", response_model=CollectionJobRead)
def get_job(job_id: int, db: Session = Depends(get_db)) -> CollectionJob:
    job = db.get(CollectionJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
