import type { Metadata } from "next";
import Link from "next/link";
import MarketingBanner from "@/components/places/MarketingBanner";
import PlaceCard from "@/components/places/PlaceCard";
import PlacesSeoBody from "@/components/places/PlacesSeoBody";
import { listPlaces } from "@/lib/places/queries";
import {
  listSigunguForSido,
  regionPath,
  resolveSidoParam,
} from "@/lib/regions";
import { PLACE_CATEGORIES } from "@/lib/site";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ sido: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { sido: raw } = await params;
  const sido = resolveSidoParam(raw);
  return {
    title: `${sido} 동물병원·동물약국·동물장묘`,
    description: `${sido} 반려동물 인프라 인허가 정보 — ${SITE.name}`,
  };
}

export default async function RegionSidoPage({ params }: PageProps) {
  const { sido: raw } = await params;
  const sido = resolveSidoParam(raw);
  const [result, sigunguList] = await Promise.all([
    listPlaces({ sido, page: 1, pageSize: 24 }),
    listSigunguForSido(sido),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <MarketingBanner placement="regions" />
      <nav className="mt-4 text-sm text-muted-fg">
        <Link href="/regions" className="hover:text-foreground">
          지역
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{sido}</span>
      </nav>

      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {sido} 반려동물 시설
      </h1>
      <p className="mt-2 text-sm text-muted-fg">
        등록 시설 {result.total.toLocaleString("ko-KR")}곳 · 시·군·구별 롱테일
        페이지
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {PLACE_CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/places?sido=${encodeURIComponent(sido)}&category=${encodeURIComponent(cat)}`}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-fg hover:text-foreground"
          >
            {cat}
          </Link>
        ))}
        <Link
          href={`/places?sido=${encodeURIComponent(sido)}`}
          className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg"
        >
          전체 목록
        </Link>
      </div>

      {sigunguList.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-foreground">시·군·구</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {sigunguList.map((sigungu) => (
              <Link
                key={sigungu}
                href={regionPath(sido, sigungu)}
                className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground transition hover:border-accent/40"
              >
                {sigungu}
              </Link>
            ))}
          </div>
        </section>
      )}

      {result.items.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-foreground">주요 시설</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </section>
      )}

      <PlacesSeoBody sido={sido} total={result.total} />
    </div>
  );
}
