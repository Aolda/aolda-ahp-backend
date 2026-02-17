import os
from typing import List, Optional


def _parse_csv_env(value: Optional[str], default: List[str]) -> List[str]:
    if not value:
        return default

    parsed = [item.strip() for item in value.split(",") if item.strip()]
    return parsed or default


def _parse_bool_env(value: Optional[str], default: bool) -> bool:
    if value is None:
        return default

    return value.strip().lower() in {"1", "true", "t", "yes", "y", "on"}


class Settings:
    PROJECT_NAME: str = "aolda-ahp-backend"
    VERSION: str = "0.1.0"

    CORS_ALLOW_ORIGINS: List[str] = _parse_csv_env(
        os.getenv("CORS_ALLOW_ORIGINS"),
        [
            "http://example.com",
            "https://example.com",
            "http://localhost:3000",
            "http://localhost:8000",
        ],
    )
    CORS_ALLOW_METHODS: List[str] = _parse_csv_env(
        os.getenv("CORS_ALLOW_METHODS"), ["*"]
    )
    CORS_ALLOW_HEADERS: List[str] = _parse_csv_env(
        os.getenv("CORS_ALLOW_HEADERS"), ["*"]
    )
    CORS_ALLOW_CREDENTIALS: bool = _parse_bool_env(
        os.getenv("CORS_ALLOW_CREDENTIALS"), True
    )


settings = Settings()
