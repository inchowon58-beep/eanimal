import {
  PUBLIC_DATA_ENDPOINTS,
  type PublicDataEndpoint,
} from "@/lib/public-data/endpoints";
import { fetchPublicDataPage } from "@/lib/public-data/client";
import { mapPublicRowToPlace, type PlaceUpsertRow } from "@/lib/public-data/map-row";
import { getSupabaseService } from "@/lib/supabase/server";
import type { PlaceCategory } from "@/lib/site";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface SyncOptions {
  categories?: PlaceCategory[];
  maxPages?: number;
  startPage?: number;
  pageSize?: number;
  /** 주간 동기화: 체크포인트 이어받기 + 변경분만 반영 + 종료 시 삭제 */
  weekly?: boolean;
  /** 요청 시작 시각 (타임아웃 대비) */
  deadlineMs?: number;
  onProgress?: (msg: string) => void;
}

export interface SyncResult {
  ok: boolean;
  upserted: number;
  inserted: number;
  updated: number;
  unchanged: number;
  deleted: number;
  skipped: number;
  pages: number;
  byCategory: Record<
    string,
    {
      upserted: number;
      inserted: number;
      updated: number;
      unchanged: number;
      deleted: number;
      pages: number;
      totalCount: number;
      nextPage?: number;
      done?: boolean;
    }
  >;
  errors: string[];
  durationMs: number;
  continueNeeded: boolean;
}

const BUDGET_MS = 250_000;

