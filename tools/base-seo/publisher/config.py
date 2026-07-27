from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path

from app_paths import app_dir


CATEGORIES = [
    {"id": "shelter", "label": "보호소"},
    {"id": "adopt", "label": "강아지분양"},
    {"id": "hospital", "label": "동물병원"},
    {"id": "funeral", "label": "장례식장"},
    {"id": "cafe", "label": "애견카페"},
    {"id": "pharmacy", "label": "동물약국"},
    {"id": "hotel", "label": "애견호텔·펜션"},
    {"id": "academy", "label": "미용학원"},
]


@dataclass
class Config:
    api_base: str
    admin_secret: str
    image_cdn: str = ""
    image_max: int = 0
    image_ext: str = "webp"


def _read_env_file(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def load_config() -> Config:
    # tools/base-seo/publisher/config.py → repo root
    root = Path(__file__).resolve().parents[3]
    tool_dir = Path(__file__).resolve().parents[1]
    merged: dict[str, str] = {}
    for p in (
        root / ".env.local",
        root / ".env",
        tool_dir / ".env",
        app_dir() / ".env",
    ):
        merged.update(_read_env_file(p))

    def env(*keys: str, default: str = "") -> str:
        for k in keys:
            v = (os.environ.get(k) or merged.get(k) or "").strip()
            if v:
                return v
        return default

    secret = env(
        "BASE_SEO_PUBLISH_SECRET",
        "CRON_SECRET",
        "SYNC_SECRET",
    )
    api_base = env(
        "BASE_SEO_API_BASE",
        "SEO_API_BASE",
        "NEXT_PUBLIC_SITE_URL",
        default="https://www.eanimal.kr",
    )
    return Config(
        api_base=api_base.rstrip("/"),
        admin_secret=secret,
        image_cdn=env("IMAGE_CDN"),
        image_max=int(env("IMAGE_MAX", default="0") or "0"),
        image_ext=env("IMAGE_EXT", default="webp") or "webp",
    )


def settings_path() -> Path:
    return app_dir() / "gui_settings.json"


def load_gui_settings() -> dict:
    p = settings_path()
    if not p.exists():
        return {}
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_gui_settings(data: dict) -> None:
    settings_path().write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
