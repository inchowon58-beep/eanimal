import { getSupabaseServer } from "@/lib/supabase/server";
import { PLACE_CATEGORIES, type PlaceCategory } from "@/lib/site";
import type { Place, PlacesFilter, PlacesListResult } from "@/lib/places/types";
import { SIDO_LIST } from "@/lib/regions";

const DEFAULT_PAGE_SIZE = 24;

function emptyResult(page: number, pageSize: number): PlacesListResult {
  return {
    items: [],
    total: 0,
    page,
    pageSize,
    sidoOptions: [...SIDO_LIST],
    sigunguOptions: [],
  };
}

export function parsePlacesFilter(
  searchParams: Record<string, string | string[] | undefined>
): PlacesFilter {
  const pick = (key: string) => {
    const v = searchParams[key];
    return typeof v === "string" ? v : undefined;
  };

  const categoryRaw = pick("category") ?? "";
  const category = PLACE_CATEGORIES.includes(categoryRaw as PlaceCategory)
    ? (categoryRaw as PlaceCategory)
    : "";

  const page = Math.max(1, Number(pick("page") || 1) || 1);

  return {
    sido: pick("sido") || undefined,
    sigungu: pick("sigungu") || undefined,
    category,
    q: pick("q") || undefined,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

export async function listPlaces(
  filter: PlacesFilter
): Promise<PlacesListResult> {
  const page = filter.page ?? 1;
  const pageSize = filter.pageSize ?? DEFAULT_PAGE_SIZE;
  const supabase = getSupabaseServer();

  if (!supabase) return emptyResult(page, pageSize);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("places")
    .select(
      "id, local_id, category, title, status, address_road, address_jibun, phone, sido, sigungu, updated_at",
      { count: "exact" }
    )
    .order("title", { ascending: true })
    .range(from, to);

  if (filter.sido) query = query.eq("sido", filter.sido);
  if (filter.sigungu) query = query.eq("sigungu", filter.sigungu);
  if (filter.category) query = query.eq("category", filter.category);
  if (filter.q?.trim()) {
    query = query.ilike("title", `%${filter.q.trim()}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[listPlaces]", error.message);
    return emptyResult(page, pageSize);
  }

  const sigunguOptions = filter.sido
    ? await fetchDistinctSigungu(filter.sido)
    : [];

  return {
    items: (data ?? []) as Place[],
    total: count ?? 0,
    page,
    pageSize,
    // 항상 전국 시·도 목록 고정 노출 (DB 일부 null이어도 필터 가능)
    sidoOptions: [...SIDO_LIST],
    sigunguOptions,
  };
}

async function fetchDistinctSigungu(sido: string): Promise<string[]> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];

  const set = new Set<string>();
  const pageSize = 1000;
  let from = 0;

  for (let i = 0; i < 50; i++) {
    const { data, error } = await supabase
      .from("places")
      .select("sigungu")
      .eq("sido", sido)
      .not("sigungu", "is", null)
      .range(from, from + pageSize - 1);

    if (error || !data?.length) break;
    for (const row of data as { sigungu: string | null }[]) {
      if (row.sigungu) set.add(row.sigungu);
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return Array.from(set).sort((a, b) => a.localeCompare(b, "ko"));
}

export async function getPlaceById(id: string): Promise<Place | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("places")
    .select(
      "id, local_id, category, title, status, address_road, address_jibun, phone, sido, sigungu, updated_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getPlaceById]", error.message);
    return null;
  }

  return data as Place | null;
}
