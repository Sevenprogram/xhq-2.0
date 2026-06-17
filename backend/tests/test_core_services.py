import unittest
from datetime import datetime, timezone

from app.services.normalize_service import fallback_post_id, normalize_post
from app.services.scoring_service import calculate_relevance_score, score_band
from app.connectors.justone_pgy import _parse_count
from app.config import Settings


class NormalizeServiceTest(unittest.TestCase):
    def test_normalize_csv_row_parses_tags_counts_and_utc_time(self):
        post = normalize_post(
            {
                "platform": "xiaohongshu",
                "platform_post_id": "xhs_001",
                "title": "孩子最近总是不说话怎么办",
                "content_text": "关于青春期孩子心理变化的分享",
                "creator_platform_id": "creator_001",
                "creator_nickname": "亲子心理观察",
                "publish_time": "2026-05-20 10:00:00",
                "like_count": "1,200",
                "comment_count": "180",
                "tags": "亲子沟通;心理健康;青春期",
            }
        )

        self.assertEqual(post.platform, "xiaohongshu")
        self.assertEqual(post.platform_post_id, "xhs_001")
        self.assertEqual(post.like_count, 1200)
        self.assertEqual(post.comment_count, 180)
        self.assertEqual(post.tags, ["亲子沟通", "心理健康", "青春期"])
        self.assertEqual(post.publish_time.tzinfo, timezone.utc)

    def test_fallback_post_id_is_stable_without_platform_post_id(self):
        published = datetime(2026, 5, 20, 10, 0, tzinfo=timezone.utc)
        first = fallback_post_id("douyin", None, "青春期心理", "心理老师", published)
        second = fallback_post_id("douyin", None, "青春期心理", "心理老师", published)

        self.assertEqual(first, second)
        self.assertTrue(first.startswith("content_"))


class ScoringServiceTest(unittest.TestCase):
    def test_title_and_body_keyword_hits_score_higher_than_unrelated_content(self):
        related = normalize_post(
            {
                "platform": "douyin",
                "platform_post_id": "dy_001",
                "title": "青春期孩子厌学背后的心理原因",
                "content_text": "青少年心理健康和亲子沟通需要持续关注",
                "creator_bio": "青少年心理咨询老师",
                "tags": "青少年心理;厌学;家庭教育",
                "like_count": 3200,
                "comment_count": 420,
                "publish_time": "2026-05-21 12:00:00",
            }
        )
        unrelated = normalize_post(
            {
                "platform": "douyin",
                "platform_post_id": "dy_002",
                "title": "周末旅游穿搭分享",
                "content_text": "美食和旅游路线记录",
                "tags": "旅游;穿搭",
                "like_count": 30,
                "comment_count": 1,
            }
        )

        related_score = calculate_relevance_score(
            related,
            "青少年心理健康",
            ["青春期心理", "亲子沟通", "孩子厌学", "青少年心理"],
            batch_like_median=100,
            batch_comment_median=10,
        )
        unrelated_score = calculate_relevance_score(
            unrelated,
            "青少年心理健康",
            ["青春期心理", "亲子沟通", "孩子厌学", "青少年心理"],
            batch_like_median=100,
            batch_comment_median=10,
        )

        self.assertGreater(related_score, unrelated_score)
        self.assertGreaterEqual(related_score, 60)
        self.assertEqual(score_band(related_score), "核心内容")


class JustOnePgyConnectorTest(unittest.TestCase):
    def test_parse_count_handles_xiaohongshu_count_text(self):
        self.assertEqual(_parse_count("3.8万"), 38000)
        self.assertEqual(_parse_count("10万+"), 100000)
        self.assertEqual(_parse_count("1,280"), 1280)
        self.assertEqual(_parse_count(""), 0)


class SettingsTest(unittest.TestCase):
    def test_cors_origins_accepts_json_comma_and_single_url(self):
        self.assertEqual(Settings(cors_origins='["https://app.example.com"]').cors_origin_list, ["https://app.example.com"])
        self.assertEqual(
            Settings(cors_origins="https://app.example.com, https://admin.example.com").cors_origin_list,
            ["https://app.example.com", "https://admin.example.com"],
        )
        self.assertEqual(Settings(cors_origins="https://app.example.com").cors_origin_list, ["https://app.example.com"])


if __name__ == "__main__":
    unittest.main()
