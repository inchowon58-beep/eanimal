import Link from "next/link";

/** 프리미엄 분양/보호소 전환용 고정 배너 슬롯 */
export default function MarketingBanner() {
  return (
    <aside
      className="rounded-xl border border-border bg-muted px-4 py-3 sm:px-5 sm:py-4"
      aria-label="프리미엄 안내"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-accent">
            Premium · Shelter
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            분양·보호소 파트너 안내 영역
          </p>
          <p className="mt-0.5 text-xs text-muted-fg">
            상단 고정 슬롯 — 트래픽 전환용 배너가 이 자리에 표시됩니다.
          </p>
        </div>
        <Link
          href="/places"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-accent-fg"
        >
          시설 둘러보기
        </Link>
      </div>
    </aside>
  );
}
