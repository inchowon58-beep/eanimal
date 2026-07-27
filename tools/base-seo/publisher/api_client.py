from __future__ import annotations

import json
import socket
import time
from typing import Any, Callable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from publisher.config import Config

LogFn = Callable[[str], None] | None
REQUEST_TIMEOUT_SEC = 120
MAX_RETRIES = 3
# 유아독존 SEO 발행기와 동일 기본값 (API 한 번 호출당 건수)
DEFAULT_CHUNK = 40
MAX_CHUNK = 100


def _headers(cfg: Config) -> dict[str, str]:
    secret = (cfg.admin_secret or "").strip()
    return {
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json",
        "Authorization": f"Bearer {secret}",
        "User-Agent": "eanimal-base-seo-local/1.0",
    }


def _post_json(
    cfg: Config,
    path: str,
    payload: dict[str, Any],
    *,
    on_log: LogFn = None,
    label: str = "",
) -> dict[str, Any]:
    if not (cfg.admin_secret or "").strip():
        raise RuntimeError(
            "발행 시크릿이 없습니다. .env.local 의 CRON_SECRET / SYNC_SECRET / BASE_SEO_PUBLISH_SECRET 을 확인하세요."
        )
    url = f"{cfg.api_base.rstrip('/')}{path}"
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    last_err: Exception | None = None

    for attempt in range(1, MAX_RETRIES + 1):
        if on_log and label:
            on_log(f"  API {label} … 시도 {attempt}/{MAX_RETRIES}")
        req = Request(url, data=body, headers=_headers(cfg), method="POST")
        try:
            with urlopen(req, timeout=REQUEST_TIMEOUT_SEC) as res:
                return json.loads(res.read().decode("utf-8"))
        except HTTPError as e:
            detail = e.read().decode("utf-8", errors="replace")[:500]
            last_err = RuntimeError(f"API {e.code}: {detail}")
            if attempt < MAX_RETRIES and e.code in {408, 429, 500, 502, 503, 504}:
                wait = min(15, 2 * attempt)
                if on_log:
                    on_log(f"  재시도 대기 {wait}s")
                time.sleep(wait)
                continue
            raise last_err from e
        except (URLError, TimeoutError, socket.timeout, OSError) as e:
            last_err = e
            if attempt < MAX_RETRIES:
                wait = min(15, 2 * attempt)
                if on_log:
                    on_log(f"  네트워크 재시도 {wait}s ({e})")
                time.sleep(wait)
                continue
            raise RuntimeError(str(e)) from e
    raise RuntimeError(str(last_err or "API 실패"))


def publish_batch(
    cfg: Config,
    *,
    category: str,
    keywords: list[str],
    image_cdn: str = "",
    image_max: int = 0,
    image_ext: str = "webp",
    skip_indexnow: bool = True,
    on_log: LogFn = None,
) -> dict[str, Any]:
    return _post_json(
        cfg,
        "/api/admin/base-seo",
        {
            "action": "batch",
            "category": category,
            "keywords": keywords,
            "imageCdn": image_cdn,
            "imageMax": image_max,
            "imageExt": image_ext,
            "skipIndexNow": skip_indexnow,
        },
        on_log=on_log,
        label="batch",
    )


def submit_indexnow(cfg: Config, urls: list[str], *, on_log: LogFn = None) -> dict[str, Any]:
    return _post_json(
        cfg,
        "/api/admin/base-seo",
        {"action": "indexnow", "urls": urls},
        on_log=on_log,
        label="indexnow",
    )
