from __future__ import annotations

from typing import Any, Callable

from publisher.api_client import DEFAULT_CHUNK, publish_batch, submit_indexnow
from publisher.cdn_images import image_pool_info
from publisher.config import Config
from app_paths import app_dir

LogFn = Callable[[str], None] | None


def parse_keywords(text: str) -> list[str]:
    raw = text.replace(",", "\n").splitlines()
    out: list[str] = []
    seen: set[str] = set()
    for line in raw:
        kw = line.strip()
        if not kw or kw in seen:
            continue
        seen.add(kw)
        out.append(kw)
    return out


def run_pipeline(
    *,
    cfg: Config,
    category: str,
    keyword_text: str,
    count: int | None = None,
    image_cdn: str = "",
    image_max: int = 0,
    image_ext: str = "webp",
    do_publish: bool = True,
    do_indexnow: bool = True,
    on_log: LogFn = None,
) -> dict[str, Any]:
    def log(msg: str) -> None:
        if on_log:
            on_log(msg)

    keywords = parse_keywords(keyword_text)
    if count and count > 0:
        keywords = keywords[:count]
    if not keywords:
        raise RuntimeError("키워드가 없습니다.")

    info = image_pool_info(image_cdn, image_max, image_ext)
    log(f"카테고리={category} · 키워드 {len(keywords)}건")
    log(
        f"이미지={info['mode']}"
        + (f" ({info['range']}.{info['ext']})" if info["range"] else "")
    )

    if not do_publish:
        log("생성만 모드: 사이트 발행을 건너뜁니다. (미리보기용 키워드 목록만 확인)")
        return {
            "generated": 0,
            "urls": [],
            "errors": [],
            "preview": keywords,
        }

    created_pages: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []

    for i in range(0, len(keywords), DEFAULT_CHUNK):
        batch = keywords[i : i + DEFAULT_CHUNK]
        log(f"발행 배치 {i // DEFAULT_CHUNK + 1} ({len(batch)}건)…")
        result = publish_batch(
            cfg,
            category=category,
            keywords=batch,
            image_cdn=image_cdn,
            image_max=image_max,
            image_ext=image_ext,
            skip_indexnow=True,
            on_log=on_log,
        )
        pages = result.get("pages") or []
        created_pages.extend(pages)
        for err in result.get("errors") or []:
            errors.append(
                {"keyword": str(err.get("keyword") or ""), "error": str(err.get("error") or "")}
            )
            log(f"  ERR {err.get('keyword')}: {err.get('error')}")
        for p in pages:
            log(f"  OK  {p.get('keyword')} → {p.get('path')}")

    urls = [str(p.get("url") or "") for p in created_pages if p.get("url")]
    out_dir = app_dir() / "output"
    out_dir.mkdir(parents=True, exist_ok=True)
    urls_file = out_dir / f"last_urls_{category}.txt"
    urls_file.write_text("\n".join(urls) + ("\n" if urls else ""), encoding="utf-8")
    log(f"URL 저장: {urls_file}")

    if do_indexnow and urls:
        log(f"IndexNow 전송 ({len(urls)}건)…")
        try:
            # path 또는 절대 URL 모두 허용
            paths = [str(p.get("path") or p.get("url") or "") for p in created_pages]
            paths = [u for u in paths if u]
            result = submit_indexnow(cfg, paths, on_log=on_log)
            log(f"IndexNow: ok={result.get('ok')} submitted={result.get('submitted')}")
        except Exception as e:
            log(f"IndexNow 실패: {e}")
            errors.append({"keyword": "_indexnow", "error": str(e)})
    elif do_indexnow:
        log("IndexNow: 전송할 URL 없음")

    return {
        "generated": len(created_pages),
        "urls": urls,
        "errors": errors,
        "urls_file": str(urls_file),
    }
