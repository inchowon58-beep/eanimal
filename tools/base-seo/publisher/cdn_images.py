"""CDN 폴더형 이미지 (01.webp ~ NN.webp) 랜덤 선택."""

from __future__ import annotations

import random
from typing import Any


def normalize_cdn_base(url: str) -> str:
    return (url or "").strip().rstrip("/")


def cdn_image_url(base: str, num: int, ext: str = "webp") -> str:
    clean_ext = (ext or "webp").lstrip(".").lower() or "webp"
    return f"{normalize_cdn_base(base)}/{num:02d}.{clean_ext}"


def pick_random_image_url(
    base: str,
    max_num: int,
    *,
    ext: str = "webp",
    rng: random.Random | None = None,
) -> str | None:
    base = normalize_cdn_base(base)
    if not base.startswith("http"):
        return None
    try:
        n = int(max_num)
    except (TypeError, ValueError):
        return None
    if n < 1:
        return None
    picker = rng or random
    return cdn_image_url(base, picker.randint(1, n), ext)


def image_pool_info(base: str, max_num: int, ext: str = "webp") -> dict[str, Any]:
    base = normalize_cdn_base(base)
    try:
        n = max(0, int(max_num))
    except (TypeError, ValueError):
        n = 0
    return {
        "mode": "cdn_random" if base and n >= 1 else "none",
        "cdnBase": base or None,
        "imageCount": n if n >= 1 else 0,
        "ext": (ext or "webp").lstrip(".").lower() or "webp",
        "range": f"01~{n:02d}" if n >= 1 else None,
    }
