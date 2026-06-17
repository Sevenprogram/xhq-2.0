from __future__ import annotations

from typing import Any

import httpx

from app.config import get_settings


class JustOneConfigError(RuntimeError):
    pass


class JustOneAPIError(RuntimeError):
    pass


TRACK_SEARCH_KEYWORDS: dict[str, str] = {
    "全部教育": "教育",
    "青少年教育": "青少年教育",
    "学科辅导": "中考数学",
    "小学教育": "小学教育",
    "家庭教育": "家庭教育",
    "素质教育": "户外研学",
    "升学规划": "国际教育",
}


def search_pgy_creators(track: str, limit: int = 20) -> list[dict[str, Any]]:
    settings = get_settings()
    if not settings.justone_api_token:
        raise JustOneConfigError("JUSTONE_API_TOKEN is not configured")

    keyword = TRACK_SEARCH_KEYWORDS.get(track, track or "教育")
    params = {
        "token": settings.justone_api_token,
        "keyword": keyword,
        "searchType": "NOTE",
        "page": 1,
        "excludeLowActive": True,
        "fansNumUp": True,
    }
    url = f"{settings.justone_api_base_url.rstrip('/')}/api/xiaohongshu-pgy/api/solar/cooperator/blogger/v2/v1"

    try:
        response = httpx.get(url, params=params, timeout=settings.justone_api_timeout)
        response.raise_for_status()
        payload = response.json()
    except httpx.HTTPError as exc:
        raise JustOneAPIError(f"Just One API request failed: {exc}") from exc
    except ValueError as exc:
        raise JustOneAPIError("Just One API returned non-JSON response") from exc

    code = payload.get("code")
    if code not in (0, "0", None):
        message = payload.get("msg") or payload.get("message") or "business error"
        raise JustOneAPIError(f"Just One API returned code {code}: {message}")

    data = payload.get("data") or {}
    kols = data.get("kols") or data.get("list") or data.get("items") or []
    if not isinstance(kols, list):
        raise JustOneAPIError("Just One API response data.kols is not a list")

    return [_normalize_creator(item) for item in kols[:limit] if isinstance(item, dict)]


def _normalize_creator(item: dict[str, Any]) -> dict[str, Any]:
    nickname = _pick(item, "nickName", "nickname", "name", "bloggerName", "userName") or "蒲公英达人"
    user_id = _pick(item, "userId", "user_id", "bloggerId", "kolId", "redId", "red_id") or nickname
    fans = _pick_number(item, "fansNum", "fansCount", "followerCount", "followers", "fans")
    notes = _pick_number(item, "noteNum", "noteCount", "contentCount", "content_num")
    interactions = _pick_number(item, "interactionNum", "interactions", "likeCollectNum", "likedCount")
    quote = _pick_number(item, "price", "priceNote", "notePrice", "videoPrice", "quotePrice")
    location = _pick(item, "location", "cityName", "provinceName", "ipLocation")

    return {
        "id": str(user_id),
        "name": str(nickname),
        "location": str(location or ""),
        "followers": fans,
        "content_count": notes,
        "interactions": interactions,
        "estimated_exposure": max(interactions * 8, fans * 2, notes * 18000),
        "quote": quote,
        "trend": _trend(interactions, fans),
        "raw": item,
    }


def _pick(item: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        value = item.get(key)
        if value not in (None, ""):
            return value
    return None


def _pick_number(item: dict[str, Any], *keys: str) -> int:
    value = _pick(item, *keys)
    return _parse_count(value)


def _parse_count(value: Any) -> int:
    if value in (None, ""):
        return 0
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, (int, float)):
        return int(value)
    text = str(value).strip().replace(",", "")
    multiplier = 1
    if "万" in text:
        multiplier = 10000
    cleaned = "".join(char for char in text if char.isdigit() or char == ".")
    if not cleaned:
        return 0
    return int(float(cleaned) * multiplier)


def _trend(interactions: int, followers: int) -> str:
    if interactions >= 200000 or followers >= 100000:
        return "快速上升"
    if interactions >= 50000 or followers >= 30000:
        return "上升"
    return "稳定"
