from typing import Any

import httpx
from fastapi import APIRouter, HTTPException

from app.connectors.dataflow_xhs import DataflowConfigError, fetch_xhs_app_user_info, fetch_xhs_app_user_posts
from app.connectors.tikhub_xhs import TikHubConfigError, fetch_tikhub_xhs_web_v2_user_info
from app.schemas.dataflow import XhsCreatorProfile, XhsTrackAnalysis

router = APIRouter(prefix="/dataflow", tags=["dataflow"])


@router.get("/xhs/users/{user_id}", response_model=XhsCreatorProfile)
def get_xhs_user_profile(user_id: str) -> XhsCreatorProfile:
    try:
        payload = fetch_tikhub_xhs_web_v2_user_info(user_id)
    except TikHubConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text or exc.response.reason_phrase
        raise HTTPException(status_code=exc.response.status_code, detail=detail) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"TikHub request failed: {exc}") from exc

    return _map_tikhub_xhs_profile(user_id, payload)


@router.get("/xhs/users/{user_id}/track-analysis", response_model=XhsTrackAnalysis)
def get_xhs_user_track_analysis(user_id: str) -> XhsTrackAnalysis:
    profile_payload = _fetch_profile_for_analysis(user_id)
    profile = _map_xhs_profile(user_id, profile_payload["body"], profile_payload["outer"])

    try:
        posts_payload = fetch_xhs_app_user_posts(user_id)
    except httpx.HTTPError:
        posts_payload = {"outer": {}, "body": {}}

    outer = posts_payload.get("outer") or {}
    raw_code = outer.get("code") if isinstance(outer, dict) else None
    if raw_code == 0:
        posts = _extract_posts(posts_payload.get("body") or {})
        if posts:
            return _analyze_tracks_from_posts(user_id, posts)

    fallback = _analyze_tracks_from_text(user_id, f"{profile.nickname or ''} {profile.bio or ''} {profile.ip_location or ''}")
    fallback.source = "fallback_profile"
    fallback.message = outer.get("msg") if isinstance(outer, dict) else "用户笔记列表暂不可用，已根据主页简介兜底分析"
    fallback.raw_code = raw_code if isinstance(raw_code, int) else None
    return fallback


def _fetch_profile_for_analysis(user_id: str) -> dict[str, Any]:
    try:
        return fetch_xhs_app_user_info(user_id)
    except DataflowConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text or exc.response.reason_phrase
        raise HTTPException(status_code=exc.response.status_code, detail=detail) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Dataflow request failed: {exc}") from exc


def _map_xhs_profile(user_id: str, body: dict[str, Any], outer: dict[str, Any]) -> XhsCreatorProfile:
    source = _first_dict(body, "user", "userInfo", "user_info", "profile", "data") or body
    interactions = _first_dict(source, "interactions", "interaction", "counts", "statistics", "stats") or {}
    account_status = _first_dict(source, "user_account_status") or {}

    followers = _pick_int(source, interactions, "fans", "fans_count", "followers", "follower_count", "fansCount")
    liked = _pick_int(source, interactions, "like_and_collect", "liked_count", "likedCount", "likes", "total_likes", "liked")
    collected = _pick_int(source, interactions, "collected_count", "collectedCount", "collect_count", "collects")
    notes = _pick_int(source, interactions, "note_count", "noteCount", "notes", "posted_count", "post_count")
    total_interactions = liked + collected
    engagement_rate = round((total_interactions / followers) * 100, 2) if followers else 0

    return XhsCreatorProfile(
        user_id=_pick_str(source, "user_id", "userId", "id", "userid") or user_id,
        nickname=_pick_str(source, "nickname", "nick_name", "name", "user_name"),
        avatar_url=_pick_str(source, "avatar", "avatar_url", "image", "images"),
        red_id=_pick_str(source, "red_id", "redId", "xsec_token", "red_id_v2"),
        bio=_pick_str(source, "desc", "description", "bio", "signature"),
        location=_pick_str(source, "location", "city"),
        gender=_pick_str(source, "gender", "sex"),
        ip_location=_pick_str(source, "ip_location", "ipLocation"),
        account_status=_pick_str(account_status, "toast", "status", "message"),
        account_status_type=_pick_optional_int(account_status, "type", "status_type"),
        follower_count=followers,
        follower_count_display=_pick_str(source, "fans", "fans_count", "followers", "follower_count", "fansCount"),
        following_count=_pick_int(source, interactions, "follows", "following", "following_count", "follows_count"),
        following_count_display=_pick_str(source, "follows", "following", "following_count", "follows_count"),
        liked_count=liked,
        collected_count=collected,
        like_and_collect_display=_pick_str(source, "like_and_collect", "liked_count", "likedCount", "likes", "total_likes", "liked"),
        note_count=notes,
        note_count_display=_pick_str(source, "note_count", "noteCount", "notes", "posted_count", "post_count"),
        engagement_rate=engagement_rate,
        category_tags=_pick_list(source, "tags", "category_tags", "tag_list"),
        raw={"body": body, "outer": outer},
    )


