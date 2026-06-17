import json

from app.connectors.base import BaseConnector


class JSONImportConnector(BaseConnector):
    platform = "mixed"
    source_type = "json"

    def __init__(self, content: str):
        self.content = content

    def search_posts(self, keyword: str = "", limit: int = 100, cursor: str | None = None) -> list[dict]:
        payload = json.loads(self.content)
        if isinstance(payload, list):
            rows = payload
        elif isinstance(payload, dict):
            rows = payload.get("posts") or payload.get("items") or payload.get("data") or []
        else:
            rows = []
        return rows[:limit] if limit else rows
