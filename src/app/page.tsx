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
            인허가 시설 · 유실·유기동물 공고 · 반려동물 동반여행을 한곳에서 확인하세요.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/places"
              className="inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-accent-fg"
            >
              시설 찾기
            </Link>
            <Link
              href="/rescues"
              className="inline-flex h-11 items-center rounded-lg border border-border bg-card px-5 text-sm font-medium text-foreground"
            >
              구조 공고
            </Link>
            <Link
              href="/travel"
              className="inline-flex h-11 items-center rounded-lg border border-border bg-card px-5 text-sm font-medium text-foreground"
            >
              동반여행
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        <MarketingBanner />

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">인허가 시설</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {PLACE_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/places?category=${encodeURIComponent(cat)}`}
                className="rounded-xl border border-border bg-card p-5 transition hover:border-accent/40"
              >
                <h3 className="font-semibold text-foreground">{cat}</h3>
                <p className="mt-2 text-sm text-muted-fg">{cat} 인허가 목록</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <Link href="/rescues" className="rounded-xl border border-border bg-card p-6 transition hover:border-accent/40">
            <h3 className="font-semibold text-foreground">유실·유기동물 구조 공고</h3>
            <p className="mt-2 text-sm text-muted-fg">
              지역·품종·발견일 텍스트와 함께 매일 갱신되는 보호소 공고
            </p>
          </Link>
          <Link href="/travel" className="rounded-xl border border-border bg-card p-6 transition hover:border-accent/40">
            <h3 className="font-semibold text-foreground">반려동물 동반여행</h3>
            <p className="mt-2 text-sm text-muted-fg">
              애견동반 카페·펜션·관광지와 에티켓 안내
            </p>
          </Link>
        </section>
      </div>
    </div>
  );
}
