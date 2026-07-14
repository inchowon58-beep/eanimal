import Link from "next/link";
import SiteLogo from "@/components/brand/SiteLogo";
import PortalSearch from "@/components/layout/PortalSearch";
import { PRIMARY_NAV } from "@/lib/nav";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
      {/* 상단: 로고 · 검색 · 로그인 */}
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6 sm:py-3.5">
        <SiteLogo />
        <div className="hidden min-w-0 flex-1 md:block">
          <PortalSearch />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href="/admin/login"
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-accent/40"
          >
            로그인
          </Link>
        </div>
      </div>

      {/* 모바일 검색 */}
      <div className="border-t border-border/70 px-4 py-2 md:hidden">
        <PortalSearch />
      </div>

      {/* 카테고리 메뉴 */}
      <nav
        className="border-t border-border/80 bg-card/80"
        aria-label="주요 서비스"
      >
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 sm:justify-center sm:gap-0 sm:overflow-visible sm:px-6">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 whitespace-nowrap px-3 py-2.5 text-[13px] font-medium text-muted-fg transition hover:text-accent sm:px-4 sm:text-sm"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
