import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { listDistinctSido, regionPath, SIDO_LIST } from "@/lib/regions";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSitemapPlan, type SitemapChunk } from "@/lib/seo/sitemap-plan";

export const revalidate = 3600;

export async function generateSitemaps() {
  const plan = await getSitemapPlan();
  return plan.map((_, id) => ({ id }));
}

function baseUrl(): string {
  return SITE.url.replace(/\/$/, "");
}

async function coreEntries(base: string): Promise<MetadataRoute.Sitemap> {
  const sidos = await listDistinctSido();
  const sidoList = sidos.length ? sidos : [...SIDO_LIST];

  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/places`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/rescues`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/travel`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/regions`, changeFrequency: "daily", priority: 0.9 },
  ];

  for (const sido of sidoList) {
    entries.push({
      url: `${base}${regionPath(sido)}`,
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  return entries;
}

async function dataEntries(
  chunk: Extract<SitemapChunk, { kind: "places" | "rescues" | "travel" }>,
  base: string
): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];

  if (chunk.kind === "places") {
    const { data } = await supabase
      .from("places")
      .select("id, updated_at")
      .order("id", { ascending: true })
      .range(chunk.from, chunk.to);
    return (data ?? []).map((r) => ({
      url: `${base}/places/${r.id}`,
      lastModified: r.updated_at || undefined,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  }

  if (chunk.kind === "rescues") {
    const { data } = await supabase
      .from("rescued_animals")
      .select("desertion_no, updated_at")
      .order("desertion_no", { ascending: true })
      .range(chunk.from, chunk.to);
    return (data ?? []).map((r) => ({
      url: `${base}/rescues/${encodeURIComponent(r.desertion_no)}`,
      lastModified: r.updated_at || undefined,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  }

  const { data } = await supabase
    .from("pet_travel")
    .select("content_id, updated_at")
    .order("content_id", { ascending: true })
    .range(chunk.from, chunk.to);
  return (data ?? []).map((r) => ({
    url: `${base}/travel/${encodeURIComponent(r.content_id)}`,
    lastModified: r.updated_at || undefined,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
}

export default async function sitemap(props: {
  id: Promise<number>;
}): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const id = Number(await props.id) || 0;
  const plan = await getSitemapPlan();
  const chunk = plan[id];

  if (!chunk || chunk.kind === "core") {
    return coreEntries(base);
  }
  return dataEntries(chunk, base);
}
