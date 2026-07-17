import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  getSeoPageBySlug,
  listCategoryGuidePool,
  listSeoPageSlugs,
  type RelatedGuideItem,
} from "@/lib/seo-pages/store";
import type { SeoPage } from "@/lib/seo-pages/types";

/** 가이드 HTML CDN 캐시 주기 — 생성/삭제 시 revalidateTag로 즉시 갱신 */
export const GUIDE_REVALIDATE_SECONDS = 86400; // 24시간

export const SEO_PAGES_TAG = "seo-pages";
export function seoPageTag(slug: string) {
  return `seo-page:${slug}`;
}
export function seoPoolTag(category: string | null | undefined) {
  return `seo-pool:${category || "_all"}`;
}

/** 요청 내 metadata + page 중복 조회 제거 */
export const getGuidePageCached = cache(async (slug: string): Promise<SeoPage | null> => {
  return unstable_cache(
    async () => getSeoPageBySlug(slug),
    ["guide-page", slug],
    {
      revalidate: GUIDE_REVALIDATE_SECONDS,
      tags: [SEO_PAGES_TAG, seoPageTag(slug)],
    }
  )();
});

/** 카테고리 관련글 풀 — 칩/연관어/카드가 공유 */
export const getGuidePoolCached = cache(
  async (
    category: string | null | undefined,
    excludeSlug: string
  ): Promise<RelatedGuideItem[]> => {
    const cat = category || "_all";
    return unstable_cache(
      async () => listCategoryGuidePool(category, excludeSlug, 200),
      ["guide-pool", cat, excludeSlug],
      {
        revalidate: GUIDE_REVALIDATE_SECONDS,
        tags: [SEO_PAGES_TAG, seoPoolTag(category)],
      }
    )();
  }
);

/** 빌드/프리렌더용 공개 슬러그 전체 (1000개 단위) */
export async function listAllGuideSlugs(max = 5000): Promise<string[]> {
  const slugs: string[] = [];
  const chunk = 1000;
  for (let from = 0; from < max; from += chunk) {
    const rows = await listSeoPageSlugs(from, from + chunk - 1);
    if (!rows.length) break;
    for (const r of rows) slugs.push(r.slug);
    if (rows.length < chunk) break;
  }
  return slugs;
}
