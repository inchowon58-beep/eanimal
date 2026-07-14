import Link from "next/link";
import { SITE } from "@/lib/site";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="shrink-0 font-display text-base font-semibold tracking-tight text-foreground">
          {SITE.name}
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm text-muted-fg">
          <Link href="/places" className="transition hover:text-foreground">
            시설
          </Link>
          <Link href="/rescues" className="transition hover:text-foreground">
            구조공고
          </Link>
          <Link href="/travel" className="transition hover:text-foreground">
            동반여행
          </Link>
          <Link href="/regions" className="hidden transition hover:text-foreground sm:inline">
            지역
          </Link>
          <Link
            href="/places?category=동물병원"
            className="hidden transition hover:text-foreground md:inline"
          >
            병원
          </Link>
          <Link
            href="/travel"
            className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition hover:opacity-90"
          >
            핫플
          </Link>
        </nav>
      </div>
    </header>
  );
}
