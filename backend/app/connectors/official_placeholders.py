from app.connectors.base import BaseConnector


class DouyinOfficialAPIConnector(BaseConnector):
    platform = "douyin"
    source_type = "official_api_placeholder"

    def search_posts(self, keyword: str, limit: int = 100, cursor: str | None = None) -> list[dict]:
        raise NotImplementedError("Douyin official API connector is reserved for authorized access.")


class XiaohongshuOfficialAPIConnector(BaseConnector):
    platform = "xiaohongshu"
    source_type = "official_api_placeholder"

    def search_posts(self, keyword: str, limit: int = 100, cursor: str | None = None) -> list[dict]:
        raise NotImplementedError("Xiaohongshu official API connector is reserved for authorized access.")
