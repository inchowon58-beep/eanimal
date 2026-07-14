import type { Metadata } from "next";
import Link from "next/link";
import MarketingBanner from "@/components/places/MarketingBanner";
import PlaceCard from "@/components/places/PlaceCard";
import PlacesFilterBar from "@/components/places/PlacesFilterBar";
import PlacesSeoBody from "@/components/places/PlacesSeoBody";
import { listPlaces, parsePlacesFilter } from "@/lib/places/queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";

/** SSR: 요청마다 서버에서 HTML 완성 (클라이언트 외부 API 금지) */
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
    description: `${label} 동물병원·동물약국·위탁관리업 인허가 정보 — ${SITE.name}`,
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
        <MarketingBanner />
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

      {totalPages > 1 && (
        <nav
          className="mt-8 flex flex-wrap items-center justify-center gap-2"
          aria-label="페이지"
        >
          {Array.from({ length: Math.min(totalPages, 12) }, (_, i) => i + 1).map(
            (p) => {
              const qs = new URLSearchParams();
              if (filter.sido) qs.set("sido", filter.sido);
              if (filter.sigungu) qs.set("sigungu", filter.sigungu);
              if (filter.category) qs.set("category", filter.category);
              if (filter.q) qs.set("q", filter.q);
              qs.set("page", String(p));
              const active = p === result.page;
              return (
                <Link
                  key={p}
                  href={`/places?${qs.toString()}`}
                  className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm ${
                    active
                      ? "bg-accent font-semibold text-accent-fg"
                      : "border border-border bg-card text-muted-fg hover:text-foreground"
                  }`}
                >
                  {p}
                </Link>
              );
            }
          )}
        </nav>
      )}

      <PlacesSeoBody
        sido={filter.sido}
        sigungu={filter.sigungu}
        category={filter.category}
        total={result.total}
      />
    </div>
  );
}
