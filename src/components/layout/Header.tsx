import Link from "next/link";
import { SITE } from "@/lib/site";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-display text-base font-semibold tracking-tight text-foreground">
          {SITE.name}
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted-fg">
          <Link href="/places" className="transition hover:text-foreground">
            시설 찾기
          </Link>
          <Link href="/regions" className="transition hover:text-foreground">
            지역
          </Link>
          <Link
            href="/places?category=동물병원"
            className="hidden transition hover:text-foreground sm:inline"
          >
            동물병원
          </Link>
          <Link
            href="/places?category=동물약국"
            className="hidden transition hover:text-foreground sm:inline"
          >
            동물약국
          </Link>
          <Link
            href="/places?category=동물장묘업"
            className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition hover:opacity-90"
          >
            동물장묘
          </Link>
        </nav>
      </div>
    </header>
  );
}
