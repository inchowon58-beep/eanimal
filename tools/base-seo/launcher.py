"""
반려문화위원회 기본 SEO 런처
- 로컬 웹서버 시작
- 브라우저 자동 실행
- 화면의 [프로그램 종료]로 종료
"""

from __future__ import annotations

import os
import socket
import sys
import threading
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def _ensure_stdio() -> None:
    if sys.stdout is None:
        sys.stdout = open(os.devnull, "w", encoding="utf-8")
    if sys.stderr is None:
        sys.stderr = open(os.devnull, "w", encoding="utf-8")


def _load_env() -> None:
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    from app_paths import app_dir, is_frozen

    candidates: list[tuple[Path, bool]] = []
    if not is_frozen():
        src = Path(__file__).resolve().parent
        root = src.parents[1]  # repo root (tools/base-seo -> repo)
        candidates.extend(
            [
                (root / ".env.local", False),
                (root / ".env", False),
                (src / ".env", True),
            ]
        )
    candidates.append((app_dir() / ".env", True))
    for p, override in candidates:
        if p.exists():
            load_dotenv(p, override=override, encoding="utf-8-sig")


def find_free_port(preferred: int = 8780) -> int:
    for port in range(preferred, preferred + 30):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    return preferred


def wait_ready(port: int, timeout: float = 25.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.5):
                return True
        except OSError:
            time.sleep(0.2)
    return False


def main() -> None:
    _ensure_stdio()
    _load_env()
    import uvicorn

    port = find_free_port(8780)
    os.environ["APP_PORT"] = str(port)
    url = f"http://127.0.0.1:{port}"

    def open_browser() -> None:
        if wait_ready(port):
            webbrowser.open(url)

    threading.Thread(target=open_browser, daemon=True).start()

    from web.app import app

    log_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {"format": "%(levelname)s: %(message)s"},
            "access": {"format": "%(levelname)s: %(message)s"},
        },
        "handlers": {
            "default": {
                "formatter": "default",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stderr",
            },
            "access": {
                "formatter": "access",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stderr",
            },
        },
        "loggers": {
            "uvicorn": {"handlers": ["default"], "level": "WARNING", "propagate": False},
            "uvicorn.error": {
                "handlers": ["default"],
                "level": "WARNING",
                "propagate": False,
            },
            "uvicorn.access": {
                "handlers": ["access"],
                "level": "WARNING",
                "propagate": False,
            },
        },
    }

    try:
        print(f"기본 SEO 발행기: {url}", flush=True)
    except Exception:
        pass
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=port,
        log_level="warning",
        log_config=log_config,
    )


if __name__ == "__main__":
    main()
