import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import type { Banner, BannerInput } from "@/lib/banners/types";

const SELECT =
  "id, title, description, image_url, link_url, phone, placements, enabled, start_at, end_at, sort_order, created_at, updated_at";

function withinWindow(b: Banner, now: number): boolean {
  if (b.start_at && new Date(b.start_at).getTime() > now) return false;
  if (b.end_at && new Date(b.end_at).getTime() < now) return false;
  return true;
}

/** 공개 페이지용 — 특정 노출영역에서 지금 노출 가능한 배너 */
export async function getActiveBanners(placement: string): Promise<Banner[]> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("banners")
    .select(SELECT)
    .eq("enabled", true)
    .contains("placements", [placement])
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const now = Date.now();
  return (data as Banner[]).filter((b) => withinWindow(b, now));
}

/** 관리자용 — 전체 배너 */
export async function listAllBanners(): Promise<Banner[]> {
  const supabase = getSupabaseService() || getSupabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("banners")
    .select(SELECT)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Banner[];
}

function sanitizeInput(input: BannerInput) {
  const clean = (v: unknown) => {
    if (typeof v !== "string") return null;
    const t = v.trim();
    return t.length ? t : null;
  };
  const row: Record<string, unknown> = {};
  if (input.title !== undefined) row.title = clean(input.title);
  if (input.description !== undefined) row.description = clean(input.description);
  if (input.image_url !== undefined) row.image_url = clean(input.image_url);
  if (input.link_url !== undefined) row.link_url = clean(input.link_url);
  if (input.phone !== undefined) row.phone = clean(input.phone);
  if (input.placements !== undefined)
    row.placements = Array.isArray(input.placements)
      ? input.placements.filter((p) => typeof p === "string" && p.length)
      : [];
  if (input.enabled !== undefined) row.enabled = Boolean(input.enabled);
  if (input.start_at !== undefined) row.start_at = input.start_at || null;
  if (input.end_at !== undefined) row.end_at = input.end_at || null;
  if (input.sort_order !== undefined)
    row.sort_order = Number.isFinite(input.sort_order) ? input.sort_order : 0;
  return row;
}

export async function createBanner(input: BannerInput): Promise<{ error: string | null }> {
  const supabase = getSupabaseService();
  if (!supabase) return { error: "service role 키가 필요합니다." };
  const { error } = await supabase.from("banners").insert(sanitizeInput(input));
  return { error: error?.message ?? null };
}

export async function updateBanner(
  id: string,
  input: BannerInput
): Promise<{ error: string | null }> {
  const supabase = getSupabaseService();
  if (!supabase) return { error: "service role 키가 필요합니다." };
  const row = sanitizeInput(input);
  row.updated_at = new Date().toISOString();
  const { error } = await supabase.from("banners").update(row).eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteBanner(id: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseService();
  if (!supabase) return { error: "service role 키가 필요합니다." };
  const { error } = await supabase.from("banners").delete().eq("id", id);
  return { error: error?.message ?? null };
}
