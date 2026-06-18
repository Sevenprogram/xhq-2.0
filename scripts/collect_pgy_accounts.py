from __future__ import annotations

import argparse
import json
import re
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

import httpx
import pandas as pd


TRACKS = [
    {
        "slug": "subject-boost",
        "title": "学科提分",
        "keywords": ["数学辅导机构", "中考冲刺班", "一对一辅导机构", "在线网课平台", "教辅资料品牌"],
    },
    {
        "slug": "admission-planning",
        "title": "升学择校",
        "keywords": ["升学规划机构", "择校咨询机构", "国际学校咨询", "留学规划机构", "志愿填报机构"],
    },
    {
        "slug": "competency",
        "title": "素质能力",
        "keywords": ["少儿编程机构", "儿童美术机构", "科学课机构", "STEM教育品牌", "表达力课程机构"],
    },
    {
        "slug": "study-camp",
        "title": "研学营地",
        "keywords": ["研学机构", "营地教育机构", "夏令营机构", "自然教育机构", "亲子营地品牌"],
    },
    {
        "slug": "family-education",
        "title": "家庭教育",
        "keywords": ["家庭教育机构", "父母课堂机构", "亲子沟通课程", "家长成长课程", "家庭教育品牌"],
    },
    {
        "slug": "early-learning",
        "title": "低龄启蒙",
        "keywords": ["早教机构", "幼小衔接机构", "英语启蒙课程", "绘本阅读机构", "数学思维机构"],
    },
    {
        "slug": "teen-growth",
        "title": "青少年成长",
        "keywords": ["青少年成长机构", "青少年心理机构", "厌学干预机构", "时间管理课程", "学习动力训练营"],
    },
]

COMPETITOR_KEYWORDS: dict[str, list[str]] = {
    "subject-boost": [
        "数学辅导机构",
        "中考冲刺机构",
        "一对一辅导机构",
        "学科辅导机构",
        "教辅品牌",
        "网课机构",
        "教育培训机构",
        "课外辅导机构",
    ],
    "admission-planning": [
        "升学规划机构",
        "择校咨询机构",
        "国际学校咨询",
        "志愿填报机构",
        "留学规划机构",
        "国际课程中心",
        "A-Level课程机构",
        "DSE课程机构",
    ],
    "competency": [
        "少儿编程机构",
        "儿童美术机构",
        "科学课机构",
        "STEM教育机构",
        "表达力课程机构",
        "逻辑思维机构",
        "素质教育机构",
        "儿童成长中心",
    ],
    "study-camp": [
        "研学机构",
        "营地教育机构",
        "夏令营机构",
        "自然教育机构",
        "亲子营地品牌",
        "户外教育机构",
        "研学旅行机构",
        "儿童营地中心",
    ],
    "family-education": [
        "家庭教育机构",
        "父母课堂机构",
        "亲子沟通课程",
        "家长成长课程",
        "家庭教育品牌",
        "亲子教育机构",
        "家长课堂",
        "儿童心理咨询机构",
    ],
    "early-learning": [
        "早教机构",
        "幼小衔接机构",
        "英语启蒙机构",
        "绘本阅读机构",
        "数学思维机构",
        "启蒙教育机构",
        "儿童学习中心",
        "早教中心",
    ],
    "teen-growth": [
        "青少年成长机构",
        "青少年心理机构",
        "厌学干预机构",
        "时间管理课程",
        "学习动力训练营",
        "青春期教育机构",
        "青少年训练营",
        "心理咨询中心",
    ],
}


ORG_TERMS = [
    "教育",
    "机构",
    "学院",
    "课堂",
    "中心",
    "营地",
    "课程",
    "规划",
    "咨询",
    "学校",
    "校区",
    "品牌",
    "官方",
    "招生",
    "留学",
    "研学",
    "早教",
    "编程",
    "美术",
    "英语",
    "数学",
]

CREATOR_TERMS = [
    "老师",
    "妈妈",
    "爸爸",
    "博主",
    "分享",
    "陪娃",
    "记录",
    "日记",
    "成长",
    "家长",
    "个人",
    "测评",
]

ORG_SUFFIX_RE = re.compile(r"(教育|学院|课堂|中心|学校|校区|机构|营地|课程|规划|咨询|官方|留学|研学|早教)")


@dataclass
class Settings:
    base_url: str
    token: str
    timeout: float


