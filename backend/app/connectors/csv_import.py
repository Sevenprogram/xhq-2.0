import csv
from io import StringIO

from app.connectors.base import BaseConnector


class CSVImportConnector(BaseConnector):
    platform = "mixed"
    source_type = "csv"

    def __init__(self, content: str):
        self.content = content

    def search_posts(self, keyword: str = "", limit: int = 100, cursor: str | None = None) -> list[dict]:
        reader = csv.DictReader(StringIO(self.content))
        rows = list(reader)
        return rows[:limit] if limit else rows
