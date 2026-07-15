import { getSupabaseServer } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";
import { listDistinctSido, regionPath, SIDO_LIST } from "@/lib/regions";

/** Supabase 기본 max-rows(1000)와 사이트맵 5만 URL 한도를 고려한 청크 크기 */
export const SITEMAP_CHUNK = 1000;

export type SitemapChunk =
  | { kind: "core" }
  | { kind: "places" | "rescues" | "travel"; from: number; to: number };

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

export function sitemapBaseUrl(): string {
  return SITE.url.replace(/\/$/, "");
}

async function tableCount(table: string): Promise<number> {
  const supabase = getSupabaseServer();
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("hidden", false);
  if (error) return 0;
  return count ?? 0;
}

/**
 * 사이트맵 분할 계획. 0번은 정적/지역 페이지, 이후 상세 URL을 1,000개 단위로 나눈다.
 * 인덱스와 개별 사이트맵이 동일 계획을 공유해 id → 데이터 구간을 매핑한다.
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

async function coreUrls(base: string): Promise<SitemapUrl[]> {
  const sidos = await listDistinctSido();
  const sidoList = sidos.length ? sidos : [...SIDO_LIST];

  const urls: SitemapUrl[] = [
    { loc: base, changefreq: "daily", priority: 1 },
    { loc: `${base}/places`, changefreq: "daily", priority: 0.9 },
    { loc: `${base}/rescues`, changefreq: "daily", priority: 0.9 },
    { loc: `${base}/travel`, changefreq: "daily", priority: 0.9 },
    { loc: `${base}/regions`, changefreq: "daily", priority: 0.9 },
  ];
  for (const sido of sidoList) {
    urls.push({
      loc: `${base}${regionPath(sido)}`,
      changefreq: "daily",
      priority: 0.8,
    });
  }
  return urls;
}

/** 특정 청크의 URL 목록 */
export async function getChunkUrls(
  chunk: SitemapChunk,
  base: string
): Promise<SitemapUrl[]> {
  if (chunk.kind === "core") return coreUrls(base);

  const supabase = getSupabaseServer();
  if (!supabase) return [];

  if (chunk.kind === "places") {
    const { data } = await supabase
      .from("places")
      .select("id, updated_at")
      .eq("hidden", false)
      .order("id", { ascending: true })
      .range(chunk.from, chunk.to);
    return (data ?? []).map((r) => ({
      loc: `${base}/places/${r.id}`,
      lastmod: r.updated_at || undefined,
      changefreq: "weekly",
      priority: 0.6,
    }));
  }

  if (chunk.kind === "rescues") {
    const { data } = await supabase
      .from("rescued_animals")
      .select("desertion_no, updated_at")
      .eq("hidden", false)
      .order("desertion_no", { ascending: true })
      .range(chunk.from, chunk.to);
    return (data ?? []).map((r) => ({
      loc: `${base}/rescues/${encodeURIComponent(r.desertion_no)}`,
      lastmod: r.updated_at || undefined,
      changefreq: "daily",
      priority: 0.7,
    }));
  }

  const { data } = await supabase
    .from("pet_travel")
    .select("content_id, updated_at")
    .eq("hidden", false)
    .order("content_id", { ascending: true })
    .range(chunk.from, chunk.to);
  return (data ?? []).map((r) => ({
    loc: `${base}/travel/${encodeURIComponent(r.content_id)}`,
    lastmod: r.updated_at || undefined,
    changefreq: "weekly",
    priority: 0.6,
  }));
}

function xmlEscape(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderUrlset(urls: SitemapUrl[]): string {
  const body = urls
    .map((u) => {
      const parts = [`<loc>${xmlEscape(u.loc)}</loc>`];
      if (u.lastmod) parts.push(`<lastmod>${xmlEscape(u.lastmod)}</lastmod>`);
      if (u.changefreq) parts.push(`<changefreq>${u.changefreq}</changefreq>`);
      if (typeof u.priority === "number")
        parts.push(`<priority>${u.priority}</priority>`);
      return `<url>${parts.join("")}</url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

export function renderSitemapIndex(sitemapUrls: string[], lastmod: string): string {
  const body = sitemapUrls
    .map(
      (loc) =>
        `<sitemap><loc>${xmlEscape(loc)}</loc><lastmod>${lastmod}</lastmod></sitemap>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`;
}