def main() -> None:
    parser = argparse.ArgumentParser(description="Collect Just One API Pugongying accounts by education track.")
    parser.add_argument("--limit", type=int, default=30)
    parser.add_argument("--data-dir", default="data")
    parser.add_argument("--env", default="backend/.env")
    parser.add_argument("--tracks", default="", help="Comma-separated track slug or title list. Empty means all tracks.")
    parser.add_argument("--mode", choices=["all", "competitors"], default="all")
    args = parser.parse_args()

    settings = read_settings(Path(args.env))
    data_dir = Path(args.data_dir)
    timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
    selected_tracks = filter_tracks(args.tracks)

    summary: list[dict[str, Any]] = []
    for track in selected_tracks:
        print(f"[{track['title']}] collecting...")
        raw_payloads: list[dict[str, Any]] = []
        accounts: dict[str, dict[str, Any]] = {}

        keywords = COMPETITOR_KEYWORDS[track["slug"]] if args.mode == "competitors" else track["keywords"]
        search_types = ["NICKNAME", "NOTE"] if args.mode == "competitors" else ["NOTE"]

        for keyword in keywords:
            for search_type in search_types:
                try:
                    payload = request_creators(settings, keyword=keyword, search_type=search_type)
                except Exception as exc:
                    print(f"  keyword failed: {keyword}/{search_type} ({exc})")
                    raw_payloads.append({"keyword": keyword, "searchType": search_type, "error": str(exc)})
                    continue
                raw_payloads.append({"keyword": keyword, "searchType": search_type, "payload": payload})
                for item in extract_items(payload):
                    normalized = normalize_account(item, track["title"], keyword)
                    accounts.setdefault(normalized["账号ID"], normalized)
                    if len(accounts) >= args.limit:
                        break
                if len(accounts) >= args.limit:
                    break
            if len(accounts) >= args.limit:
                break

        rows = list(accounts.values())[: args.limit]
        classified = [classify_account(row) for row in rows]
        competitors = [row for row in classified if row["账号类型"] == "友商候选账号"]
        creators = [row for row in classified if row["账号类型"] == "达人账号"]

        track_dir = data_dir / track["slug"]
        raw_dir = track_dir / "raw"
        normalized_dir = track_dir / "normalized"
        raw_dir.mkdir(parents=True, exist_ok=True)
        normalized_dir.mkdir(parents=True, exist_ok=True)

        write_json(raw_dir / f"{timestamp}.json", raw_payloads)
        write_json(normalized_dir / f"{timestamp}.json", classified)
        write_json(track_dir / "latest.json", classified)
        write_excel(track_dir / "competitors.xlsx", competitors)
        if args.mode == "all":
            write_excel(track_dir / "creators.xlsx", creators)

        summary.append(
            {
                "track": track["title"],
                "slug": track["slug"],
                "total": len(classified),
                "competitors": len(competitors),
                "creators": len(creators),
            }
        )
        print(f"  total={len(classified)} competitors={len(competitors)} creators={len(creators)}")

    write_json(data_dir / "collection-summary.json", {"timestamp": timestamp, "tracks": summary})
    print("done")


def filter_tracks(track_filter: str) -> list[dict[str, Any]]:
    if not track_filter.strip():
        return TRACKS
    requested = {item.strip() for item in track_filter.split(",") if item.strip()}
    tracks = [track for track in TRACKS if track["slug"] in requested or track["title"] in requested]
    missing = requested - {track["slug"] for track in tracks} - {track["title"] for track in tracks}
    if missing:
        raise SystemExit(f"Unknown track(s): {', '.join(sorted(missing))}")
    return tracks


def read_settings(env_path: Path) -> Settings:
    values: dict[str, str] = {}
    for line in env_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        values[key.strip()] = value.strip()

    token = values.get("JUSTONE_API_TOKEN", "")
    if not token:
        raise SystemExit("JUSTONE_API_TOKEN is empty in backend/.env")
    return Settings(
        base_url=values.get("JUSTONE_API_BASE_URL", "https://api.justoneapi.com").rstrip("/"),
        token=token,
        timeout=float(values.get("JUSTONE_API_TIMEOUT", "60")),
    )


def request_creators(settings: Settings, keyword: str, search_type: str) -> dict[str, Any]:
    url = f"{settings.base_url}/api/xiaohongshu-pgy/api/solar/cooperator/blogger/v2/v1"
    params = {
        "token": settings.token,
        "keyword": keyword,
        "searchType": search_type,
        "page": 1,
        "excludeLowActive": True,
        "fansNumUp": True,
    }
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            response = httpx.get(url, params=params, timeout=settings.timeout)
            response.raise_for_status()
            payload = response.json()
            break
        except Exception as exc:
            last_error = exc
            time.sleep(1.5 * (attempt + 1))
    else:
        raise RuntimeError(f"request failed after retries: {last_error}") from last_error

    code = payload.get("code")
    if code not in (0, "0", None):
        message = payload.get("msg") or payload.get("message") or "business error"
        raise RuntimeError(f"Just One API returned code {code}: {message}")
    return payload


