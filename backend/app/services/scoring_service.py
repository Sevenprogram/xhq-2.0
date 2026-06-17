from datetime import datetime, timedelta, timezone
from statistics import median

from app.services.normalize_service import NormalizedPost


VERTICAL_TERMS = ["心理", "亲子", "教育", "咨询", "青春期", "抑郁", "厌学", "霸凌"]
UNRELATED_TERMS = ["美食", "穿搭", "旅游", "游戏", "明星八卦"]
CLICKBAIT_TERMS = ["震惊", "必看", "速看", "千万别", "后悔才知道"]


def calculate_relevance_score(
    post: NormalizedPost,
    main_keyword: str | None,
    related_keywords: list[str] | None = None,
    batch_like_median: float = 0,
    batch_comment_median: float = 0,
) -> int:
    related_keywords = [kw for kw in (related_keywords or []) if kw]
    title = post.title or ""
    content = post.content_text or ""
    tags = post.tags or []
    bio = post.creator.bio if post.creator else ""

    score = 0
    if main_keyword and main_keyword in title:
        score += 30
    if any(kw in title for kw in related_keywords):
        score += 20
    if main_keyword and main_keyword in content:
        score += 20
    if any(kw in content for kw in related_keywords):
        score += 10
    if any((main_keyword and main_keyword in tag) or any(kw in tag for kw in related_keywords) for tag in tags):
        score += 10
    if any(term in (bio or "") for term in VERTICAL_TERMS):
        score += 10
    if batch_like_median and post.like_count > batch_like_median:
        score += 5
    if batch_comment_median and post.comment_count > batch_comment_median:
        score += 5

    if post.publish_time:
        age = datetime.now(timezone.utc) - post.publish_time
        if age <= timedelta(days=7):
            score += 5
        elif age <= timedelta(days=30):
            score += 3

    if any(term in f"{title} {content}" for term in UNRELATED_TERMS):
        score -= 30
    if any(term in title for term in CLICKBAIT_TERMS):
        score -= 10

    return max(0, min(100, score))


def score_band(score: int | float) -> str:
    if score >= 80:
        return "核心内容"
    if score >= 60:
        return "高度相关"
    if score >= 40:
        return "一般相关"
    return "低价值内容"


def batch_medians(posts: list[NormalizedPost]) -> tuple[float, float]:
    if not posts:
        return 0, 0
    return float(median([post.like_count for post in posts])), float(median([post.comment_count for post in posts]))