def _map_tikhub_xhs_profile(user_id: str, payload: dict[str, Any]) -> XhsCreatorProfile:
    data = payload.get("data") if isinstance(payload.get("data"), dict) else {}
    note_stat = data.get("note_num_stat") if isinstance(data.get("note_num_stat"), dict) else {}
    interactions = data.get("interactions") if isinstance(data.get("interactions"), list) else []
    interaction_total = _interaction_count(interactions, "interaction")
    liked = _to_int(data.get("liked") or note_stat.get("liked"))
    collected = _to_int(data.get("collected") or note_stat.get("collected"))
    if interaction_total <= 0:
        interaction_total = liked + collected
    fans = _to_int(data.get("fans") or _interaction_count(interactions, "fans"))
    follows = _to_int(data.get("follows") or _interaction_count(interactions, "follows"))
    notes = _to_int(note_stat.get("posted") or data.get("ndiscovery"))
    engagement_rate = round((interaction_total / fans) * 100, 2) if fans else 0

    return XhsCreatorProfile(
        source="tikhub",
        user_id=_pick_str(data, "userid", "user_id", "userId", "id") or user_id,
        nickname=_pick_str(data, "nickname", "nick_name", "name", "user_name"),
        avatar_url=_pick_str(data, "images", "imageb", "avatar", "avatar_url"),
        red_id=_pick_str(data, "red_id", "redId"),
        bio=_pick_str(data, "desc", "description", "bio", "signature"),
        location=_pick_str(data, "location", "city"),
        gender=_pick_str(data, "gender", "sex"),
        ip_location=_pick_str(data, "ip_location", "ipLocation"),
        account_status=None,
        account_status_type=None,
        follower_count=fans,
        follower_count_display=format(fans, ","),
        following_count=follows,
        following_count_display=format(follows, ","),
        liked_count=liked,
        collected_count=collected,
        like_and_collect_display=format(interaction_total, ","),
        note_count=notes,
        note_count_display=format(notes, ","),
        engagement_rate=engagement_rate,
        category_tags=[],
        raw={"body": data, "outer": payload},
    )


def _interaction_count(items: list[Any], item_type: str) -> int:
    for item in items:
        if isinstance(item, dict) and item.get("type") == item_type:
            return _to_int(item.get("count"))
    return 0


TRACK_KEYWORDS = {
    "美食探店": ["吃", "美食", "探店", "餐厅", "饭", "火锅", "烧烤", "甜品", "小吃", "烘焙", "茶餐厅", "自助"],
    "咖啡甜品": ["咖啡", "拿铁", "甜品", "蛋糕", "面包", "下午茶", "烘焙"],
    "本地生活": ["深圳", "广州", "上海", "北京", "杭州", "周末", "打卡", "生活", "逛", "附近", "本地"],
    "旅游出行": ["旅游", "旅行", "酒店", "民宿", "攻略", "路线", "景点", "出行", "度假"],
    "校园生活": ["校园", "大学", "学生", "宿舍", "上课", "考试", "社团"],
    "美妆穿搭": ["穿搭", "妆", "口红", "护肤", "美妆", "发型", "衣服", "ootd"],
    "母婴亲子": ["宝宝", "孩子", "亲子", "妈妈", "育儿", "绘本", "儿童"],
    "教育成长": ["学习", "课程", "英语", "考研", "留学", "教育", "老师", "职场"],
    "健康健身": ["健身", "减脂", "瑜伽", "运动", "健康", "跑步", "普拉提"],
}


def _extract_posts(body: dict[str, Any]) -> list[dict[str, Any]]:
    candidates: list[Any] = [
        body.get("data"),
        body.get("items"),
        body.get("notes"),
        body.get("list"),
        body.get("feeds"),
    ]
    data = body.get("data")
    if isinstance(data, dict):
        candidates.extend([data.get("items"), data.get("notes"), data.get("list"), data.get("feeds")])
    for candidate in candidates:
        if isinstance(candidate, list):
            return [item for item in candidate if isinstance(item, dict)]
    return []


