"""반려문화위원회 기본 SEO — 로컬 GUI (1건/대량)."""

from __future__ import annotations

import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, scrolledtext, ttk

from publish import CATEGORIES, DEFAULT_BASE, _secret, parse_keywords, publish_batch


class App(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("반려문화위원회 · 기본 SEO 발행")
        self.geometry("720x560")
        self.minsize(640, 480)

        frm = ttk.Frame(self, padding=12)
        frm.pack(fill=tk.BOTH, expand=True)

        ttk.Label(frm, text="사이트 URL").grid(row=0, column=0, sticky="w")
        self.base_var = tk.StringVar(value=DEFAULT_BASE)
        ttk.Entry(frm, textvariable=self.base_var).grid(row=0, column=1, sticky="ew", padx=(8, 0))

        ttk.Label(frm, text="카테고리").grid(row=1, column=0, sticky="w", pady=(8, 0))
        self.cat_var = tk.StringVar(value=CATEGORIES[0][0])
        cat = ttk.Combobox(
            frm,
            textvariable=self.cat_var,
            values=[f"{cid} — {label}" for cid, label in CATEGORIES],
            state="readonly",
        )
        cat.grid(row=1, column=1, sticky="ew", padx=(8, 0), pady=(8, 0))
        cat.current(0)

        ttk.Label(frm, text="키워드 (한 줄에 하나, 또는 쉼표 구분)").grid(
            row=2, column=0, columnspan=2, sticky="w", pady=(12, 4)
        )
        self.text = scrolledtext.ScrolledText(frm, height=16, wrap=tk.WORD)
        self.text.grid(row=3, column=0, columnspan=2, sticky="nsew")

        btns = ttk.Frame(frm)
        btns.grid(row=4, column=0, columnspan=2, sticky="ew", pady=(10, 0))
        ttk.Button(btns, text="TXT 불러오기", command=self.load_txt).pack(side=tk.LEFT)
        ttk.Button(btns, text="1건 발행 (첫 줄)", command=lambda: self.run(True)).pack(
            side=tk.LEFT, padx=(8, 0)
        )
        ttk.Button(btns, text="대량 발행 실행", command=lambda: self.run(False)).pack(
            side=tk.LEFT, padx=(8, 0)
        )

        self.log = scrolledtext.ScrolledText(frm, height=8, wrap=tk.WORD, state=tk.DISABLED)
        self.log.grid(row=5, column=0, columnspan=2, sticky="nsew", pady=(10, 0))

        frm.columnconfigure(1, weight=1)
        frm.rowconfigure(3, weight=3)
        frm.rowconfigure(5, weight=1)

        if not _secret():
            self.append("경고: CRON_SECRET / SYNC_SECRET / BASE_SEO_PUBLISH_SECRET 이 없습니다.\n")

    def append(self, msg: str) -> None:
        self.log.configure(state=tk.NORMAL)
        self.log.insert(tk.END, msg)
        self.log.see(tk.END)
        self.log.configure(state=tk.DISABLED)

    def load_txt(self) -> None:
        path = filedialog.askopenfilename(filetypes=[("Text", "*.txt"), ("All", "*.*")])
        if not path:
            return
        self.text.delete("1.0", tk.END)
        self.text.insert(tk.END, Path(path).read_text(encoding="utf-8"))

    def category_id(self) -> str:
        raw = self.cat_var.get()
        return raw.split("—")[0].strip() if "—" in raw else raw.strip()

    def run(self, single: bool) -> None:
        secret = _secret()
        if not secret:
            messagebox.showerror("오류", "발행 시크릿이 없습니다. .env.local 의 CRON_SECRET 등을 확인하세요.")
            return
        keywords = parse_keywords(self.text.get("1.0", tk.END))
        if not keywords:
            messagebox.showwarning("안내", "키워드를 입력하세요.")
            return
        if single:
            keywords = keywords[:1]

        base = self.base_var.get().strip() or DEFAULT_BASE
        category = self.category_id()

        def worker() -> None:
            self.append(f"\n--- 발행 시작 ({len(keywords)}건, {category}) ---\n")
            try:
                # 20개씩
                ok = 0
                err = 0
                for i in range(0, len(keywords), 20):
                    batch = keywords[i : i + 20]
                    result = publish_batch(base, secret, category, batch)
                    ok += int(result.get("created", 0))
                    err += len(result.get("errors") or [])
                    for p in result.get("pages") or []:
                        self.append(f"OK  {p.get('keyword')} → {p.get('path')}\n")
                    for e in result.get("errors") or []:
                        self.append(f"ERR {e.get('keyword')}: {e.get('error')}\n")
                self.append(f"완료: ok={ok} errors={err}\n")
            except Exception as e:
                self.append(f"실패: {e}\n")

        threading.Thread(target=worker, daemon=True).start()


if __name__ == "__main__":
    App().mainloop()
