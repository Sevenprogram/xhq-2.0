from dataclasses import dataclass, field
from datetime import datetime, timezone
from hashlib import sha256
from typing import Any


PLATFORMS = {"xiaohongshu", "douyin"}


@dataclass
class NormalizedCreator:
    platform_creator_id: str
    nickname: str | None = None
    profile_url: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    follower_count: int = 0
    following_count: int = 0
    total_likes: int = 0
    content_count: int = 0
    category_tags: list[str] = field(default_factory=list)
    raw_json: dict[str, Any] | None = None


@dataclass
class NormalizedPost:
    platform: str
    platform_post_id: str
    keyword: str | None = None
    url: str | None = None
    title: str | None = None
    content_text: str | None = None
    summary: str | None = None
    media_type: str = "unknown"
    creator: NormalizedCreator | None = None
    publish_time: datetime | None = None
    like_count: int = 0
    comment_count: int = 0
    collect_count: int = 0
    share_count: int = 0
    tags: list[str] = field(default_factory=list)
    cover_url: str | None = None
    brand_mentions: list[str] = field(default_factory=list)
    raw_json: dict[str, Any] = field(default_factory=dict)


def normalize_post(raw: dict[str, Any]) -> NormalizedPost:
    platform = _clean_str(_pick(raw, "platform", "平台")) or "unknown"
    platform = platform.lower()
    if platform not in PLATFORMS:
        platform = "unknown"

    title = _clean_str(_pick(raw, "title", "标题"))
    content_text = _clean_str(_pick(raw, "content_text", "content", "正文", "desc", "description"))
    url = _clean_str(_pick(raw, "url", "link", "链接"))
    publish_time = parse_datetime(_pick(raw, "publish_time", "published_at", "发布时间"))
    creator_nickname = _clean_str(_pick(raw, "creator_nickname", "author", "nickname", "达人昵称"))
    creator_profile_url = _clean_str(_pick(raw, "creator_profile_url", "author_url", "profile_url", "达人主页"))
    creator_platform_id = _clean_str(_pick(raw, "creator_platform_id", "platform_creator_id", "creator_id", "达人ID"))
    if not creator_platform_id:
        creator_platform_id = _fallback_id(platform, creator_profile_url, creator_nickname, "creator")

    platform_post_id = _clean_str(_pick(raw, "platform_post_id", "post_id", "note_id", "aweme_id", "内容ID"))
    if not platform_post_id:
        platform_post_id = fallback_post_id(platform, url, title, creator_nickname, publish_time)

    creator = NormalizedCreator(
        platform_creator_id=creator_platform_id,
        nickname=creator_nickname,
        profile_url=creator_profile_url,
        bio=_clean_str(_pick(raw, "creator_bio", "bio", "作者简介")),
        avatar_url=_clean_str(_pick(raw, "avatar_url", "creator_avatar_url")),
        follower_count=_to_int(_pick(raw, "follower_count", "fans_count", "粉丝数")),
        following_count=_to_int(_pick(raw, "following_count", "关注数")),
        total_likes=_to_int(_pick(raw, "total_likes", "获赞数")),
        content_count=_to_int(_pick(raw, "content_count", "作品数")),
        category_tags=_parse_tags(_pick(raw, "creator_tags", "category_tags")),
        raw_json=_nested_dict(raw, "creator"),
    )

    return NormalizedPost(
        platform=platform,
        platform_post_id=platform_post_id,
        keyword=_clean_str(_pick(raw, "keyword", "关键词")),
        url=url,
        title=title,
        content_text=content_text,
        summary=_clean_str(_pick(raw, "summary", "摘要")),
        media_type=_clean_str(_pick(raw, "media_type", "type", "内容类型")) or "unknown",
        creator=creator,
        publish_time=publish_time,
        like_count=_to_int(_pick(raw, "like_count", "likes", "点赞")),
        comment_count=_to_int(_pick(raw, "comment_count", "comments", "评论")),
        collect_count=_to_int(_pick(raw, "collect_count", "favorites", "收藏")),
        share_count=_to_int(_pick(raw, "share_count", "shares", "分享")),
        tags=_parse_tags(_pick(raw, "tags", "标签")),
        cover_url=_clean_str(_pick(raw, "cover_url", "封面")),
        brand_mentions=_parse_tags(_pick(raw, "brand_mentions", "brands", "品牌")),
        raw_json=raw,
    )


def fallback_post_id(
    platform: str,
    url: str | None,
    title: str | None,
    creator_nickname: str | None,
    publish_time: datetime | None,
) -> str:
    if url:
        return _fallback_id(platform, url, None, "url")
    published = publish_time.isoformat() if publish_time else ""
    return _fallback_id(platform, title, f"{creator_nickname or ''}{published}", "content")


def parse_datetime(value: Any) -> datetime | None:
    if value in (None, ""):
        return None
    if isinstance(value, datetime):
        dt = value
    else:
        text = str(value).strip()
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y/%m/%d %H:%M:%S", "%Y-%m-%d", "%Y/%m/%d"):
            try:
                dt = datetime.strptime(text, fmt)
                break
            except ValueError:
                continue
        else:
            try:
                dt = datetime.fromisoformat(text.replace("Z", "+00:00"))
            except ValueError:
                return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _pick(raw: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        if key in raw and raw[key] not in (None, ""):
            return raw[key]
    return None


def _clean_str(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _to_int(value: Any) -> int:
    if value in (None, ""):
        return 0
    if isinstance(value, (int, float)):
        return int(value)
    text = str(value).replace(",", "").strip()
    try:
        return int(float(text))
    except ValueError:
        return 0


def _parse_tags(value: Any) -> list[str]:
    if value in (None, ""):
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    text = str(value)
    for sep in [";", "；", ",", "，", "|"]:
        text = text.replace(sep, ";")
    return [item.strip() for item in text.split(";") if item.strip()]


def _fallback_id(platform: str, primary: str | None, secondary: str | None, prefix: str) -> str:
    digest = sha256(f"{platform}:{primary or ''}:{secondary or ''}".encode("utf-8")).hexdigest()[:20]
    return f"{prefix}_{digest}"


def _nested_dict(raw: dict[str, Any], key: str) -> dict[str, Any] | None:
    value = raw.get(key)
    return value if isinstance(value, dict) else None
