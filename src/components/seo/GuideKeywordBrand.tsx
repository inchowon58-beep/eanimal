"use client";

import Link from "next/link";
import { useEffect } from "react";
import { GUIDE_BRAND_EVENT } from "@/components/brand/SiteLogo";
import { SITE } from "@/lib/site";

/**
 * aga식 하이브리드 브랜드:
 * - 작은 문구: 고정 사이트명 (반려문화위원회)
 * - 큰 문구: 페이지 전달 키워드 (서비스명처럼 노출)
 * 헤더 SiteLogo에도 동일 키워드를 전달한다.
 */
export default function GuideKeywordBrand({ keyword }: { keyword: string }) {
  const label = keyword.trim();

  useEffect(() => {
    if (!label) return;
    window.dispatchEvent(
      new CustomEvent(GUIDE_BRAND_EVENT, { detail: { keyword: label } })
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent(GUIDE_BRAND_EVENT, { detail: { keyword: "" } })
      );
    };
  }, [label]);

  if (!label) return null;

  return (
    <div className="mb-5 border-b border-border pb-5">
      {/* 헤더 로고가 SSR/첫 페인트에서도 읽을 수 있게 DOM 신호 */}
      <span id="guide-brand-signal" data-keyword={label} hidden aria-hidden />
      <Link
        href="/"
        className="group inline-flex max-w-full flex-col gap-0.5 no-underline"
        aria-label={`${SITE.name} — ${label}`}
      >
        <span className="text-[11px] font-medium tracking-wide text-muted-fg sm:text-xs">
          {SITE.name}
        </span>
        <span className="font-display text-xl font-bold leading-snug tracking-tight text-foreground group-hover:text-foreground/80 sm:text-2xl">
          {label}
        </span>
      </Link>
    </div>
  );
}
