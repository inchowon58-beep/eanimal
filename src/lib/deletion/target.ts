import { getSupabaseService, getSupabaseServer } from "@/lib/supabase/server";

export type TargetKind = "place" | "rescue" | "travel";

export interface DeletionTarget {
  kind: TargetKind;
  table: string;
  column: string;
  value: string;
}

const SECTION_MAP: Record<string, Omit<DeletionTarget, "value">> = {
  places: { kind: "place", table: "places", column: "id" },
  rescues: { kind: "rescue", table: "rescued_animals", column: "desertion_no" },
  travel: { kind: "travel", table: "pet_travel", column: "content_id" },
};

/**
 * 삭제요청 target_url 에서 삭제 대상 페이지를 식별.
 * 지원 경로: /places/{id}, /rescues/{desertionNo}, /travel/{contentId}
 * 전체 URL, 도메인 포함, 경로만 입력 모두 허용.
 */
export function parseTargetUrl(input: string): DeletionTarget | null {
  const trimmed = (input || "").trim();
  if (!trimmed) return null;

  let pathname = trimmed;
  if (trimmed.startsWith("/")) {
    pathname = trimmed;
  } else {
    try {
      pathname = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`)
        .pathname;
    } catch {
      pathname = trimmed;
    }
  }

  const segs = pathname
    .split("?")[0]
    .split("#")[0]
    .split("/")
    .filter(Boolean);

  const idx = segs.findIndex((s) => s in SECTION_MAP);
  if (idx === -1 || idx + 1 >= segs.length) return null;

  const base = SECTION_MAP[segs[idx]];
  let value = segs[idx + 1];
  try {
    value = decodeURIComponent(value);
  } catch {
    /* keep raw */
  }
  if (!value) return null;

  return { ...base, value };
}

/** 대상 페이지를 숨김(soft delete) 또는 복원. matched = 실제 반영된 행 수 */
export async function setTargetHidden(
  target: DeletionTarget,
  hidden: boolean
): Promise<{ matched: number | null; error: string | null }> {
  const supabase = getSupabaseService() || getSupabaseServer();
  if (!supabase) return { matched: null, error: "DB 연결이 설정되지 않았습니다." };

  const { error, count } = await supabase
    .from(target.table)
    .update({ hidden }, { count: "exact" })
    .eq(target.column, target.value);

  return { matched: count ?? null, error: error?.message ?? null };
}