export async function syncPlacesFromPublicData(
  options: SyncOptions = {}
): Promise<SyncResult> {
  const started = Date.now();
  const deadline = options.deadlineMs ?? started + BUDGET_MS;
  const supabase = getSupabaseService();
  if (!supabase) {
    return {
      ok: false,
      upserted: 0,
      inserted: 0,
      updated: 0,
      unchanged: 0,
      deleted: 0,
      skipped: 0,
      pages: 0,
      byCategory: {},
      errors: [
        "Supabase service role이 필요합니다. SUPABASE_SERVICE_ROLE_KEY를 설정하세요.",
      ],
      durationMs: 0,
      continueNeeded: false,
    };
  }

  const endpoints = PUBLIC_DATA_ENDPOINTS.filter(
    (e) => !options.categories || options.categories.includes(e.category)
  );

  const result: SyncResult = {
    ok: true,
    upserted: 0,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    deleted: 0,
    skipped: 0,
    pages: 0,
    byCategory: {},
    errors: [],
    durationMs: 0,
    continueNeeded: false,
  };

  for (const endpoint of endpoints) {
    if (Date.now() > deadline - 15_000) {
      result.continueNeeded = true;
      break;
    }
    try {
      const catResult = await syncEndpoint(endpoint, supabase, {
        ...options,
        deadlineMs: deadline,
      });
      result.upserted += catResult.upserted;
      result.inserted += catResult.inserted;
      result.updated += catResult.updated;
      result.unchanged += catResult.unchanged;
      result.deleted += catResult.deleted;
      result.skipped += catResult.skipped;
      result.pages += catResult.pages;
      result.byCategory[endpoint.category] = catResult;
      if (!catResult.done) result.continueNeeded = true;
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
  supabase: SupabaseClient,
  options: SyncOptions
) {
  const pageSize = Math.min(Math.max(options.pageSize ?? 100, 1), 100);
  const deadline = options.deadlineMs ?? Date.now() + BUDGET_MS;
  const weekly = Boolean(options.weekly);

  let startPage = Math.max(options.startPage ?? 1, 1);
  if (weekly && options.startPage == null) {
    startPage = await loadCheckpoint(supabase, endpoint.category);
  }

  const maxPages = options.maxPages ?? Number.POSITIVE_INFINITY;
  let pageNo = startPage;
  let pagesDone = 0;
  let upserted = 0;
  let inserted = 0;
  let updated = 0;
  let unchanged = 0;
  let deleted = 0;
  let skipped = 0;
  let pages = 0;
  let totalCount = 0;
  let fetchedTotal = (startPage - 1) * pageSize;
  let done = false;

  while (pagesDone < maxPages) {
    if (Date.now() > deadline - 12_000) {
      if (weekly) await saveCheckpoint(supabase, endpoint.category, pageNo);
      break;
    }

    options.onProgress?.(`${endpoint.category} page ${pageNo}…`);
    const page = await fetchPublicDataPage(endpoint, pageNo, pageSize);
    totalCount = page.totalCount || totalCount;
    pages += 1;
    pagesDone += 1;

    if (page.rows.length === 0) {
      done = true;
      break;
    }

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

    const deduped = Array.from(
      new Map(mapped.map((p) => [p.local_id, p])).values()
    );
    skipped += mapped.length - deduped.length;

    if (weekly && deduped.length) {
      await recordSeenIds(
        supabase,
        endpoint.category,
        deduped.map((p) => p.local_id)
      );
    }

    const apply = await applyIncremental(supabase, deduped);
    inserted += apply.inserted;
    updated += apply.updated;
    unchanged += apply.unchanged;
    upserted += apply.inserted + apply.updated;

    fetchedTotal += page.rows.length;

    if (totalCount > 0 && fetchedTotal >= totalCount) {
      done = true;
      break;
    }
    if (totalCount === 0 && page.rows.length < pageSize) {
      done = true;
      break;
    }
    pageNo += 1;
  }

  if (done) {
    if (weekly) {
      deleted = await pruneMissing(supabase, endpoint.category);
      await clearSeenIds(supabase, endpoint.category);
      await saveCheckpoint(supabase, endpoint.category, 1);
    }
  } else if (weekly) {
    await saveCheckpoint(supabase, endpoint.category, pageNo);
  }

  return {
    upserted,
    inserted,
    updated,
    unchanged,
    deleted,
    skipped,
    pages,
    totalCount,
    nextPage: done ? 1 : pageNo,
    done,
  };
}

async function applyIncremental(
  supabase: SupabaseClient,
  rows: PlaceUpsertRow[]
) {
  let inserted = 0;
  let updated = 0;
  let unchanged = 0;
  if (!rows.length) return { inserted, updated, unchanged };

  const ids = rows.map((r) => r.local_id);
  const { data: existing, error } = await supabase
    .from("places")
    .select(
      "local_id, category, title, status, address_road, address_jibun, phone, sido, sigungu, is_inactive"
    )
    .in("local_id", ids);

  if (error) throw new Error(`기존 데이터 조회 실패: ${error.message}`);

  const map = new Map(
    (existing ?? []).map((r) => [r.local_id as string, r as PlaceUpsertRow])
  );

  const toInsert: PlaceUpsertRow[] = [];
  const toUpdate: PlaceUpsertRow[] = [];

  for (const row of rows) {
    const prev = map.get(row.local_id);
    if (!prev) {
      toInsert.push(row);
      continue;
    }
    if (isSamePlace(prev, row)) {
      unchanged += 1;
      continue;
    }
    toUpdate.push(row);
  }

  for (const chunk of chunkArray([...toInsert, ...toUpdate], 200)) {
    const { error: upErr } = await supabase.from("places").upsert(chunk, {
      onConflict: "local_id",
    });
    if (upErr) throw new Error(`Supabase upsert 실패: ${upErr.message}`);
  }

  inserted = toInsert.length;
  updated = toUpdate.length;
  return { inserted, updated, unchanged };
}

function isSamePlace(
  a: Partial<PlaceUpsertRow>,
  b: PlaceUpsertRow
): boolean {
  return (
    a.category === b.category &&
    a.title === b.title &&
    a.status === b.status &&
    Boolean(a.is_inactive) === Boolean(b.is_inactive) &&
    (a.address_road || null) === (b.address_road || null) &&
    (a.address_jibun || null) === (b.address_jibun || null) &&
    (a.phone || null) === (b.phone || null) &&
    (a.sido || null) === (b.sido || null) &&
    (a.sigungu || null) === (b.sigungu || null)
  );
}

async function loadCheckpoint(
  supabase: SupabaseClient,
  category: string
): Promise<number> {
  const { data } = await supabase
    .from("sync_checkpoints")
    .select("next_page")
    .eq("category", category)
    .maybeSingle();
  return Math.max(1, Number(data?.next_page) || 1);
}

async function saveCheckpoint(
  supabase: SupabaseClient,
  category: string,
  nextPage: number
) {
  await supabase.from("sync_checkpoints").upsert({
    category,
    next_page: nextPage,
    updated_at: new Date().toISOString(),
  });
}

async function recordSeenIds(
  supabase: SupabaseClient,
  category: string,
  localIds: string[]
) {
  const rows = localIds.map((local_id) => ({ category, local_id }));
  for (const chunk of chunkArray(rows, 500)) {
    const { error } = await supabase
      .from("sync_seen_ids")
      .upsert(chunk, { onConflict: "category,local_id" });
    if (error) throw new Error(`seen_ids 저장 실패: ${error.message}`);
  }
}

async function clearSeenIds(supabase: SupabaseClient, category: string) {
  await supabase.from("sync_seen_ids").delete().eq("category", category);
}

async function pruneMissing(
  supabase: SupabaseClient,
  category: string
): Promise<number> {
  const seen = new Set<string>();
  let from = 0;
  const size = 1000;
  for (;;) {
    const { data, error } = await supabase
      .from("sync_seen_ids")
      .select("local_id")
      .eq("category", category)
      .range(from, from + size - 1);
    if (error) throw new Error(`seen_ids 조회 실패: ${error.message}`);
    if (!data?.length) break;
    for (const row of data) seen.add(row.local_id as string);
    if (data.length < size) break;
    from += size;
  }

  if (seen.size === 0) return 0;

  const orphanIds: string[] = [];
  from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("places")
      .select("id, local_id")
      .eq("category", category)
      .range(from, from + size - 1);
    if (error) throw new Error(`삭제 대상 조회 실패: ${error.message}`);
    if (!data?.length) break;
    for (const row of data) {
      if (!seen.has(row.local_id as string)) orphanIds.push(row.id as string);
    }
    if (data.length < size) break;
    from += size;
  }

  let deleted = 0;
  for (const chunk of chunkArray(orphanIds, 200)) {
    const { error: delErr } = await supabase.from("places").delete().in("id", chunk);
    if (delErr) throw new Error(`삭제 실패: ${delErr.message}`);
    deleted += chunk.length;
  }
  return deleted;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
