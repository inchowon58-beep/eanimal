import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import type { BaseSeoInsert, BaseSeoPage } from "./types";

const COLS =
  "id, slug, keyword, category, region_label, title, h1, description, meta_keywords, hero_kicker, hero_subtitle, sections, faqs, cta_text, image_url, publish_source, hidden, created_at, updated_at";

export async function getBaseSeoBySlug(slug: string): Promise<BaseSeoPage | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("base_seo_pages")
    .select(COLS)
    .eq("slug", slug)
    .eq("hidden", false)
    .maybeSingle();
  if (error || !data) return null;
  return data as BaseSeoPage;
}

export async function listBaseSeoPages(limit = 500): Promise<BaseSeoPage[]> {
  const supabase = getSupabaseService() || getSupabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("base_seo_pages")
    .select(COLS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as BaseSeoPage[];
}

export async function listBaseSeoSlugs(limit = 2000): Promise<string[]> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];
  const { data } = await supabase
    .from("base_seo_pages")
    .select("slug")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => r.slug as string);
}

export async function insertBaseSeoPage(
  page: BaseSeoInsert
): Promise<{ id: string | null; error: string | null }> {
  const supabase = getSupabaseService();
  if (!supabase) return { id: null, error: "service role 키가 필요합니다." };
  const { data, error } = await supabase
    .from("base_seo_pages")
    .insert({ ...page, hidden: page.hidden ?? false })
    .select("id")
    .maybeSingle();
  return { id: (data?.id as string) ?? null, error: error?.message ?? null };
}

export async function deleteBaseSeoPage(
  id: string
): Promise<{ error: string | null; slug: string | null }> {
  const supabase = getSupabaseService();
  if (!supabase) return { error: "service role 키가 필요합니다.", slug: null };
  const { data: row } = await supabase
    .from("base_seo_pages")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("base_seo_pages").delete().eq("id", id);
  return { error: error?.message ?? null, slug: (row?.slug as string) ?? null };
}
