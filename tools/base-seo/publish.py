"""반려문화위원회 — 기본 SEO 로컬 대량 발행 (Gemini 없음, 템플릿).

환경변수:
  BASE_SEO_API_BASE   예: https://www.eanimal.kr  (기본값)
  BASE_SEO_PUBLISH_SECRET 또는 CRON_SECRET 또는 SYNC_SECRET
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import List

CATEGORIES = [
    ("shelter", "보호소"),
    ("adopt", "강아지분양"),
    ("hospital", "동물병원"),
    ("funeral", "장례식장"),
    ("cafe", "애견카페"),
    ("pharmacy", "동물약국"),
    ("hotel", "애견호텔·펜션"),
    ("academy", "미용학원"),
]

DEFAULT_BASE = os.environ.get("BASE_SEO_API_BASE") or os.environ.get(
    "NEXT_PUBLIC_SITE_URL", "https://www.eanimal.kr"
)


def _secret() -> str:
    for key in ("BASE_SEO_PUBLISH_SECRET", "CRON_SECRET", "SYNC_SECRET"):
        v = os.environ.get(key, "").strip()
        if v:
            return v
    # 로컬 .env.local 간단 로드
    root = Path(__file__).resolve().parents[2]
    env_path = root / ".env.local"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, val = line.partition("=")
            k, val = k.strip(), val.strip().strip('"').strip("'")
            if k in ("BASE_SEO_PUBLISH_SECRET", "CRON_SECRET", "SYNC_SECRET") and val:
                os.environ.setdefault(k, val)
                return val
    return ""


def parse_keywords(text: str) -> List[str]:
    raw = text.replace(",", "\n").splitlines()
    out: List[str] = []
    seen = set()
    for line in raw:
        kw = line.strip()
        if not kw or kw in seen:
            continue
        seen.add(kw)
        out.append(kw)
    return out


def publish_batch(base_url: str, secret: str, category: str, keywords: List[str]) -> dict:
    url = base_url.rstrip("/") + "/api/admin/base-seo"
    payload = json.dumps(
        {"action": "batch", "category": category, "keywords": keywords},
        ensure_ascii=False,
    ).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        method="POST",
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": f"Bearer {secret}",
        },
    )
    with urllib.request.urlopen(req, timeout=300) as res:
        return json.loads(res.read().decode("utf-8"))


def main(argv: List[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="기본 SEO 로컬 대량 발행")
    parser.add_argument("--category", default="shelter", help="카테고리 id")
    parser.add_argument("--keywords", required=True, help="키워드 txt 파일 경로")
    parser.add_argument("--base", default=DEFAULT_BASE, help="사이트 URL")
    parser.add_argument("--chunk", type=int, default=20, help="한 번에 보낼 키워드 수")
    args = parser.parse_args(argv)

    secret = _secret()
    if not secret:
        print("ERROR: BASE_SEO_PUBLISH_SECRET / CRON_SECRET / SYNC_SECRET 필요", file=sys.stderr)
        return 1

    path = Path(args.keywords)
    if not path.exists():
        print(f"ERROR: 파일 없음: {path}", file=sys.stderr)
        return 1

    keywords = parse_keywords(path.read_text(encoding="utf-8"))
    if not keywords:
        print("ERROR: 키워드가 비어 있습니다.", file=sys.stderr)
        return 1

    print(f"category={args.category} count={len(keywords)} base={args.base}")
    total_ok = 0
    total_err = 0
    chunk = max(1, args.chunk)
    for i in range(0, len(keywords), chunk):
        batch = keywords[i : i + chunk]
        try:
            result = publish_batch(args.base, secret, args.category, batch)
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")
            print(f"HTTP {e.code}: {body}", file=sys.stderr)
            return 1
        except Exception as e:
            print(f"ERROR: {e}", file=sys.stderr)
            return 1

        created = result.get("created", 0)
        errors = result.get("errors") or []
        total_ok += int(created)
        total_err += len(errors)
        print(f"  batch {i // chunk + 1}: created={created} errors={len(errors)}")
        for err in errors[:5]:
            print(f"    - {err.get('keyword')}: {err.get('error')}")
        for p in result.get("pages") or []:
            print(f"    + {p.get('keyword')} → {p.get('path')}")

    print(f"DONE ok={total_ok} errors={total_err}")
    return 0 if total_err == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
