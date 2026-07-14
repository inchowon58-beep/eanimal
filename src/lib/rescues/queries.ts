import { getSupabaseServer } from "@/lib/supabase/server";
import type { RescuedAnimal } from "@/lib/rescues/types";
import { SIDO_LIST } from "@/lib/regions";

const PAGE_SIZE = 24;

export async function listRescues(opts: {
  page?: number;
  sido?: string;
  q?: string;
}) {
  const page = Math.max(1, opts.page || 1);
  const supabase = getSupabaseServer();
  if (!supabase) {
    return {
      items: [] as RescuedAnimal[],
      total: 0,
      page,
      pageSize: PAGE_SIZE,
      sidoOptions: [...SIDO_LIST],
    };
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("rescued_animals")
    .select("*", { count: "exact" })
    .order("happen_dt", { ascending: false })
    .range(from, to);

  if (opts.sido) query = query.eq("sido", opts.sido);
  if (opts.q?.trim()) {
    query = query.or(
      `kind_cd.ilike.%${opts.q.trim()}%,happen_place.ilike.%${opts.q.trim()}%,care_nm.ilike.%${opts.q.trim()}%`
    );
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("[listRescues]", error.message);
    return {
      items: [] as RescuedAnimal[],
      total: 0,
      page,
      pageSize: PAGE_SIZE,
      sidoOptions: [...SIDO_LIST],
    };
  }

  return {
    items: (data ?? []) as RescuedAnimal[],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    sidoOptions: [...SIDO_LIST],
  };
}

export async function getRescueByDesertionNo(
  desertionNo: string
): Promise<RescuedAnimal | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("rescued_animals")
    .select("*")
    .eq("desertion_no", desertionNo)
    .maybeSingle();
  if (error) {
    console.error("[getRescue]", error.message);
    return null;
  }
  return data as RescuedAnimal | null;
}
