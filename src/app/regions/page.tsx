import type { Metadata } from "next";
import Link from "next/link";
import MarketingBanner from "@/components/places/MarketingBanner";
import {
  listDistinctSido,
  regionPath,
  SIDO_LIST,
} from "@/lib/regions";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "지역별 반려동물 인프라",
  description: `시·도별 동물병원·동물약국·동물장묘업 안내 — ${SITE.name}`,
};

export default async function RegionsIndexPage() {
  const sidos = await listDistinctSido();
  const list = sidos.length ? sidos : [...SIDO_LIST];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <MarketingBanner placement="regions" />
      <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        지역별 반려동물 인프라
      </h1>
      <p className="mt-2 text-sm text-muted-fg">
        시·도를 선택하면 동물병원·동물약국·동물장묘업 롱테일 페이지로 이동합니다.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((sido) => (
          <Link
            key={sido}
            href={regionPath(sido)}
            className="rounded-xl border border-border bg-card px-4 py-4 text-sm font-medium text-foreground transition hover:border-accent/40"
          >
            {sido}
          </Link>
        ))}
      </div>
    </div>
  );
}
