import {
  extractItemRows,
  fetchDataGoKrJson,
  getEncodedServiceKey,
  pickStr,
} from "@/lib/public-data/fetch-json";
import { getSupabaseService } from "@/lib/supabase/server";
import { normalizeSido, parseRegionFromAddress } from "@/lib/public-data/normalize";

/** v2 우선, 실패 시 구버전 경로도 시도 */
const API_CANDIDATES = [
  "https://apis.data.go.kr/1543061/abandonmentPublicService_v2/abandonmentPublic_v2",
  "https://apis.data.go.kr/1543061/abandonmentPublicSrvc/abandonmentPublic",
];

function yyyymmdd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export interface RescueSyncResult {
  ok: boolean;
  upserted: number;
  pages: number;
  totalCount: number;
  errors: string[];
  durationMs: number;
  withImage?: number;
  sampleKeys?: string[];
  sampleImage?: string | null;
  activeApi?: string;
}

function pickImageUrl(row: Record<string, unknown>): string | null {
  const raw = pickStr(row, [
    "popfile1",
    "popfile2",
    "popfile",
    "popFile",
    "filename",
    "fileName",
    "PHOTO_URL",
    "photoUrl",
    "imageUrl",
    "imgUrl",
    "img",
  ]);
  if (!raw) return null;
  let url = raw;
  if (url.startsWith("//")) url = `https:${url}`;
  else if (url.startsWith("/")) url = `https://www.animal.go.kr${url}`;
  else if (!/^https?:\/\//i.test(url) && url.includes("files/shelter")) {
    url = `https://www.animal.go.kr/${url.replace(/^\/+/, "")}`;
  }
  // openapi / www animal.go.kr 은 https 로 통일
  url = url.replace(/^http:\/\/(www\.)?animal\.go\.kr/i, "https://www.animal.go.kr");
  url = url.replace(/^http:\/\/openapi\.animal\.go\.kr/i, "https://openapi.animal.go.kr");
  return url;
}

export async function syncRescuedAnimals(opts?: {
  days?: number;
  maxPages?: number;
  startPage?: number;
}): Promise<RescueSyncResult> {
  const started = Date.now();
  const supabase = getSupabaseService();
  if (!supabase) {
    return {
      ok: false,
      upserted: 0,
      pages: 0,
      totalCount: 0,
      errors: ["SUPABASE_SERVICE_ROLE_KEY 필요"],
      durationMs: 0,
    };
  }

  const days = opts?.days ?? 14;
  const maxPages = opts?.maxPages ?? Number.POSITIVE_INFINITY;
  const startPage = Math.max(1, opts?.startPage ?? 1);
  const endPage = Number.isFinite(maxPages)
    ? startPage + maxPages - 1
    : Number.POSITIVE_INFINITY;
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  const serviceKey = getEncodedServiceKey();

  let pageNo = startPage;
  let upserted = 0;
  let withImage = 0;
  let pages = 0;
  let totalCount = 0;
  const errors: string[] = [];
  let sampleKeys: string[] | undefined;
  let sampleImage: string | null | undefined;
  let activeApi = API_CANDIDATES[0];

  // 가용 엔드포인트 탐침
  for (const api of API_CANDIDATES) {
    try {
      const qs = [
        `serviceKey=${serviceKey}`,
        `bgnde=${yyyymmdd(start)}`,
        `endde=${yyyymmdd(end)}`,
        `pageNo=1`,
        `numOfRows=1`,
        `_type=json`,
      ].join("&");
      const json = await fetchDataGoKrJson(`${api}?${qs}`);
      const { rows, totalCount: tc } = extractItemRows(json);
      if (rows.length || tc > 0) {
        activeApi = api;
        if (rows[0]) {
          sampleKeys = Object.keys(rows[0]).slice(0, 40);
          sampleImage = pickImageUrl(rows[0]);
        }
        break;
      }
    } catch (e) {
      errors.push(`probe ${api}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  try {
    while (pageNo <= endPage) {
      const qs = [
        `serviceKey=${serviceKey}`,
        `bgnde=${yyyymmdd(start)}`,
        `endde=${yyyymmdd(end)}`,
        `pageNo=${pageNo}`,
        `numOfRows=100`,
        `_type=json`,
      ].join("&");

      const json = await fetchDataGoKrJson(`${activeApi}?${qs}`);
      const { rows, totalCount: tc } = extractItemRows(json);
      totalCount = tc || totalCount;
      pages += 1;
      if (!rows.length) break;

      if (!sampleKeys && rows[0]) {
        sampleKeys = Object.keys(rows[0]).slice(0, 40);
        sampleImage = pickImageUrl(rows[0]);
      }

      const mapped = rows
        .map(mapRescueRow)
        .filter((r): r is NonNullable<typeof r> => Boolean(r));

      withImage += mapped.filter((r) => r.image_url).length;

      for (let i = 0; i < mapped.length; i += 200) {
        const chunk = mapped.slice(i, i + 200);
        const { error } = await supabase.from("rescued_animals").upsert(chunk, {
          onConflict: "desertion_no",
        });
        if (error) throw new Error(error.message);
        upserted += chunk.length;
      }

      if (pageNo * 100 >= totalCount) break;
      if (rows.length < 100) break;
      pageNo += 1;
      if (Date.now() - started > 240_000) break;
    }
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }

  const finalErrors =
    upserted > 0
      ? errors.filter((x) => !x.startsWith("probe "))
      : errors;

  return {
    ok: finalErrors.length === 0,
    upserted,
    pages,
    totalCount,
    errors: finalErrors,
    durationMs: Date.now() - started,
    withImage,
    sampleKeys,
    sampleImage,
    activeApi,
  };
}

function mapRescueRow(row: Record<string, unknown>) {
  const desertion_no = pickStr(row, ["desertionNo", "desertion_no"]);
  if (!desertion_no) return null;

  const care_addr = pickStr(row, ["careAddr", "care_addr"]);
  const happen_place = pickStr(row, ["happenPlace", "happen_place"]);
  const parsed = parseRegionFromAddress(care_addr || happen_place);
  const org = pickStr(row, ["orgNm", "org_nm"]);

  return {
    desertion_no,
    image_url: pickImageUrl(row),
    happen_dt: pickStr(row, ["happenDt", "happen_dt"]),
    happen_place,
    kind_cd: pickStr(row, ["kindCd", "kind_cd"]),
    color_cd: pickStr(row, ["colorCd", "color_cd"]),
    age: pickStr(row, ["age"]),
    weight: pickStr(row, ["weight"]),
    sex_cd: pickStr(row, ["sexCd", "sex_cd"]),
    neuter_yn: pickStr(row, ["neuterYn", "neuter_yn"]),
    special_mark: pickStr(row, ["specialMark", "special_mark"]),
    notice_no: pickStr(row, ["noticeNo", "notice_no"]),
    notice_sdt: pickStr(row, ["noticeSdt", "notice_sdt"]),
    notice_edt: pickStr(row, ["noticeEdt", "notice_edt"]),
    process_state: pickStr(row, ["processState", "process_state"]),
    care_nm: pickStr(row, ["careNm", "care_nm"]),
    care_tel: pickStr(row, ["careTel", "care_tel"]),
    care_addr,
    org_nm: org,
    sido: normalizeSido(org?.split(/\s+/)[0] || null) || parsed.sido,
    sigungu: parsed.sigungu,
    updated_at: new Date().toISOString(),
  };
}
