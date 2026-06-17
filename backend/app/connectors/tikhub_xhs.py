from typing import Any
from urllib.parse import urljoin

import httpx

from app.config import get_settings


class TikHubConfigError(RuntimeError):
    pass


def fetch_tikhub_xhs_user_info(user_id: str) -> dict[str, Any]:
    settings = get_settings()
    if not settings.tikhub_api_base_url:
        raise TikHubConfigError("TIKHUB_API_BASE_URL is not configured")
    if not settings.tikhub_api_token:
        raise TikHubConfigError("TIKHUB_API_TOKEN is not configured")

    url = urljoin(settings.tikhub_api_base_url.rstrip("/") + "/", "api/v1/xiaohongshu/web_v2/fetch_user_info_app")
    headers = {"Authorization": _bearer_value(settings.tikhub_api_token)}

    with httpx.Client(timeout=settings.tikhub_api_timeout) as client:
        response = client.get(url, params={"user_id": user_id}, headers=headers)
        response.raise_for_status()
        return response.json()


def fetch_tikhub_xhs_web_v2_user_info(user_id: str) -> dict[str, Any]:
    return fetch_tikhub_xhs_user_info(user_id)


def _bearer_value(token: str) -> str:
    value = token.strip()
    return value if value.lower().startswith("bearer ") else f"Bearer {value}"
