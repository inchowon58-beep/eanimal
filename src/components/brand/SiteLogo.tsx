"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";

export const GUIDE_BRAND_EVENT = "guide-keyword-brand";

/** 헤더용 협회 엠블럼 로고 + 명칭
 * 가이드 페이지에서는 작은 사이트명 + 큰 전달 키워드(aga식)로 전환 */
export default function SiteLogo({
  compact = false,
}: {
  compact?: boolean;
}) {
  const pathname = usePathname();
  const [guideKeyword, setGuideKeyword] = useState("");
  const onGuide = pathname?.startsWith("/guide/") ?? false;

  useEffect(() => {
    if (!onGuide) {
      setGuideKeyword("");
      return;
    }

    const apply = (keyword: string) => setGuideKeyword(keyword.trim());

    const fromDom = () => {
      const el = document.getElementById("guide-brand-signal");
      apply(el?.getAttribute("data-keyword") || "");
    };
    fromDom();

    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ keyword?: string }>).detail;
      apply(detail?.keyword || "");
    };
    window.addEventListener(GUIDE_BRAND_EVENT, onEvent);
    return () => window.removeEventListener(GUIDE_BRAND_EVENT, onEvent);
  }, [onGuide, pathname]);

  const showGuideBrand = onGuide && Boolean(guideKeyword);

  return (
    <Link
      href="/"
      className="group flex min-w-0 items-center gap-2.5"
      aria-label={
        showGuideBrand ? `${SITE.name} — ${guideKeyword}` : SITE.name
      }
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
          {showGuideBrand ? (
            <>
              <span className="block truncate text-[11px] font-medium leading-none text-muted-fg sm:text-xs">
                {SITE.name}
              </span>
              <span className="mt-0.5 block truncate font-display text-sm font-bold leading-tight tracking-tight text-foreground sm:text-[15px]">
                {guideKeyword}
              </span>
            </>
          ) : (
            <>
              <span className="block truncate font-display text-sm font-bold leading-tight tracking-tight text-foreground sm:text-[15px]">
                {SITE.name}
              </span>
              <span className="mt-0.5 hidden text-[11px] leading-none text-muted-fg sm:block">
                {SITE.tagline}
              </span>
            </>
          )}
        </span>
      )}
    </Link>
  );
}
