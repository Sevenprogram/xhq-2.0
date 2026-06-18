import unittest
from datetime import datetime, timezone
from unittest.mock import patch

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.marketplace import create_deal, list_deals, submit_application, update_application_status, update_merchant_profile
from app.database import Base
from app.models import DealApplication, MarketplaceDeal
from app.schemas.marketplace import ApplicationCreate, ApplicationStatusUpdate, DealCreate, MerchantProfileUpdate
from app.services.merchant_defaults import DEFAULT_MERCHANT_KEY
from app.services.marketplace_seed import seed_marketplace_deals
from app.services.normalize_service import fallback_post_id, normalize_post
from app.services.scoring_service import calculate_relevance_score, score_band
from app.connectors.justone_pgy import _parse_count
from app.config import Settings
from app.api.dataflow import _extract_xhs_user_id, _find_tikhub_user_search_match, _resolve_xhs_user_value


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


class XhsUserResolveTest(unittest.TestCase):
    def test_extract_xhs_user_id_from_profile_url(self):
        url = "https://www.xiaohongshu.com/user/profile/618c7bb400000000100076a5?xsec_token=abc"
        self.assertEqual(_extract_xhs_user_id(url), "618c7bb400000000100076a5")

    def test_find_tikhub_user_search_match_prefers_exact_red_id(self):
        payload = {
            "data": {
                "data": {
                    "users": [
                        {"id": "other", "red_id": "abc", "name": "wrong"},
                        {"id": "618c7bb400000000100076a5", "red_id": "5277123250", "name": "很会吃就是了"},
                    ]
                }
            }
        }
        match = _find_tikhub_user_search_match("5277123250", payload)
        self.assertEqual(match["id"], "618c7bb400000000100076a5")

    def test_find_tikhub_user_search_match_does_not_fallback_for_numeric_red_id(self):
        payload = {"data": {"data": {"users": [{"id": "other", "red_id": "26500250358", "name": "小红薯"}]}}}
        self.assertIsNone(_find_tikhub_user_search_match("5277123250", payload))

    def test_resolve_numeric_red_id_uses_search_before_profile_lookup(self):
        payload = {
            "data": {
                "data": {
                    "users": [
                        {"id": "618c7bb400000000100076a5", "red_id": "743613526", "name": "测试达人"},
                    ]
                }
            }
        }
        with patch("app.api.dataflow.search_tikhub_xhs_users", return_value=payload):
            resolved = _resolve_xhs_user_value("743613526")

        self.assertEqual(resolved.user_id, "618c7bb400000000100076a5")
        self.assertEqual(resolved.red_id, "743613526")
        self.assertEqual(resolved.match_type, "red_id")


class MarketplaceTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine, autoflush=False, autocommit=False)

    def tearDown(self):
        Base.metadata.drop_all(bind=self.engine)

    def test_seed_marketplace_deals_is_idempotent(self):
        with self.SessionLocal() as db:
            first = seed_marketplace_deals(db)
            second = seed_marketplace_deals(db)
            deals = db.query(MarketplaceDeal).all()

        self.assertGreater(first, 0)
        self.assertEqual(second, 0)
        self.assertEqual(len(deals), first)

    def test_create_deal_submit_application_and_update_status(self):
        with self.SessionLocal() as db:
            deal = create_deal(
                DealCreate(
                    brand_name="测试品牌",
                    title="测试商单",
                    city="深圳",
                    budget_min=100,
                    budget_max=300,
                    target_tracks=["教育成长"],
                    target_audience="家长",
                    deliverable="小红书图文 1 条",
                    brief="测试说明",
                    contact_wechat="brand_wechat",
                ),
                db,
            )
            application = submit_application(
                deal["id"],
                ApplicationCreate(wechat="creator_wechat", profile_link="https://www.xiaohongshu.com/user/profile/test"),
                db,
            )
            updated = update_application_status(application["id"], ApplicationStatusUpdate(status="contacted"), db)

            saved = db.get(DealApplication, application["id"])

        self.assertEqual(deal["status"], "published")
        self.assertEqual(deal["merchant_key"], DEFAULT_MERCHANT_KEY)
        self.assertEqual(application["status"], "pending_contact")
        self.assertEqual(updated["status"], "contacted")
        self.assertEqual(saved.status, "contacted")

    def test_merchant_profile_and_deal_filter(self):
        with self.SessionLocal() as db:
            profile = update_merchant_profile(MerchantProfileUpdate(display_name="新测试商家"), db)
            merchant_deal = create_deal(
                DealCreate(
                    brand_name="测试品牌",
                    title="测试商单",
                    city="深圳",
                    budget_min=100,
                    budget_max=300,
                    target_tracks=["教育成长"],
                    target_audience="家长",
                    deliverable="小红书图文 1 条",
                    brief="测试说明",
                    contact_wechat="brand_wechat",
                ),
                db,
            )
            seed_marketplace_deals(db)
            merchant_list = list_deals(merchant_key=DEFAULT_MERCHANT_KEY, include_offline=True, limit=20, offset=0, db=db)

        self.assertEqual(profile["display_name"], "新测试商家")
        self.assertEqual(merchant_deal["merchant_display_name"], "新测试商家")
        self.assertEqual(merchant_list["total"], 1)
        self.assertEqual(merchant_list["items"][0]["id"], merchant_deal["id"])

    def test_duplicate_application_is_rejected(self):
        with self.SessionLocal() as db:
            deal = create_deal(
                DealCreate(
                    brand_name="测试品牌",
                    title="测试商单",
                    city="深圳",
                    budget_min=100,
                    budget_max=300,
                    target_tracks=["教育成长"],
                    target_audience="家长",
                    deliverable="小红书图文 1 条",
                    brief="测试说明",
                    contact_wechat="brand_wechat",
                ),
                db,
            )
            payload = ApplicationCreate(wechat="creator_wechat", profile_link="https://www.xiaohongshu.com/user/profile/test")
            submit_application(deal["id"], payload, db)
            with self.assertRaises(HTTPException):
                submit_application(deal["id"], payload, db)


if __name__ == "__main__":
    unittest.main()
