import type { Metadata } from "next";
import Link from "next/link";
import MarketingBanner from "@/components/places/MarketingBanner";
import RemoteImage from "@/components/media/RemoteImage";
import ListPagination from "@/components/ui/ListPagination";
import { listRescues } from "@/lib/rescues/queries";
import { buildRescueListSeo } from "@/lib/rescues/seo";
import { formatHappenDt, sexLabel } from "@/lib/rescues/types";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = await searchParams;
  const sido = typeof p.sido === "string" ? p.sido : undefined;
  const region = sido || "전국";
  return {
    title: `${region} 유실·유기동물 구조 공고`,
    description: `${region} 오늘 구조된 유기견·유기묘 보호소 공고 — ${SITE.name}`,
  };
}

export default async function RescuesPage({ searchParams }: Props) {
  const p = await searchParams;
  const sido = typeof p.sido === "string" ? p.sido : undefined;
  const q = typeof p.q === "string" ? p.q : undefined;
  const page = Math.max(1, Number(typeof p.page === "string" ? p.page : 1) || 1);
  const result = await listRescues({ page, sido, q });
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const seo = buildRescueListSeo({ sido, total: result.total });
  const paragraphs = seo.split("\n\n");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <MarketingBanner />
      <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {sido || "전국"} 유실·유기동물 구조 공고
      </h1>
      <p className="mt-2 text-sm text-muted-fg">
        공고 {result.total.toLocaleString("ko-KR")}건 · 이미지 URL만 캐시(파일 미저장)
      </p>

      <form method="get" action="/rescues" className="mt-6 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
        <label className="text-xs font-medium text-muted-fg">
          시 / 도
          <select name="sido" defaultValue={sido || ""} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
            <option value="">전체</option>
            {result.sidoOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-muted-fg sm:col-span-1">
          품종·장소 검색
          <input name="q" defaultValue={q || ""} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
        </label>
        <div className="flex items-end">
          <button type="submit" className="h-10 w-full rounded-lg bg-accent text-sm font-semibold text-accent-fg">필터 적용</button>
        </div>
      </form>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {result.items.map((item) => (
          <Link
            key={item.desertion_no}
            href={`/rescues/${encodeURIComponent(item.desertion_no)}`}
            className="overflow-hidden rounded-xl border border-border bg-card transition hover:border-accent/40"
          >
            <div className="relative aspect-[4/3] bg-muted">
              <RemoteImage src={item.image_url} alt={item.kind_cd || "구조동물"} />
            </div>
            <div className="p-3 sm:p-4">
              <p className="text-[11px] text-muted-fg sm:text-xs">{formatHappenDt(item.happen_dt)}</p>
              <h2 className="mt-0.5 line-clamp-1 text-sm font-semibold text-foreground sm:mt-1 sm:text-base">{item.kind_cd || "품종 미상"}</h2>
              <p className="mt-1 line-clamp-2 text-xs text-muted-fg sm:text-sm">
                {item.happen_place || "구조 장소 미상"} · {sexLabel(item.sex_cd)}
              </p>
              <p className="mt-2 line-clamp-1 text-[11px] text-muted-fg sm:text-xs">{item.care_nm || "보호소 미상"}</p>
            </div>
          </Link>
        ))}
      </div>

      {result.items.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-fg">
          표시할 공고가 없습니다. 동기화 후 다시 확인해 주세요.
        </p>
      )}

      <ListPagination
        page={page}
        totalPages={totalPages}
        basePath="/rescues"
        params={{ sido, q }}
      />

      <section className="seo-body mt-12 rounded-xl border border-border bg-card p-5 sm:p-8">
        <h2 className="font-display text-lg font-semibold text-foreground">구조동물 공고 안내</h2>
        <div className="mt-4">
          {paragraphs.map((para) => (
            <p key={para.slice(0, 24)}>{para}</p>
          ))}
        </div>
      </section>
    </div>
  );
}
