/** 응답 키가 대소문자/스네이크/카멜이 섞여도 안전하게 읽기 */
export function pickField(
  row: Record<string, unknown>,
  keys: string[]
): string | null {
  const normalized = new Map<string, unknown>();
  for (const [k, v] of Object.entries(row)) {
    normalized.set(k.toLowerCase().replace(/_/g, ""), v);
  }
  for (const key of keys) {
    const direct = row[key];
    if (direct != null && String(direct).trim() !== "") {
      return String(direct).trim();
    }
    const compact = key.toLowerCase().replace(/_/g, "");
    const alt = normalized.get(compact);
    if (alt != null && String(alt).trim() !== "") {
      return String(alt).trim();
    }
  }
  return null;
}

const SIDO_PREFIXES = [
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
  "강원도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라북도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
  "제주도",
] as const;

/** 짧은 표기 → 공식 시·도명 */
export const SIDO_ALIASES: Record<string, string> = {
  서울: "서울특별시",
  부산: "부산광역시",
  대구: "대구광역시",
  인천: "인천광역시",
  광주: "광주광역시",
  대전: "대전광역시",
  울산: "울산광역시",
  세종: "세종특별자치시",
  경기: "경기도",
  강원: "강원특별자치도",
  충북: "충청북도",
  충남: "충청남도",
  전북: "전북특별자치도",
  전남: "전라남도",
  경북: "경상북도",
  경남: "경상남도",
  제주: "제주특별자치도",
};

export function normalizeSido(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (SIDO_ALIASES[t]) return SIDO_ALIASES[t];
  for (const s of SIDO_PREFIXES) {
    if (t === s || t.startsWith(s)) return s === "강원도" ? "강원특별자치도" : s === "전라북도" ? "전북특별자치도" : s === "제주도" ? "제주특별자치도" : s;
  }
  return t;
}

export function parseRegionFromAddress(address: string | null): {
  sido: string | null;
  sigungu: string | null;
} {
  if (!address) return { sido: null, sigungu: null };
  const parts = address.trim().split(/\s+/);
  if (parts.length === 0) return { sido: null, sigungu: null };

  let sido = normalizeSido(parts[0]);
  let restStart = 1;

  // "서울시 강남구 ..." 형태
  if (!sido && parts[0].endsWith("시")) {
    sido = normalizeSido(parts[0].replace(/시$/, ""));
  }

  let sigungu: string | null = null;
  if (parts.length > restStart) {
    const candidate = parts[restStart];
    if (
      candidate.endsWith("시") ||
      candidate.endsWith("군") ||
      candidate.endsWith("구")
    ) {
      sigungu = candidate;
      // 수원시 영통구
      if (
        parts.length > restStart + 1 &&
        candidate.endsWith("시") &&
        parts[restStart + 1].endsWith("구")
      ) {
        sigungu = `${candidate} ${parts[restStart + 1]}`;
      }
    }
  }

  return { sido, sigungu };
}

export function slugifyRegion(name: string): string {
  return encodeURIComponent(name.trim().replace(/\s+/g, " "));
}

export function deslugifyRegion(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}
