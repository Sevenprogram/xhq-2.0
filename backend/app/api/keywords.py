from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Keyword, Project
from app.schemas.job import CollectionJobRead
from app.schemas.keyword import KeywordCreate, KeywordRead, KeywordUpdate
from app.services.import_service import run_keyword_mock_collection

router = APIRouter(tags=["keywords"])


@router.post("/projects/{project_id}/keywords", response_model=KeywordRead, status_code=status.HTTP_201_CREATED)
def create_keyword(project_id: int, payload: KeywordCreate, db: Session = Depends(get_db)) -> Keyword:
    if not db.get(Project, project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    keyword = Keyword(project_id=project_id, **payload.model_dump())
    db.add(keyword)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Keyword already exists for this project and platform") from exc
    db.refresh(keyword)
    return keyword


@router.get("/projects/{project_id}/keywords", response_model=list[KeywordRead])
def list_project_keywords(project_id: int, db: Session = Depends(get_db)) -> list[Keyword]:
    return list(db.scalars(select(Keyword).where(Keyword.project_id == project_id).order_by(Keyword.created_at.desc())))


@router.put("/keywords/{keyword_id}", response_model=KeywordRead)
def update_keyword(keyword_id: int, payload: KeywordUpdate, db: Session = Depends(get_db)) -> Keyword:
    keyword = db.get(Keyword, keyword_id)
    if not keyword:
        raise HTTPException(status_code=404, detail="Keyword not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(keyword, key, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Keyword already exists for this project and platform") from exc
    db.refresh(keyword)
    return keyword


@router.delete("/keywords/{keyword_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_keyword(keyword_id: int, db: Session = Depends(get_db)) -> None:
    keyword = db.get(Keyword, keyword_id)
    if not keyword:
        raise HTTPException(status_code=404, detail="Keyword not found")
    db.delete(keyword)
    db.commit()


@router.post("/keywords/{keyword_id}/run", response_model=CollectionJobRead)
def run_keyword(keyword_id: int, db: Session = Depends(get_db)):
    try:
        return run_keyword_mock_collection(db, keyword_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
