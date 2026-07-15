"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV } from "@/lib/nav";

export default function HeaderNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* 데스크톱: 가로 메뉴 */}
      <nav
        className="hidden min-w-0 flex-1 md:block"
        aria-label="주요 서비스"
      >
        <div className="flex items-center justify-end gap-1">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted-fg transition hover:bg-muted/70 hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* 모바일: 햄버거 버튼 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="메뉴 열기"
        aria-expanded={open}
        className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground md:hidden"
      >
        <span className="flex flex-col items-center justify-center gap-[5px]">
          <span
            className={`block h-0.5 w-5 bg-current transition-transform ${
              open ? "translate-y-[7px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-5 bg-current transition-opacity ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-5 bg-current transition-transform ${
              open ? "-translate-y-[7px] -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      {/* 모바일: 펼침 메뉴 */}
      {open && (
        <div className="absolute inset-x-0 top-full border-b border-border bg-background shadow-lg md:hidden">
          <nav
            className="mx-auto flex max-w-6xl flex-col px-4 py-2"
            aria-label="주요 서비스 (모바일)"
          >
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-2 py-3 text-sm font-medium text-foreground transition hover:bg-muted/70 hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
