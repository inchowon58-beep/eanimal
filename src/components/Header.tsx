"use client";

import { useState } from "react";
import Link from "next/link";
import { useSiteConfig } from "@/components/SiteConfigProvider";

const NAV_ITEMS = [
  { href: "/#about", label: "소개" },
  { href: "/#courses", label: "수강과정" },
  { href: "/#academies", label: "학원정보" },
  { href: "/#process", label: "상담절차" },
  { href: "/#reviews", label: "수강후기" },
  { href: "/#contact", label: "제휴문의" },
] as const;

export default function Header() {
  const site = useSiteConfig();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20 gap-4">
          <Link href="/" className="shrink-0 group" onClick={closeMenu}>
            <p className="font-black text-dark text-xl lg:text-2xl leading-tight group-hover:text-orange transition">
              {site.brandName}
            </p>
            <p className="text-[11px] sm:text-xs text-gray-500 leading-tight mt-0.5">
              {site.tagline}
            </p>
          </Link>

          <nav className="hidden lg:flex items-center gap-7 flex-1 justify-center">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-600 hover:text-orange whitespace-nowrap transition"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <a
              href={`tel:${site.phoneTel}`}
              className="px-5 py-2.5 bg-orange text-white text-sm font-bold rounded-full hover:bg-orange-light transition"
            >
              학원 상담 {site.phone}
            </a>
          </div>

          <div className="flex items-center shrink-0 lg:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 text-dark hover:bg-gray-50 transition"
              aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-orange hover:bg-gray-50 rounded-xl transition"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={`tel:${site.phoneTel}`}
              onClick={closeMenu}
              className="mx-4 mt-2 py-3 text-center bg-orange text-white font-bold rounded-xl"
            >
              전화연결 {site.phone}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