def _analyze_tracks_from_posts(user_id: str, posts: list[dict[str, Any]]) -> XhsTrackAnalysis:
    texts = [_post_text(post) for post in posts]
    return _rank_tracks(user_id, texts, source="posts", note_count=len(posts), message=None, raw_code=0)


def _analyze_tracks_from_text(user_id: str, text: str) -> XhsTrackAnalysis:
    return _rank_tracks(user_id, [text], source="profile", note_count=0, message=None, raw_code=None)


def _rank_tracks(
    user_id: str,
    texts: list[str],
    source: str,
    note_count: int,
    message: str | None,
    raw_code: int | None,
) -> XhsTrackAnalysis:
    corpus = "\n".join(texts)
    scores: list[tuple[str, int, list[str]]] = []
    for track, keywords in TRACK_KEYWORDS.items():
        hits = [keyword for keyword in keywords if keyword.lower() in corpus.lower()]
        if hits:
            scores.append((track, len(hits), hits[:4]))

    scores.sort(key=lambda item: item[1], reverse=True)
    if not scores:
        return XhsTrackAnalysis(
            user_id=user_id,
            tracks=["内容种草", "本地生活"],
            source=source,
            confidence=0.35,
            evidence=[],
            note_count=note_count,
            message=message,
            raw_code=raw_code,
        )

    tracks = [item[0] for item in scores[:4]]
    evidence = [f"{track}: {', '.join(hits)}" for track, _, hits in scores[:4]]
    confidence = min(0.92, 0.45 + scores[0][1] * 0.08 + min(note_count, 10) * 0.02)
    return XhsTrackAnalysis(
        user_id=user_id,
        tracks=tracks,
        source=source,
        confidence=round(confidence, 2),
        evidence=evidence,
        note_count=note_count,
        message=message,
        raw_code=raw_code,
    )


def _post_text(post: dict[str, Any]) -> str:
    fields = [
        "title",
        "desc",
        "description",
        "content",
        "content_text",
        "display_title",
        "note_card",
    ]
    chunks: list[str] = []
    for field in fields:
        value = post.get(field)
        if isinstance(value, dict):
            chunks.append(_post_text(value))
        elif isinstance(value, list):
            chunks.extend(str(item) for item in value)
        elif value not in (None, ""):
            chunks.append(str(value))
    tags = post.get("tags") or post.get("tag_list")
    if isinstance(tags, list):
        chunks.extend(str(tag.get("name", tag)) if isinstance(tag, dict) else str(tag) for tag in tags)
    return " ".join(chunks)


def _first_dict(source: dict[str, Any], *keys: str) -> dict[str, Any] | None:
    for key in keys:
        value = source.get(key)
        if isinstance(value, dict):
            return value
    return None


def _pick_str(source: dict[str, Any], *keys: str) -> str | None:
    for key in keys:
        value = source.get(key)
        if value not in (None, ""):
            if isinstance(value, list):
                return str(value[0]) if value else None
            return str(value)
    return None


def _pick_int(*sources_and_keys: Any) -> int:
    source_a, source_b, *keys = sources_and_keys
    for source in (source_a, source_b):
        if not isinstance(source, dict):
            continue
        for key in keys:
            value = source.get(key)
            if value not in (None, ""):
                return _to_int(value)
    return 0


def _pick_optional_int(source: dict[str, Any], *keys: str) -> int | None:
    for key in keys:
        value = source.get(key)
        if value not in (None, ""):
            return _to_int(value)
    return None


def _pick_list(source: dict[str, Any], *keys: str) -> list[str]:
    for key in keys:
        value = source.get(key)
        if isinstance(value, list):
            return [str(item.get("name", item)) if isinstance(item, dict) else str(item) for item in value]
        if isinstance(value, str) and value.strip():
            return [item.strip() for item in value.replace(",", ";").replace("，", ";").split(";") if item.strip()]
    return []


def _to_int(value: Any) -> int:
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, (int, float)):
        return int(value)
    text = str(value).replace(",", "").strip().lower()
    multiplier = 1
    text = text.rstrip("+")
    if text.endswith("万") or text.endswith("w"):
        multiplier = 10000
        text = text[:-1]
    elif text.endswith("k"):
        multiplier = 1000
        text = text[:-1]
    try:
        return int(float(text) * multiplier)
    except ValueError:
        return 0
