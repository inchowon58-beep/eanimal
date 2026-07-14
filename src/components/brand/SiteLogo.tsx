import Link from "next/link";
import { SITE } from "@/lib/site";

/** 헤더용 정사각 협회 로고 + 명칭 */
export default function SiteLogo({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className="group flex min-w-0 items-center gap-2.5"
      aria-label={SITE.name}
    >
      <span
        className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#c9a86a]/70 bg-gradient-to-br from-[#0b3d3a] via-[#0f5c56] to-[#0a4a45] shadow-sm sm:h-11 sm:w-11"
        aria-hidden
      >
        <span className="absolute inset-[10%] rounded-md border border-[#c9a86a]/50" />
        <span className="relative font-display text-lg font-bold leading-none tracking-tight text-[#f5f0e6] sm:text-xl">
          반
        </span>
        <span className="absolute bottom-1.5 h-0.5 w-4 rounded-full bg-[#c9a86a]/90" />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block truncate font-display text-sm font-bold leading-tight tracking-tight text-foreground sm:text-[15px]">
            {SITE.name}
          </span>
          <span className="mt-0.5 hidden text-[11px] leading-none text-muted-fg sm:block">
            {SITE.tagline}
          </span>
        </span>
      )}
    </Link>
  );
}
