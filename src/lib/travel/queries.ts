import { getSupabaseServer } from "@/lib/supabase/server";
import type { PetTravelPlace } from "@/lib/travel/types";
import { SIDO_LIST } from "@/lib/regions";

const PAGE_SIZE = 24;

export async function listTravel(opts: {
  page?: number;
  sido?: string;
  q?: string;
}) {
  const page = Math.max(1, opts.page || 1);
  const supabase = getSupabaseServer();
  if (!supabase) {
    return {
      items: [] as PetTravelPlace[],
      total: 0,
      page,
      pageSize: PAGE_SIZE,
      sidoOptions: [...SIDO_LIST],
    };
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("pet_travel")
    .select("*", { count: "exact" })
    .order("has_image", { ascending: false })
    .order("title", { ascending: true })
    .range(from, to);

  if (opts.sido) query = query.eq("sido", opts.sido);
  if (opts.q?.trim()) {
    query = query.or(
      `title.ilike.%${opts.q.trim()}%,address.ilike.%${opts.q.trim()}%,pet_info.ilike.%${opts.q.trim()}%`
    );
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("[listTravel]", error.message);
    return {
      items: [] as PetTravelPlace[],
      total: 0,
      page,
      pageSize: PAGE_SIZE,
      sidoOptions: [...SIDO_LIST],
    };
  }

  return {
    items: (data ?? []) as PetTravelPlace[],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    sidoOptions: [...SIDO_LIST],
  };
}

export async function getTravelByContentId(
  contentId: string
): Promise<PetTravelPlace | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("pet_travel")
    .select("*")
    .eq("content_id", contentId)
    .maybeSingle();
  if (error) {
    console.error("[getTravel]", error.message);
    return null;
  }
  return data as PetTravelPlace | null;
}
