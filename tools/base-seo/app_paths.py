from __future__ import annotations

import os
import sys
from pathlib import Path


def is_frozen() -> bool:
    return getattr(sys, "frozen", False)


def app_dir() -> Path:
    if is_frozen():
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


def resource_dir() -> Path:
    if is_frozen():
        return Path(getattr(sys, "_MEIPASS", app_dir()))
    return Path(__file__).resolve().parent
