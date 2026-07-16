import type { Metadata } from "next";
import MarketingBanner from "@/components/places/MarketingBanner";
import PlaceCard from "@/components/places/PlaceCard";
import PlacesFilterBar from "@/components/places/PlacesFilterBar";
import PlacesPagination from "@/components/places/PlacesPagination";
import { listPlaces, parsePlacesFilter } from "@/lib/places/queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const filter = parsePlacesFilter(params);
  const parts = [filter.sido, filter.sigungu, filter.category].filter(Boolean);
  const label = parts.length ? parts.join(" ") : "전국";
  return {
    title: `${label} 반려동물 시설`,
    description: `${label} 동물병원·동물약국·동물장묘업 인허가 정보 — ${SITE.name}`,
  };
}

export default async function PlacesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filter = parsePlacesFilter(params);
  const result = await listPlaces(filter);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const configured = isSupabaseConfigured();

  const titleParts = [filter.sido, filter.sigungu, filter.category].filter(
    Boolean
  );
  const heading = titleParts.length
    ? `${titleParts.join(" ")} 시설`
    : "전국 반려동물 시설";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 space-y-4">
        <MarketingBanner placement="places" />
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {heading}
          </h1>
          <p className="mt-2 text-sm text-muted-fg">
            {configured
              ? `조건에 맞는 시설 ${result.total.toLocaleString("ko-KR")}곳`
              : "Supabase 환경변수를 설정하면 인허가 데이터가 표시됩니다."}
          </p>
        </div>
      </div>

      <PlacesFilterBar
        filter={filter}
        sidoOptions={result.sidoOptions}
        sigunguOptions={result.sigunguOptions}
      />

      {result.items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="text-sm font-medium text-foreground">표시할 시설이 없습니다</p>
          <p className="mt-2 text-sm text-muted-fg">
            {configured
              ? "필터를 바꾸거나, 공공데이터 동기화 후 다시 확인해 주세요."
              : "NEXT_PUBLIC_SUPABASE_URL / ANON(또는 SERVICE) KEY를 .env.local에 넣고 supabase/schema.sql을 적용하세요."}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      )}

      <PlacesPagination
        page={result.page}
        totalPages={totalPages}
        filter={{
          sido: filter.sido,
          sigungu: filter.sigungu,
          category: filter.category || undefined,
          q: filter.q,
        }}
      />
    </div>
  );
}
