import json
from typing import Any
from urllib.parse import urljoin

import httpx

from app.config import get_settings


class DataflowConfigError(RuntimeError):
    pass


def fetch_xhs_app_user_info(user_id: str) -> dict[str, Any]:
    settings = get_settings()
    if not settings.dataflow_base_url:
        raise DataflowConfigError("DATAFLOW_BASE_URL is not configured")
    if not settings.dataflow_api_key:
        raise DataflowConfigError("DATAFLOW_API_KEY is not configured")

    url = urljoin(settings.dataflow_base_url.rstrip("/") + "/", "api/xhs/v2/appuserinfo")
    headers = {"Authorization": _authorization_value(settings.dataflow_api_key, settings.dataflow_auth_scheme)}

    with httpx.Client(timeout=20) as client:
        response = client.get(url, params={"userId": user_id}, headers=headers)
        response.raise_for_status()
        payload = response.json()

    data = payload.get("data") if isinstance(payload, dict) else payload
    if isinstance(data, str):
        try:
            decoded = json.loads(data)
        except json.JSONDecodeError:
            decoded = {"raw_data": data}
    elif isinstance(data, dict):
        decoded = data
    else:
        decoded = {}

    return {"outer": payload, "body": decoded}


def fetch_xhs_app_user_posts(user_id: str, cursor: str | None = None) -> dict[str, Any]:
    settings = get_settings()
    if not settings.dataflow_base_url:
        raise DataflowConfigError("DATAFLOW_BASE_URL is not configured")
    if not settings.dataflow_api_key:
        raise DataflowConfigError("DATAFLOW_API_KEY is not configured")

    url = urljoin(settings.dataflow_base_url.rstrip("/") + "/", "api/xhs/appuserposted")
    headers = {"Authorization": _authorization_value(settings.dataflow_api_key, settings.dataflow_auth_scheme)}
    params = {"userId": user_id}
    if cursor:
        params["cursor"] = cursor

    with httpx.Client(timeout=30) as client:
        response = client.get(url, params=params, headers=headers)
        response.raise_for_status()
        payload = response.json()

    data = payload.get("data") if isinstance(payload, dict) else payload
    if isinstance(data, str):
        try:
            decoded = json.loads(data)
        except json.JSONDecodeError:
            decoded = {"raw_data": data}
    elif isinstance(data, dict):
        decoded = data
    else:
        decoded = {}

    return {"outer": payload, "body": decoded}


def _authorization_value(api_key: str, auth_scheme: str) -> str:
    key = api_key.strip()
    if key.lower().startswith(("bearer ", "token ")):
        return key
    scheme = auth_scheme.strip()
    return f"{scheme} {key}".strip() if scheme else key
