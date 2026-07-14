import type { PlaceCategory } from "@/lib/site";
import {
  normalizeSido,
  parseRegionFromAddress,
  pickField,
} from "@/lib/public-data/normalize";
import { isInactiveStatus } from "@/lib/places/status";

export interface PlaceUpsertRow {
  local_id: string;
  category: PlaceCategory;
  title: string;
  status: string;
  address_road: string | null;
  address_jibun: string | null;
  phone: string | null;
  sido: string | null;
  sigungu: string | null;
  is_inactive: boolean;
  updated_at: string;
}

export function mapPublicRowToPlace(
  row: Record<string, unknown>,
  category: PlaceCategory,
  localIdPrefix: string
): PlaceUpsertRow | null {
  const mgtNo = pickField(row, [
    "MGT_NO",
    "MGTNO",
    "mgtNo",
    "LCNS_NO",
    "APV_PERM_NO",
  ]);
  const title = pickField(row, ["BPLC_NM", "bplcNm", "FCLTY_NM", "bizPlcNm"]);
  if (!title) return null;

  const local_id = `${localIdPrefix}:${mgtNo || hashFallback(title, category, row)}`;

  const status =
    pickField(row, [
      "SALS_STTS_NM",
      "TRD_STATE_NM",
      "trdStateNm",
      "DTL_STATE_NM",
      "dtlStateNm",
      "salsSttsNm",
    ]) || "정보없음";

  const address_road = pickField(row, [
    "ROAD_NM_ADDR",
    "RDN_WHL_ADDR",
    "rdnWhlAddr",
    "roadNmAddr",
  ]);
  const address_jibun = pickField(row, [
    "LOTNO_ADDR",
    "SITE_WHL_ADDR",
    "siteWhlAddr",
    "locplcAddr",
    "LCTN_ADDR",
  ]);

  const phone = pickField(row, [
    "TELNO",
    "SITE_TEL",
    "siteTel",
    "telNo",
    "RPRS_TELNO",
  ]);

  let sido = normalizeSido(
    pickField(row, ["CTPV_NM", "ctpvNm", "LCTN_CNTY_NM", "SIDO_NM", "sidoNm"])
  );
  let sigungu = pickField(row, [
    "SIGNGU_NM",
    "signguNm",
    "SIGUNGU_NM",
    "LCTN_SIGNGU_NM",
  ]);

  if (!sido || !sigungu) {
    const parsed = parseRegionFromAddress(address_road || address_jibun);
    sido = sido || parsed.sido;
    sigungu = sigungu || parsed.sigungu;
  }

  return {
    local_id,
    category,
    title,
    status,
    address_road,
    address_jibun,
    phone,
    sido,
    sigungu,
    is_inactive: isInactiveStatus(status),
    updated_at: new Date().toISOString(),
  };
}

function hashFallback(
  title: string,
  category: PlaceCategory,
  row: Record<string, unknown>
): string {
  const base = `${category}|${title}|${pickField(row, ["ROAD_NM_ADDR", "SITE_WHL_ADDR", "rdnWhlAddr"]) || ""}`;
  let h = 0;
  for (let i = 0; i < base.length; i++) {
    h = (h * 31 + base.charCodeAt(i)) | 0;
  }
  return `gen_${Math.abs(h)}`;
}
