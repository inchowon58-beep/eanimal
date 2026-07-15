import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import type { SeoJob, SeoPage } from "@/lib/seo-pages/types";

const PAGE_COLS =
  "id, slug, keyword, category, region_name, region_sigungu, title, description, content, faqs, keywords, image_url, hidden, copied_at, created_at, updated_at";
const JOB_COLS =
  "id, keyword, normalized_keyword, category, status, error, page_id, slug, requested_at, started_at, completed_at";

/* ---------- pages ---------- */

export async function listSeoPages(limit = 1000): Promise<SeoPage[]> {
  const supabase = getSupabaseService() || getSupabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("seo_pages")
    .select(PAGE_COLS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as SeoPage[];
}

export async function getSeoPageBySlug(slug: string): Promise<SeoPage | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("seo_pages")
    .select(PAGE_COLS)
    .eq("slug", slug)
    .eq("hidden", false)
    .maybeSingle();
  if (error || !data) return null;
  return data as SeoPage;
}

export async function slugExists(slug: string): Promise<boolean> {
  const supabase = getSupabaseService() || getSupabaseServer();
  if (!supabase) return false;
  const { data } = await supabase
    .from("seo_pages")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return Boolean(data);
}

export async function keywordExists(normalizedKeyword: string): Promise<boolean> {
  const supabase = getSupabaseService() || getSupabaseServer();
  if (!supabase) return false;
  const { data } = await supabase
    .from("seo_pages")
    .select("id")
    .eq("keyword", normalizedKeyword)
    .maybeSingle();
  return Boolean(data);
}

export async function insertSeoPage(
  page: Omit<SeoPage, "id" | "created_at" | "updated_at" | "hidden" | "copied_at">
): Promise<{ id: string | null; error: string | null }> {
  const supabase = getSupabaseService();
  if (!supabase) return { id: null, error: "service role 키가 필요합니다." };
  const { data, error } = await supabase
    .from("seo_pages")
    .insert(page)
    .select("id")
    .maybeSingle();
  return { id: (data?.id as string) ?? null, error: error?.message ?? null };
}

