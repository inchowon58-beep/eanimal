import type { Metadata } from "next";
import Link from "next/link";
import MarketingBanner from "@/components/places/MarketingBanner";
import PlaceCard from "@/components/places/PlaceCard";
import PlacesSeoBody from "@/components/places/PlacesSeoBody";
import { listPlaces } from "@/lib/places/queries";
import {
  regionPath,
  resolveSidoParam,
  resolveSigunguParam,
} from "@/lib/regions";
import { PLACE_CATEGORIES, SITE } from "@/lib/site";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ sido: string; sigungu: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { sido: rawSido, sigungu: rawSigungu } = await params;
  const sido = resolveSidoParam(rawSido);
  const sigungu = resolveSigunguParam(rawSigungu);
  return {
    title: `${sido} ${sigungu} 동물병원·약국·장묘`,
    description: `${sido} ${sigungu} 반려동물 인프라 인허가 정보 — ${SITE.name}`,
  };
}

export default async function RegionSigunguPage({ params }: PageProps) {
  const { sido: rawSido, sigungu: rawSigungu } = await params;
  const sido = resolveSidoParam(rawSido);
  const sigungu = resolveSigunguParam(rawSigungu);
  const result = await listPlaces({ sido, sigungu, page: 1, pageSize: 36 });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <MarketingBanner />
      <nav className="mt-4 text-sm text-muted-fg">
        <Link href="/regions" className="hover:text-foreground">
          지역
        </Link>
        <span className="mx-2">/</span>
        <Link href={regionPath(sido)} className="hover:text-foreground">
          {sido}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{sigungu}</span>
      </nav>

      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {sido} {sigungu} 반려동물 시설
      </h1>
      <p className="mt-2 text-sm text-muted-fg">
        {sido} {sigungu} 인허가 시설{" "}
        {result.total.toLocaleString("ko-KR")}곳
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {PLACE_CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/places?sido=${encodeURIComponent(sido)}&sigungu=${encodeURIComponent(sigungu)}&category=${encodeURIComponent(cat)}`}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-fg hover:text-foreground"
          >
            {cat}
          </Link>
        ))}
      </div>

      {result.items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center text-sm text-muted-fg">
          이 지역에 동기화된 시설이 아직 없습니다. 공공데이터 동기화 후 표시됩니다.
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      )}

      <PlacesSeoBody sido={sido} sigungu={sigungu} total={result.total} />
    </div>
  );
}
