from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    app_name: str = "Social Intel Monitor"
    api_prefix: str = "/api"
    database_url: str = "sqlite:///./social_intel.db"
    redis_url: str = "redis://redis:6379/0"
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    dataflow_base_url: str = ""
    dataflow_api_key: str = ""
    dataflow_auth_scheme: str = ""
    justone_api_base_url: str = "https://api.justoneapi.com"
    justone_api_token: str = ""
    justone_api_timeout: float = 60.0
    tikhub_api_base_url: str = "https://api.tikhub.io"
    tikhub_api_token: str = ""
    tikhub_api_timeout: float = 60.0
    report_mysql_host: str = "127.0.0.1"
    report_mysql_port: int = 3306
    report_mysql_database: str = "media_crawler"
    report_mysql_user: str = "crawler"
    report_mysql_password: str = ""
    ai_base_url: str = ""
    ai_api_key: str = ""
    ai_model: str = ""
    ai_timeout: float = 60.0

    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
