import {
  extractItemRows,
  fetchDataGoKrJson,
  getEncodedServiceKey,
  pickStr,
} from "@/lib/public-data/fetch-json";
import { getSupabaseService } from "@/lib/supabase/server";
import { normalizeSido, parseRegionFromAddress } from "@/lib/public-data/normalize";

const BASE = "https://apis.data.go.kr/B551011/KorPetTourService2";
const MOBILE_OS = "ETC";
const MOBILE_APP = "eanimal";

/** 관광공사 areaCode → 시·도명 (주요 코드) */
const AREA_CODE_SIDO: Record<string, string> = {
  "1": "서울특별시",
  "2": "인천광역시",
  "3": "대전광역시",
  "4": "대구광역시",
  "5": "광주광역시",
  "6": "부산광역시",
  "7": "울산광역시",
  "8": "세종특별자치시",
  "31": "경기도",
  "32": "강원특별자치도",
  "33": "충청북도",
  "34": "충청남도",
  "35": "경상북도",
  "36": "경상남도",
  "37": "전북특별자치도",
  "38": "전라남도",
  "39": "제주특별자치도",
};

export interface TravelSyncResult {
  ok: boolean;
  upserted: number;
  pages: number;
  totalCount: number;
  errors: string[];
  durationMs: number;
}

export async function syncPetTravel(opts?: {
  maxPages?: number;
  enrichDetails?: boolean;
}): Promise<TravelSyncResult> {
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

  const maxPages = opts?.maxPages ?? Number.POSITIVE_INFINITY;
  const enrich = opts?.enrichDetails !== false;
  const serviceKey = getEncodedServiceKey();
  let pageNo = 1;
  let upserted = 0;
  let pages = 0;
  let totalCount = 0;
  const errors: string[] = [];

  try {
    while (pageNo <= maxPages) {
      const qs = [
        `serviceKey=${serviceKey}`,
        `numOfRows=50`,
        `pageNo=${pageNo}`,
        `MobileOS=${MOBILE_OS}`,
        `MobileApp=${MOBILE_APP}`,
        `_type=json`,
        `listYN=Y`,
        `arrange=A`,
      ].join("&");

      const json = await fetchDataGoKrJson(`${BASE}/areaBasedList2?${qs}`);
      const { rows, totalCount: tc } = extractItemRows(json);
      totalCount = tc || totalCount;
      pages += 1;
      if (!rows.length) break;

      const mapped: ReturnType<typeof mapTravelListRow>[] = [];
      for (const row of rows) {
        const baseRow = mapTravelListRow(row);
        if (!baseRow) continue;
        if (enrich) {
          try {
            const detail = await fetchPetDetail(serviceKey, baseRow.content_id);
            if (detail.overview) baseRow.overview = detail.overview;
            if (detail.pet_info) baseRow.pet_info = detail.pet_info;
            if (detail.pet_rule) baseRow.pet_rule = detail.pet_rule;
            if (detail.address) baseRow.address = detail.address;
            if (detail.address_detail) baseRow.address_detail = detail.address_detail;
            if (detail.tel) baseRow.tel = detail.tel;
          } catch {
            // detail optional
          }
        }
        mapped.push(baseRow);
        if (Date.now() - started > 240_000) break;
      }

      const rowsToSave = mapped.filter(Boolean) as NonNullable<
        ReturnType<typeof mapTravelListRow>
      >[];
      for (let i = 0; i < rowsToSave.length; i += 100) {
        const chunk = rowsToSave.slice(i, i + 100);
        const { error } = await supabase.from("pet_travel").upsert(chunk, {
          onConflict: "content_id",
        });
        if (error) throw new Error(error.message);
        upserted += chunk.length;
      }

      if (pageNo * 50 >= totalCount) break;
      if (rows.length < 50) break;
      pageNo += 1;
      if (Date.now() - started > 250_000) break;
    }
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }

  return {
    ok: errors.length === 0,
    upserted,
    pages,
    totalCount,
    errors,
    durationMs: Date.now() - started,
  };
}

function mapTravelListRow(row: Record<string, unknown>) {
  const content_id = pickStr(row, ["contentid", "contentId"]);
  const title = pickStr(row, ["title"]);
  if (!content_id || !title) return null;

  const address = pickStr(row, ["addr1"]);
  const address_detail = pickStr(row, ["addr2"]);
  const area_code = pickStr(row, ["areacode", "areaCode"]);
  const parsed = parseRegionFromAddress(
    [address, address_detail].filter(Boolean).join(" ")
  );
  const sido =
    (area_code && AREA_CODE_SIDO[area_code]) ||
    normalizeSido(parsed.sido) ||
    parsed.sido;

  return {
    content_id,
    content_type_id: pickStr(row, ["contenttypeid", "contentTypeId"]),
    title,
    image_url:
      pickStr(row, ["firstimage", "firstImage"]) ||
      pickStr(row, ["firstimage2", "firstImage2"]),
    address,
    address_detail,
    tel: pickStr(row, ["tel"]),
    area_code,
    sigungu_code: pickStr(row, ["sigungucode", "sigunguCode"]),
    sido,
    sigungu: parsed.sigungu,
    overview: null as string | null,
    pet_info: null as string | null,
    pet_rule: null as string | null,
    mapx: pickStr(row, ["mapx", "mapX"]),
    mapy: pickStr(row, ["mapy", "mapY"]),
    updated_at: new Date().toISOString(),
  };
}

async function fetchPetDetail(serviceKey: string, contentId: string) {
  const qs = [
    `serviceKey=${serviceKey}`,
    `MobileOS=${MOBILE_OS}`,
    `MobileApp=${MOBILE_APP}`,
    `contentId=${contentId}`,
    `_type=json`,
  ].join("&");

  const [petJson, commonJson] = await Promise.all([
    fetchDataGoKrJson(`${BASE}/detailPetTour2?${qs}`),
    fetchDataGoKrJson(
      `${BASE}/detailCommon2?${qs}&defaultYN=Y&overviewYN=Y&addrinfoYN=Y`
    ),
  ]);

  const petRows = extractItemRows(petJson).rows;
  const commonRows = extractItemRows(commonJson).rows;
  const pet = petRows[0] || {};
  const common = commonRows[0] || {};

  const petBits = [
    pickStr(pet, ["relaAcdntRiskMtr"]),
    pickStr(pet, ["acmpyTypeCd"]),
    pickStr(pet, ["relaPosesFclty"]),
    pickStr(pet, ["relaFridRcgExtraRmk"]),
    pickStr(pet, ["acmpyPsblCpam"]),
    pickStr(pet, ["etcAcmpyInfo"]),
  ].filter(Boolean);

  const ruleBits = [
    pickStr(pet, ["acmpyNeedMtr"]),
    pickStr(pet, ["relaRntlText"]),
  ].filter(Boolean);

  return {
    overview: pickStr(common, ["overview"]),
    pet_info: petBits.length ? petBits.join(" · ") : null,
    pet_rule: ruleBits.length ? ruleBits.join(" · ") : null,
    address: pickStr(common, ["addr1"]) || undefined,
    address_detail: pickStr(common, ["addr2"]) || undefined,
    tel: pickStr(common, ["tel"]) || undefined,
  };
}
