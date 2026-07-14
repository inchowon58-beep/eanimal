import Link from "next/link";
import { SITE, PLACE_CATEGORIES } from "@/lib/site";
import MarketingBanner from "@/components/places/MarketingBanner";

export default function HomePage() {
  return (
    <div>
      <section className="border-b border-border bg-gradient-to-b from-muted/80 to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-sm font-medium text-accent">{SITE.tagline}</p>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            {SITE.name}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-fg sm:text-lg">
            공공 인허가 데이터 기반 동물병원·동물약국·위탁관리업 정보를 지역별로
            확인하세요.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/places"
              className="inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-accent-fg"
            >
              시설 찾기
            </Link>
            <Link
              href="/regions"
              className="inline-flex h-11 items-center rounded-lg border border-border bg-card px-5 text-sm font-medium text-foreground"
            >
              지역별 보기
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        <MarketingBanner />

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">
            카테고리
          </h2>
          <p className="mt-1 text-sm text-muted-fg">
            시·도·시군구 필터와 함께 SSR로 제공되는 목록 페이지입니다.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {PLACE_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/places?category=${encodeURIComponent(cat)}`}
                className="rounded-xl border border-border bg-card p-5 transition hover:border-accent/40"
              >
                <h3 className="font-semibold text-foreground">{cat}</h3>
                <p className="mt-2 text-sm text-muted-fg">
                  {cat} 인허가 시설 목록 보기
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