export async function deleteSeoPage(id: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseService();
  if (!supabase) return { error: "service role 키가 필요합니다." };
  const { error } = await supabase.from("seo_pages").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function countSeoPages(): Promise<number> {
  const supabase = getSupabaseServer();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("seo_pages")
    .select("id", { count: "exact", head: true })
    .eq("hidden", false);
  return count ?? 0;
}

/* ---------- 주소 일괄 복사 ---------- */

/** 아직 복사하지 않은 페이지를 오래된 순으로 최대 limit개 */
export async function getUncopiedBatch(
  limit = 50
): Promise<{ id: string; slug: string }[]> {
  const supabase = getSupabaseService() || getSupabaseServer();
  if (!supabase) return [];
  const { data } = await supabase
    .from("seo_pages")
    .select("id, slug")
    .eq("hidden", false)
    .is("copied_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);
  return (data ?? []) as { id: string; slug: string }[];
}

export async function markCopied(ids: string[]): Promise<{ error: string | null }> {
  const supabase = getSupabaseService();
  if (!supabase) return { error: "service role 키가 필요합니다." };
  if (ids.length === 0) return { error: null };
  const { error } = await supabase
    .from("seo_pages")
    .update({ copied_at: new Date().toISOString() })
    .in("id", ids);
  return { error: error?.message ?? null };
}

export async function resetCopied(): Promise<{ error: string | null }> {
  const supabase = getSupabaseService();
  if (!supabase) return { error: "service role 키가 필요합니다." };
  const { error } = await supabase
    .from("seo_pages")
    .update({ copied_at: null })
    .not("copied_at", "is", null);
  return { error: error?.message ?? null };
}

export async function getCopyStats(): Promise<{ total: number; copied: number }> {
  const supabase = getSupabaseService() || getSupabaseServer();
  if (!supabase) return { total: 0, copied: 0 };
  const [{ count: total }, { count: copied }] = await Promise.all([
    supabase
      .from("seo_pages")
      .select("id", { count: "exact", head: true })
      .eq("hidden", false),
    supabase
      .from("seo_pages")
      .select("id", { count: "exact", head: true })
      .eq("hidden", false)
      .not("copied_at", "is", null),
  ]);
  return { total: total ?? 0, copied: copied ?? 0 };
}

export async function listSeoPageSlugs(from: number, to: number) {
  const supabase = getSupabaseServer();
  if (!supabase) return [];
  const { data } = await supabase
    .from("seo_pages")
    .select("slug, updated_at")
    .eq("hidden", false)
    .order("slug", { ascending: true })
    .range(from, to);
  return (data ?? []) as { slug: string; updated_at: string }[];
}

/* ---------- jobs ---------- */

export async function listSeoJobs(
  limit = 500,
  category?: string | null
): Promise<SeoJob[]> {
  const supabase = getSupabaseService() || getSupabaseServer();
  if (!supabase) return [];
  let query = supabase
    .from("seo_jobs")
    .select(JOB_COLS)
    .order("requested_at", { ascending: false })
    .limit(limit);
  if (category !== undefined) {
    query = category === null ? query.is("category", null) : query.eq("category", category);
  }
  const { data, error } = await query;
  if (error || !data) return [];
  return data as SeoJob[];
}

export async function enqueueJobs(
  items: { keyword: string; normalized: string }[],
  category?: string | null
): Promise<{ added: number; skipped: number }> {
  const supabase = getSupabaseService();
  if (!supabase) return { added: 0, skipped: items.length };

  let added = 0;
  let skipped = 0;
  for (const item of items) {
    const { error } = await supabase.from("seo_jobs").insert({
      keyword: item.keyword,
      normalized_keyword: item.normalized,
      category: category ?? null,
      status: "pending",
    });
    if (error) skipped += 1;
    else added += 1;
  }
  return { added, skipped };
}

/** 대기(pending) 잡 교체: 해당 카테고리의 기존 pending 삭제 후 새로 등록 */
export async function replacePendingJobs(
  items: { keyword: string; normalized: string }[],
  category?: string | null
): Promise<{ added: number; skipped: number }> {
  const supabase = getSupabaseService();
  if (!supabase) return { added: 0, skipped: items.length };
  let del = supabase.from("seo_jobs").delete().eq("status", "pending");
  if (category !== undefined) {
    del = category === null ? del.is("category", null) : del.eq("category", category);
  }
  await del;
  return enqueueJobs(items, category);
}

export async function claimNextPendingJob(): Promise<SeoJob | null> {
  const supabase = getSupabaseService();
  if (!supabase) return null;
  const { data } = await supabase
    .from("seo_jobs")
    .select(JOB_COLS)
    .eq("status", "pending")
    .order("requested_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) return null;

  const job = data as SeoJob;
  const { data: updated } = await supabase
    .from("seo_jobs")
    .update({ status: "processing", started_at: new Date().toISOString() })
    .eq("id", job.id)
    .eq("status", "pending")
    .select(JOB_COLS)
    .maybeSingle();

  return (updated as SeoJob) ?? null;
}

export async function finishJob(
  id: string,
  result:
    | { status: "completed"; pageId: string; slug: string }
    | { status: "failed"; error: string }
): Promise<void> {
  const supabase = getSupabaseService();
  if (!supabase) return;
  const row: Record<string, unknown> = {
    status: result.status,
    completed_at: new Date().toISOString(),
  };
  if (result.status === "completed") {
    row.page_id = result.pageId;
    row.slug = result.slug;
    row.error = null;
  } else {
    row.error = result.error.slice(0, 500);
  }
  await supabase.from("seo_jobs").update(row).eq("id", id);
}

export async function countPendingJobs(): Promise<number> {
  const supabase = getSupabaseService() || getSupabaseServer();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("seo_jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}
