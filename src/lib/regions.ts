import { getSupabaseServer } from "@/lib/supabase/server";
import {
  deslugifyRegion,
  normalizeSido,
  slugifyRegion,
  SIDO_ALIASES,
} from "@/lib/public-data/normalize";

/** SEO용 시·도 시드 (DB 비어 있을 때도 목록 노출) */
export const SIDO_LIST = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
] as const;

export function resolveSidoParam(param: string): string {
  const decoded = deslugifyRegion(param);
  return normalizeSido(decoded) || decoded;
}

export function resolveSigunguParam(param: string): string {
  return deslugifyRegion(param);
}

export function regionPath(sido: string, sigungu?: string): string {
  const base = `/regions/${slugifyRegion(sido)}`;
  return sigungu ? `${base}/${slugifyRegion(sigungu)}` : base;
}

export async function listSigunguForSido(sido: string): Promise<string[]> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("places")
    .select("sigungu")
    .eq("sido", sido)
    .eq("hidden", false)
    .not("sigungu", "is", null)
    .limit(5000);

  if (error || !data) return [];
  const set = new Set<string>();
  for (const row of data as { sigungu: string | null }[]) {
    if (row.sigungu) set.add(row.sigungu);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ko"));
}

export async function listDistinctSido(): Promise<string[]> {
  const supabase = getSupabaseServer();
  if (!supabase) return [...SIDO_LIST];

  const { data, error } = await supabase
    .from("places")
    .select("sido")
    .eq("hidden", false)
    .not("sido", "is", null)
    .limit(5000);

  if (error || !data) return [...SIDO_LIST];
  const set = new Set<string>(SIDO_LIST);
  for (const row of data as { sido: string | null }[]) {
    if (row.sido) set.add(row.sido);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ko"));
}

export { slugifyRegion, deslugifyRegion, SIDO_ALIASES };
