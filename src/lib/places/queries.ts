import { getSupabaseServer } from "@/lib/supabase/server";
import { PLACE_CATEGORIES, type PlaceCategory } from "@/lib/site";
import type { Place, PlacesFilter, PlacesListResult } from "@/lib/places/types";

const DEFAULT_PAGE_SIZE = 24;

function emptyResult(page: number, pageSize: number): PlacesListResult {
  return {
    items: [],
    total: 0,
    page,
    pageSize,
    sidoOptions: [],
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

  const [sidoOptions, sigunguOptions] = await Promise.all([
    fetchDistinct("sido"),
    fetchDistinct("sigungu", filter.sido),
  ]);

  return {
    items: (data ?? []) as Place[],
    total: count ?? 0,
    page,
    pageSize,
    sidoOptions,
    sigunguOptions,
  };
}

async function fetchDistinct(
  column: "sido" | "sigungu",
  sido?: string
): Promise<string[]> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];

  let query = supabase
    .from("places")
    .select(column)
    .not(column, "is", null)
    .limit(5000);

  if (column === "sigungu" && sido) {
    query = query.eq("sido", sido);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const set = new Set<string>();
  for (const row of data as unknown as Record<string, string | null>[]) {
    const v = row[column];
    if (v) set.add(v);
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
