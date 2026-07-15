import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";

/** 헤더용 협회 엠블럼 로고 + 명칭 */
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
      <Image
        src="/logo.png"
        alt={`${SITE.name} 로고`}
        width={44}
        height={44}
        priority
        className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
      />
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
