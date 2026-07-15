import { getSupabaseServer } from "@/lib/supabase/server";

/** Supabase 기본 max-rows(1000)와 사이트맵 5만 URL 한도를 고려한 청크 크기 */
export const SITEMAP_CHUNK = 1000;

export type SitemapChunk =
  | { kind: "core" }
  | { kind: "places" | "rescues" | "travel"; from: number; to: number };

async function tableCount(table: string): Promise<number> {
  const supabase = getSupabaseServer();
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

/**
 * 사이트맵 분할 계획. 0번은 정적/지역 페이지, 이후 상세 URL을 1,000개 단위로 나눈다.
 * generateSitemaps 와 sitemap() 이 동일 계획을 공유해 id → 데이터 구간을 매핑한다.
 */
export async function getSitemapPlan(): Promise<SitemapChunk[]> {
  const [places, rescues, travel] = await Promise.all([
    tableCount("places"),
    tableCount("rescued_animals"),
    tableCount("pet_travel"),
  ]);

  const chunks: SitemapChunk[] = [{ kind: "core" }];
  const addChunks = (kind: "places" | "rescues" | "travel", total: number) => {
    for (let from = 0; from < total; from += SITEMAP_CHUNK) {
      chunks.push({ kind, from, to: Math.min(from + SITEMAP_CHUNK, total) - 1 });
    }
  };

  addChunks("places", places);
  addChunks("rescues", rescues);
  addChunks("travel", travel);

  return chunks;
}
