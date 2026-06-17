from fastapi import APIRouter, HTTPException, Query

from app.connectors.justone_pgy import JustOneAPIError, JustOneConfigError, search_pgy_creators

router = APIRouter(prefix="/marketplace", tags=["marketplace"])


@router.get("/pgy-creators")
def pgy_creators(track: str = Query("全部教育"), limit: int = Query(20, ge=1, le=50)) -> dict:
    try:
        creators = search_pgy_creators(track=track, limit=limit)
    except JustOneConfigError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except JustOneAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {"track": track, "items": creators}
