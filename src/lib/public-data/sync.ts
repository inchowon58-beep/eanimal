import {
  PUBLIC_DATA_ENDPOINTS,
  type PublicDataEndpoint,
} from "@/lib/public-data/endpoints";
import { fetchPublicDataPage } from "@/lib/public-data/client";
import { mapPublicRowToPlace, type PlaceUpsertRow } from "@/lib/public-data/map-row";
import { getSupabaseService } from "@/lib/supabase/server";
import type { PlaceCategory } from "@/lib/site";

export interface SyncOptions {
  categories?: PlaceCategory[];
  /** 카테고리당 최대 페이지 수 (기본 전체). 개발·배치 동기화용 */
  maxPages?: number;
  /** 시작 페이지 (1부터). 타임아웃 대비 이어서 동기화할 때 사용 */
  startPage?: number;
  /** 공공 API는 보통 페이지당 최대 100건 */
  pageSize?: number;
  onProgress?: (msg: string) => void;
}

export interface SyncResult {
  ok: boolean;
  upserted: number;
  skipped: number;
  pages: number;
  byCategory: Record<string, { upserted: number; pages: number; totalCount: number }>;
  errors: string[];
  durationMs: number;
}

export async function syncPlacesFromPublicData(
  options: SyncOptions = {}
): Promise<SyncResult> {
  const started = Date.now();
  const supabase = getSupabaseService();
  if (!supabase) {
    return {
      ok: false,
      upserted: 0,
      skipped: 0,
      pages: 0,
      byCategory: {},
      errors: [
        "Supabase service role이 필요합니다. SUPABASE_SERVICE_ROLE_KEY를 설정하세요.",
      ],
      durationMs: 0,
    };
  }

  const endpoints = PUBLIC_DATA_ENDPOINTS.filter(
    (e) => !options.categories || options.categories.includes(e.category)
  );

  const result: SyncResult = {
    ok: true,
    upserted: 0,
    skipped: 0,
    pages: 0,
    byCategory: {},
    errors: [],
    durationMs: 0,
  };

  for (const endpoint of endpoints) {
    try {
      const catResult = await syncEndpoint(endpoint, supabase, options);
      result.upserted += catResult.upserted;
      result.skipped += catResult.skipped;
      result.pages += catResult.pages;
      result.byCategory[endpoint.category] = {
        upserted: catResult.upserted,
        pages: catResult.pages,
        totalCount: catResult.totalCount,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`[${endpoint.category}] ${msg}`);
      result.ok = false;
      options.onProgress?.(`오류: ${endpoint.category} — ${msg}`);
    }
  }

  result.durationMs = Date.now() - started;
  return result;
}

async function syncEndpoint(
  endpoint: PublicDataEndpoint,
  supabase: NonNullable<ReturnType<typeof getSupabaseService>>,
  options: SyncOptions
) {
  // 공공 API 실측상 page당 ~100건. 过大 pageSize면 조기 종료 버그 유발.
  const pageSize = Math.min(Math.max(options.pageSize ?? 100, 1), 100);
  const startPage = Math.max(options.startPage ?? 1, 1);
  const maxPages = options.maxPages ?? Number.POSITIVE_INFINITY;
  let pageNo = startPage;
  let pagesDone = 0;
  let upserted = 0;
  let skipped = 0;
  let pages = 0;
  let totalCount = 0;
  let fetchedTotal = (startPage - 1) * pageSize;

  while (pagesDone < maxPages) {
    options.onProgress?.(
      `${endpoint.category} page ${pageNo} 요청 중…`
    );
    const page = await fetchPublicDataPage(endpoint, pageNo, pageSize);
    totalCount = page.totalCount || totalCount;
    pages += 1;
    pagesDone += 1;

    if (page.rows.length === 0) break;

    const mapped: PlaceUpsertRow[] = [];
    for (const row of page.rows) {
      const place = mapPublicRowToPlace(
        row,
        endpoint.category,
        endpoint.localIdPrefix
      );
      if (!place) {
        skipped += 1;
        continue;
      }
      mapped.push(place);
    }

    // 같은 페이지에 local_id 중복이 있으면 Postgres upsert가 실패함
    const deduped = Array.from(
      new Map(mapped.map((p) => [p.local_id, p])).values()
    );
    skipped += mapped.length - deduped.length;

    for (let i = 0; i < deduped.length; i += 200) {
      const chunk = deduped.slice(i, i + 200);
      const { error } = await supabase.from("places").upsert(chunk, {
        onConflict: "local_id",
        ignoreDuplicates: false,
      });
      if (error) {
        throw new Error(`Supabase upsert 실패: ${error.message}`);
      }
      upserted += chunk.length;
    }

    fetchedTotal += page.rows.length;
    options.onProgress?.(
      `${endpoint.category} page ${pageNo} 완료 (+${deduped.length}, ${fetchedTotal}/${totalCount || "?"})`
    );

    // API가 pageSize보다 적게 줘도 totalCount가 남으면 다음 페이지 계속
    if (totalCount > 0 && fetchedTotal >= totalCount) break;
    if (totalCount === 0 && page.rows.length < pageSize) break;
    pageNo += 1;
  }

  return { upserted, skipped, pages, totalCount };
}
