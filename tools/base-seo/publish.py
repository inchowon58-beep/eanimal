"""CLI: 기본 SEO 로컬 대량 발행."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from publisher.config import load_config
from publisher.pipeline import run_pipeline


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="기본 SEO 로컬 대량 발행")
    parser.add_argument("--category", default="shelter")
    parser.add_argument("--keywords", required=True, help="키워드 txt")
    parser.add_argument("--base", default="", help="사이트 URL")
    parser.add_argument("--image-cdn", default="")
    parser.add_argument("--image-max", type=int, default=0)
    parser.add_argument("--image-ext", default="webp")
    parser.add_argument("--no-publish", action="store_true")
    parser.add_argument("--no-indexnow", action="store_true")
    parser.add_argument("--count", type=int, default=0)
    args = parser.parse_args(argv)

    path = Path(args.keywords)
    if not path.exists():
        print(f"ERROR: 파일 없음: {path}", file=sys.stderr)
        return 1

    cfg = load_config()
    if args.base.strip():
        cfg.api_base = args.base.strip().rstrip("/")

    def log(msg: str) -> None:
        print(msg)

    try:
        result = run_pipeline(
            cfg=cfg,
            category=args.category,
            keyword_text=path.read_text(encoding="utf-8"),
            count=args.count or None,
            image_cdn=args.image_cdn,
            image_max=args.image_max,
            image_ext=args.image_ext,
            do_publish=not args.no_publish,
            do_indexnow=not args.no_indexnow and not args.no_publish,
            on_log=log,
        )
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1

    print(f"DONE generated={result.get('generated')} errors={len(result.get('errors') or [])}")
    return 0 if not result.get("errors") else 2


if __name__ == "__main__":
    raise SystemExit(main())