def extract_items(payload: dict[str, Any]) -> list[dict[str, Any]]:
    data = payload.get("data") or {}
    items = data.get("kols") or data.get("list") or data.get("items") or []
    return [item for item in items if isinstance(item, dict)]


def normalize_account(item: dict[str, Any], track: str, keyword: str) -> dict[str, Any]:
    name = pick(item, "nickName", "nickname", "name", "bloggerName", "userName") or "蒲公英账号"
    account_id = pick(item, "userId", "user_id", "bloggerId", "kolId", "redId", "red_id") or name
    bio = pick(item, "desc", "description", "signature", "brief", "introduction", "selfIntroduction") or ""
    home_url = pick(item, "homeUrl", "homepage", "profileUrl", "url", "link") or ""
    location = pick(item, "location", "cityName", "provinceName", "ipLocation") or ""

    return {
        "账号名称": str(name),
        "账号ID": str(account_id),
        "账号类型": "",
        "赛道": track,
        "搜索关键词": keyword,
        "粉丝数": parse_count(pick(item, "fansNum", "fansCount", "followerCount", "followers", "fans")),
        "内容数": parse_count(pick(item, "noteNum", "noteCount", "contentCount", "content_num")),
        "互动量": parse_count(pick(item, "interactionNum", "interactions", "likeCollectNum", "likedCount")),
        "报价": parse_count(pick(item, "price", "priceNote", "notePrice", "videoPrice", "quotePrice")),
        "地区": str(location),
        "简介": str(bio),
        "判断理由": "",
        "置信度": "",
        "原始链接/主页": str(home_url),
        "原始字段": json.dumps(item, ensure_ascii=False),
    }


def classify_account(row: dict[str, Any]) -> dict[str, Any]:
    text = f"{row['账号名称']} {row['简介']}"
    keyword = str(row.get("搜索关键词", ""))
    org_hits = [term for term in ORG_TERMS if term in text]
    creator_hits = [term for term in CREATOR_TERMS if term in text]
    keyword_org_hits = [term for term in ORG_TERMS if term in keyword]
    has_commercial_signal = int(row.get("报价", 0) or 0) > 0 and int(row.get("粉丝数", 0) or 0) >= 1000
    org_score = len(org_hits) * 2
    creator_score = len(creator_hits)

    if keyword_org_hits:
        org_score += 3
        org_hits.extend([f"机构型搜索词:{term}" for term in keyword_org_hits[:2]])

    if has_commercial_signal and keyword_org_hits:
        org_score += 2
        org_hits.append("机构搜索词下有报价/粉丝商业信号")

    if ORG_SUFFIX_RE.search(str(row["账号名称"])):
        org_score += 3
        org_hits.append("机构型昵称")

    if org_score >= creator_score + 2:
        row["账号类型"] = "友商候选账号"
        confidence = "high" if org_score >= creator_score + 5 else "medium"
        reason = f"机构信号: {', '.join(dict.fromkeys(org_hits)) or '无'}"
    else:
        row["账号类型"] = "达人账号"
        confidence = "high" if creator_score >= org_score + 3 else "medium"
        reason = f"个人/达人信号: {', '.join(dict.fromkeys(creator_hits)) or '机构信号不足'}"

    row["判断理由"] = reason
    row["置信度"] = confidence
    return row


def pick(item: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        value = item.get(key)
        if value not in (None, ""):
            return value
    return None


def parse_count(value: Any) -> int:
    if value in (None, ""):
        return 0
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, (int, float)):
        return int(value)
    text = str(value).strip().replace(",", "")
    multiplier = 1
    if "万" in text:
        multiplier = 10000
    cleaned = "".join(char for char in text if char.isdigit() or char == ".")
    if not cleaned:
        return 0
    return int(float(cleaned) * multiplier)


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def write_excel(path: Path, rows: list[dict[str, Any]]) -> None:
    columns = [
        "账号名称",
        "账号ID",
        "账号类型",
        "赛道",
        "搜索关键词",
        "粉丝数",
        "内容数",
        "互动量",
        "报价",
        "地区",
        "简介",
        "判断理由",
        "置信度",
        "原始链接/主页",
    ]
    dataframe = pd.DataFrame(rows)
    if dataframe.empty:
        dataframe = pd.DataFrame(columns=columns)
    else:
        dataframe = dataframe.reindex(columns=columns)
    dataframe.to_excel(path, index=False)


if __name__ == "__main__":
    main()
