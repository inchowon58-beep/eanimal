import { SITE } from "@/lib/site";
import { getSupabaseService } from "@/lib/supabase/server";

const BASE = SITE.url.replace(/\/$/, "");

export interface CollectionJob {
  id: string;
  siteUrl: string;
  pageUrl: string;
  keyword: string | null;
  slug: string | null;
  requestedAt: string;
}

export interface CollectionResult {
  id: string;
  status: "submitted" | "failed";
  error?: string;
}

function toAbsolute(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** 수집 대기열에 URL 1개 등록 (이미 대기/완료면 무시) */
export async function enqueueCollectionJob(input: {
  pageUrl: string;
  keyword?: string | null;
  slug?: string | null;
}): Promise<void> {
  const supabase = getSupabaseService();
  if (!supabase) return;
  await supabase.from("collection_jobs").insert({
    site_url: BASE,
    page_url: toAbsolute(input.pageUrl),
    keyword: input.keyword ?? null,
    slug: input.slug ?? null,
  });
  // 중복(unique) 위반은 그대로 무시한다.
}

/** VM 수집 워커: 대기(pending) URL 목록 (단일 사이트라 siteUrl 필터는 생략) */
export async function getPendingCollectionJobs(limit = 500): Promise<CollectionJob[]> {
  const supabase = getSupabaseService();
  if (!supabase) return [];
  const { data } = await supabase
    .from("collection_jobs")
    .select("id, site_url, page_url, keyword, slug, requested_at")
    .eq("status", "pending")
    .order("requested_at", { ascending: true })
    .limit(limit);
  return (data ?? []).map((r) => ({
    id: r.id as string,
    siteUrl: r.site_url as string,
    pageUrl: r.page_url as string,
    keyword: (r.keyword as string | null) ?? null,
    slug: (r.slug as string | null) ?? null,
    requestedAt: r.requested_at as string,
  }));
}

/** VM 수집 워커: 처리 결과 반영 (submitted / failed) */
export async function reportCollectionResults(
  results: CollectionResult[]
): Promise<number> {
  const supabase = getSupabaseService();
  if (!supabase) return 0;
  let updated = 0;
  for (const r of results) {
    if (!r?.id) continue;
    const patch =
      r.status === "submitted"
        ? { status: "submitted", submitted_at: new Date().toISOString(), error: null }
        : { status: "failed", error: r.error ?? "실패" };
    const { error } = await supabase
      .from("collection_jobs")
      .update(patch)
      .eq("id", r.id);
    if (!error) updated++;
  }
  return updated;
}

/** 대기열 요약(관리자/디버그용) */
export async function countPendingCollectionJobs(): Promise<number> {
  const supabase = getSupabaseService();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("collection_jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}
