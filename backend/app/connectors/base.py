from abc import ABC, abstractmethod


class BaseConnector(ABC):
    platform: str
    source_type: str

    @abstractmethod
    def search_posts(self, keyword: str, limit: int = 100, cursor: str | None = None) -> list[dict]:
        raise NotImplementedError

    def get_post_detail(self, post_id: str) -> dict:
        raise NotImplementedError

    def get_creator_detail(self, creator_id: str) -> dict:
        raise NotImplementedError

    def get_comments(self, post_id: str, limit: int = 100) -> list[dict]:
        raise NotImplementedError
