from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
OUTPUT_FILE = ROOT / "frontend" / "src" / "data" / "generatedPgyCreators.ts"
NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

TRACK_DIRS = {
    "subject-boost": "学科提分",
    "admission-planning": "升学择校",
    "competency": "素质能力",
    "study-camp": "研学营地",
    "family-education": "家庭教育",
    "early-learning": "低龄启蒙",
    "teen-growth": "青少年成长",
}


def main() -> None:
    rows: list[dict] = []
    seen: set[tuple[str, str]] = set()

    for directory, fallback_track in TRACK_DIRS.items():
        path = DATA_DIR / directory / "creators.xlsx"
        if not path.exists():
            continue
        for row in read_xlsx_dicts(path):
            track = str(row.get("赛道") or fallback_track).strip() or fallback_track
            account_id = str(row.get("账号ID") or "").strip()
            name = str(row.get("账号名称") or "").strip()
            if not account_id and not name:
                continue

            dedupe_key = (track, account_id or name)
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)

            followers = parse_number(row.get("粉丝数"))
            content_count = parse_number(row.get("内容数"))
            interactions = parse_number(row.get("互动量"))
            quote = parse_number(row.get("报价"))
            keyword = str(row.get("搜索关键词") or track).strip()
            confidence = str(row.get("置信度") or "").strip()

            rows.append(
                {
                    "name": name or f"{track}达人",
                    "redId": account_id,
                    "userId": account_id or name,
                    "location": str(row.get("地区") or "").strip(),
                    "personalTags": build_personal_tags(str(row.get("判断理由") or ""), confidence),
                    "contentTags": {"taxonomy1Tag": "教育", "taxonomy2Tags": [track, keyword]},
                    "fansNum": followers,
                    "contentCount": content_count,
                    "interactions": interactions,
                    "picturePrice": quote,
                    "keywords": keyword,
                    "score": estimate_score(followers, content_count, interactions, quote, confidence),
                    "sourceTracks": [track],
                    "profileUrl": str(row.get("原始链接/主页") or "").strip(),
                    "bio": str(row.get("简介") or "").strip(),
                    "reason": str(row.get("判断理由") or "").strip(),
                    "confidence": confidence,
                }
            )

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(render_ts(rows), encoding="utf-8")
    print(f"Wrote {len(rows)} creators to {OUTPUT_FILE.relative_to(ROOT)}")


def read_xlsx_dicts(path: Path) -> list[dict[str, str]]:
    rows = read_xlsx_rows(path)
    if not rows:
        return []
    headers = [str(value).strip() for value in rows[0]]
    result = []
    for values in rows[1:]:
        if not any(values):
            continue
        row = {headers[index]: values[index] if index < len(values) else "" for index in range(len(headers))}
        result.append(row)
    return result


def read_xlsx_rows(path: Path) -> list[list[str]]:
    with ZipFile(path) as archive:
        strings = read_shared_strings(archive)
        sheet_name = first_sheet_path(archive)
        root = ET.fromstring(archive.read(sheet_name))
        rows: list[list[str]] = []
        for row in root.findall(".//a:sheetData/a:row", NS):
            values: list[str] = []
            for cell in row.findall("a:c", NS):
                index = column_index(cell.attrib.get("r", "A1"))
                while len(values) <= index:
                    values.append("")
                values[index] = cell_value(cell, strings)
            rows.append(values)
        return rows


def first_sheet_path(archive: ZipFile) -> str:
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    rel_id = workbook.find(".//a:sheets/a:sheet", NS).attrib[
        "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
    ]
    rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    for rel in rels:
        if rel.attrib.get("Id") == rel_id:
            target = rel.attrib["Target"]
            return "xl/" + target.lstrip("/")
    return "xl/worksheets/sheet1.xml"


def read_shared_strings(archive: ZipFile) -> list[str]:
    try:
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    return ["".join(text.text or "" for text in item.findall(".//a:t", NS)) for item in root.findall("a:si", NS)]


def column_index(cell_ref: str) -> int:
    letters = "".join(char for char in cell_ref if char.isalpha())
    index = 0
    for char in letters:
        index = index * 26 + ord(char.upper()) - 64
    return index - 1


def cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        return "".join(text.text or "" for text in cell.findall(".//a:t", NS)).strip()

    value = cell.find("a:v", NS)
    text = "" if value is None else value.text or ""
    if cell_type == "s" and text:
        return shared_strings[int(text)].strip()
    return text.strip()


def parse_number(value: object) -> int:
    text = str(value or "").replace(",", "").strip()
    if not text:
        return 0
    multiplier = 10000 if "万" in text else 1
    match = re.search(r"\d+(?:\.\d+)?", text)
    if not match:
        return 0
    return int(float(match.group()) * multiplier)


def build_personal_tags(reason: str, confidence: str) -> list[str]:
    tags = ["达人账号"]
    if "老师" in reason:
        tags.append("老师")
    if "妈妈" in reason:
        tags.append("家长")
    if confidence:
        tags.append(f"置信度:{confidence}")
    return tags


def estimate_score(followers: int, content_count: int, interactions: int, quote: int, confidence: str) -> int:
    confidence_bonus = {"high": 600, "medium": 300, "low": 0}.get(confidence.lower(), 150)
    quote_penalty = min(800, quote // 120)
    score = followers // 80 + content_count * 18 + interactions // 10 + confidence_bonus - quote_penalty
    return max(1200, min(9800, score))


def render_ts(rows: list[dict]) -> str:
    json_payload = json.dumps(rows, ensure_ascii=False, indent=2)
    return (
        "import type { PgyEducationCreator } from \"./mockPgyCreators\";\n\n"
        "// Generated by scripts/generate_frontend_creators.py from data/*/creators.xlsx.\n"
        "// Re-run the script after updating the Excel files.\n"
        "export const generatedPgyCreators: PgyEducationCreator[] = "
        + json_payload
        + ";\n"
    )


if __name__ == "__main__":
    main()
