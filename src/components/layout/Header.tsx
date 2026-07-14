import Link from "next/link";
import SiteLogo from "@/components/brand/SiteLogo";
import { PRIMARY_NAV } from "@/lib/nav";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:gap-5 sm:px-6 sm:py-3">
        <SiteLogo />
        <nav
          className="min-w-0 flex-1 overflow-x-auto"
          aria-label="주요 서비스"
        >
          <div className="flex items-center gap-0.5 sm:justify-end sm:gap-1">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted-fg transition hover:bg-muted/70 hover:text-accent sm:px-3 sm:text-sm"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
