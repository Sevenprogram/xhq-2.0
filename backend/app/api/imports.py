from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CollectionJob
from app.schemas.job import CollectionJobRead
from app.services.import_service import import_csv_content, import_json_content

router = APIRouter(prefix="/import", tags=["imports"])


@router.post("/csv", response_model=CollectionJobRead)
async def import_csv(
    project_id: int = Form(...),
    keyword_id: int | None = Form(default=None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> CollectionJob:
    content = (await file.read()).decode("utf-8-sig")
    try:
        return import_csv_content(db, content, project_id, keyword_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/json", response_model=CollectionJobRead)
async def import_json(
    project_id: int = Form(...),
    keyword_id: int | None = Form(default=None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> CollectionJob:
    content = (await file.read()).decode("utf-8-sig")
    try:
        return import_json_content(db, content, project_id, keyword_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/jobs/{job_id}", response_model=CollectionJobRead)
def get_import_job(job_id: int, db: Session = Depends(get_db)) -> CollectionJob:
    job = db.get(CollectionJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
