"""반려문화위원회 기본 SEO — 로컬 FastAPI (브라우저 UI). 웹문서 등록 없음."""

from __future__ import annotations

import os
import sys
import threading
import traceback
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app_paths import app_dir, resource_dir  # noqa: E402
from publisher.config import (  # noqa: E402
    CATEGORIES,
    load_config,
    load_gui_settings,
    save_gui_settings,
)
from publisher.pipeline import run_pipeline  # noqa: E402

STATIC = resource_dir() / "web" / "static"
if not STATIC.exists():
    STATIC = Path(__file__).resolve().parent / "static"

app = FastAPI(title="반려문화위원회 기본 SEO")
app.mount("/static", StaticFiles(directory=str(STATIC)), name="static")

_job_lock = threading.RLock()
_job: dict[str, Any] = {
    "running": False,
    "logs": [],
    "result": None,
    "error": None,
}


def _append_log(msg: str) -> None:
    with _job_lock:
        _job["logs"].append(msg)
        if len(_job["logs"]) > 2000:
            _job["logs"] = _job["logs"][-1500:]


class RunBody(BaseModel):
    category: str = "shelter"
    keywords: str = ""
    count: int | None = None
    chunk_size: int | None = 40
    image_cdn: str = ""
    image_max: int = 0
    image_ext: str = "webp"
    api_base: str = ""
    do_publish: bool = True
    do_indexnow: bool = True
    generate_only: bool = False


class SettingsBody(BaseModel):
    api_base: str = ""
    image_cdn: str = ""
    image_max: str = ""
    image_ext: str = "webp"
    category: str = "shelter"
    last_keywords: str = ""
    count: str = ""
    chunk_size: str = "40"


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC / "index.html")


@app.get("/api/meta")
def meta() -> dict[str, Any]:
    cfg = load_config()
    saved = load_gui_settings()
    return {
        "categories": CATEGORIES,
        "adminSecretLoaded": bool((cfg.admin_secret or "").strip()),
        "settings": {
            "api_base": saved.get("api_base") or cfg.api_base,
            "image_cdn": saved.get("image_cdn") or cfg.image_cdn,
            "image_max": str(saved.get("image_max") or cfg.image_max or ""),
            "image_ext": saved.get("image_ext") or cfg.image_ext or "webp",
            "category": saved.get("category") or "shelter",
            "last_keywords": saved.get("last_keywords") or "",
            "count": str(saved.get("count") or ""),
            "chunk_size": str(saved.get("chunk_size") or "40"),
        },
    }


@app.post("/api/settings")
def save_settings(body: SettingsBody) -> dict[str, str]:
    data = body.model_dump()
    save_gui_settings(data)
    env_path = app_dir() / ".env"
    lines: list[str] = []
    if env_path.exists():
        lines = env_path.read_text(encoding="utf-8-sig").splitlines()
    kv: dict[str, str] = {}
    order: list[str] = []
    for line in lines:
        if not line.strip() or line.strip().startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k = k.strip()
        if k not in kv:
            order.append(k)
        kv[k] = v
    updates = {
        "BASE_SEO_API_BASE": body.api_base.strip(),
        "SEO_API_BASE": body.api_base.strip(),
        "IMAGE_CDN": body.image_cdn.strip().rstrip("/"),
        "IMAGE_MAX": body.image_max.strip(),
        "IMAGE_EXT": (body.image_ext.strip().lstrip(".") or "webp"),
    }
    for k, v in updates.items():
        if k not in kv:
            order.append(k)
        kv[k] = v
    # 기존 시크릿 키 유지
    env_path.write_text(
        "\n".join(f"{k}={kv[k]}" for k in order) + "\n",
        encoding="utf-8",
    )
    return {"ok": "true"}


@app.get("/api/job")
def job_status() -> dict[str, Any]:
    with _job_lock:
        return {
            "running": _job["running"],
            "logs": list(_job["logs"]),
            "result": _job["result"],
            "error": _job["error"],
        }


@app.post("/api/run")
def start_run(body: RunBody) -> dict[str, Any]:
    with _job_lock:
        if _job["running"]:
            raise HTTPException(409, "이미 발행 중입니다.")
        _job["running"] = True
        _job["logs"] = []
        _job["result"] = None
        _job["error"] = None

    def worker() -> None:
        try:
            if body.api_base.strip():
                os.environ["BASE_SEO_API_BASE"] = body.api_base.strip()
                os.environ["SEO_API_BASE"] = body.api_base.strip()
            if body.image_cdn.strip():
                os.environ["IMAGE_CDN"] = body.image_cdn.strip().rstrip("/")
            os.environ["IMAGE_MAX"] = str(body.image_max or 0)
            os.environ["IMAGE_EXT"] = body.image_ext.strip().lstrip(".") or "webp"

            save_gui_settings(
                {
                    **load_gui_settings(),
                    "api_base": body.api_base.strip(),
                    "image_cdn": body.image_cdn.strip().rstrip("/"),
                    "image_max": str(body.image_max or ""),
                    "image_ext": body.image_ext.strip().lstrip(".") or "webp",
                    "category": body.category,
                    "last_keywords": body.keywords,
                    "count": str(body.count or ""),
                    "chunk_size": str(body.chunk_size or 40),
                }
            )

            cfg = load_config()
            if body.api_base.strip():
                cfg.api_base = body.api_base.strip().rstrip("/")

            result = run_pipeline(
                cfg=cfg,
                category=body.category,
                keyword_text=body.keywords,
                count=body.count,
                chunk_size=body.chunk_size,
                image_cdn=body.image_cdn,
                image_max=body.image_max,
                image_ext=body.image_ext,
                do_publish=not body.generate_only and body.do_publish,
                do_indexnow=not body.generate_only and body.do_indexnow,
                on_log=_append_log,
            )
            with _job_lock:
                _job["result"] = {
                    "generated": result.get("generated"),
                    "urls": result.get("urls") or [],
                    "errors": result.get("errors") or [],
                    "urls_file": result.get("urls_file"),
                }
            _append_log(f"완료: {result.get('generated')}건")
        except Exception as e:
            tb = traceback.format_exc()
            _append_log(tb)
            with _job_lock:
                _job["error"] = str(e)
        finally:
            with _job_lock:
                _job["running"] = False

    threading.Thread(target=worker, daemon=True).start()
    return {"ok": True}


@app.post("/api/shutdown")
def shutdown() -> dict[str, str]:
    def _exit() -> None:
        import time

        time.sleep(0.4)
        os._exit(0)

    threading.Thread(target=_exit, daemon=True).start()
    return {"ok": "true"}
