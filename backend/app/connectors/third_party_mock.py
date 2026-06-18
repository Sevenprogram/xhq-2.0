from datetime import datetime, timezone

from app.connectors.base import BaseConnector


class ThirdPartyAPIConnector(BaseConnector):
    platform = "mixed"
    source_type = "third_party_mock"

    def search_posts(self, keyword: str, limit: int = 100, cursor: str | None = None) -> list[dict]:
        rows = [
            {
                "platform": "xiaohongshu",
                "platform_post_id": f"mock_xhs_{keyword}_001",
                "keyword": keyword,
                "title": f"{keyword}相关笔记观察",
                "content_text": "家长正在关注青春期心理、亲子沟通和心理咨询。",
                "creator_platform_id": "mock_creator_xhs_001",
                "creator_nickname": "亲子心理观察",
                "creator_profile_url": "https://example.com/mock/xhs/creator",
                "publish_time": datetime.now(timezone.utc).isoformat(),
                "like_count": 680,
                "comment_count": 88,
                "collect_count": 260,
                "share_count": 42,
                "tags": ["亲子沟通", "心理健康", keyword],
                "url": "https://example.com/mock/xhs/post",
            },
            {
                "platform": "douyin",
                "platform_post_id": f"mock_dy_{keyword}_001",
                "keyword": keyword,
                "title": f"青春期孩子厌学背后的{keyword}线索",
                "content_text": "短视频评论区常出现求助、问机构和问方法的需求。",
                "creator_platform_id": "mock_creator_dy_001",
                "creator_nickname": "青少年心理老师",
                "creator_profile_url": "https://example.com/mock/dy/creator",
                "publish_time": datetime.now(timezone.utc).isoformat(),
                "like_count": 2100,
                "comment_count": 310,
                "collect_count": 900,
                "share_count": 190,
                "tags": ["青少年心理", "厌学", "家庭教育"],
                "url": "https://example.com/mock/dy/post",
            },
        ]
        return rows[:limit]
