import type { Metadata } from "next";
import Link from "next/link";
import MarketingBanner from "@/components/places/MarketingBanner";
import RemoteImage from "@/components/media/RemoteImage";
import ListPagination from "@/components/ui/ListPagination";
import { listTravel } from "@/lib/travel/queries";
import { buildTravelListSeo } from "@/lib/travel/seo";
import { SITE } from "@/lib/site";
import { countSeoChars } from "@/lib/places/seo-copy";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = await searchParams;
  const sido = typeof p.sido === "string" ? p.sido : undefined;
  const region = sido || "전국";
  return {
    title: `${region} 반려동물 동반여행`,
    description: `${region} 애견동반 카페·펜션·관광지 추천 — ${SITE.name}`,
  };
}

export default async function TravelPage({ searchParams }: Props) {
  const p = await searchParams;
  const sido = typeof p.sido === "string" ? p.sido : undefined;
  const q = typeof p.q === "string" ? p.q : undefined;
  const page = Math.max(1, Number(typeof p.page === "string" ? p.page : 1) || 1);
  const result = await listTravel({ page, sido, q });
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const seo = buildTravelListSeo({ sido, total: result.total });
  const paragraphs = seo.split("\n\n");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <MarketingBanner />
      <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {sido || "전국"} 댕댕이랑 가기 좋은 곳
      </h1>
      <p className="mt-2 text-sm text-muted-fg">
        {result.total.toLocaleString("ko-KR")}곳 · 한국관광공사 데이터 · 이미지 URL만 저장
      </p>

      <form method="get" action="/travel" className="mt-6 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
        <label className="text-xs font-medium text-muted-fg">
          시 / 도
          <select name="sido" defaultValue={sido || ""} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
            <option value="">전체</option>
            {result.sidoOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-muted-fg">
          키워드
          <input name="q" defaultValue={q || ""} placeholder="카페, 펜션…" className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
        </label>
        <div className="flex items-end">
          <button type="submit" className="h-10 w-full rounded-lg bg-accent text-sm font-semibold text-accent-fg">필터 적용</button>
        </div>
      </form>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {result.items.map((item) => (
          <Link
            key={item.content_id}
            href={`/travel/${encodeURIComponent(item.content_id)}`}
            className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-accent/40"
          >
            <div className="relative aspect-[4/3] bg-muted">
              <RemoteImage src={item.image_url} alt={item.title} />
            </div>
            <div className="p-3 sm:p-4">
              <h2 className="line-clamp-1 text-sm font-semibold text-foreground group-hover:text-accent sm:text-base">{item.title}</h2>
              <p className="mt-1 line-clamp-2 text-xs text-muted-fg sm:text-sm">
                {[item.sido, item.address].filter(Boolean).join(" · ") || "주소 미상"}
              </p>
              {item.pet_info && (
                <p className="mt-2 line-clamp-2 text-[11px] text-muted-fg sm:text-xs">{item.pet_info}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {result.items.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-fg">표시할 장소가 없습니다. 동기화 후 확인해 주세요.</p>
      )}

      <ListPagination
        page={page}
        totalPages={totalPages}
        basePath="/travel"
        params={{ sido, q }}
      />

      <section className="seo-body mt-12 rounded-xl border border-border bg-card p-5 sm:p-8">
        <h2 className="font-display text-lg font-semibold">반려동물 동반여행 안내</h2>
        <p className="mt-1 text-xs text-muted-fg">본문 약 {countSeoChars(seo).toLocaleString("ko-KR")}자</p>
        <div className="mt-5">
          {paragraphs.map((para) => (
            <p key={para.slice(0, 24)}>{para}</p>
          ))}
        </div>
      </section>
    </div>
  );
}
