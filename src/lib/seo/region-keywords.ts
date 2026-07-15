import { SIDO_ALIASES } from "@/lib/public-data/normalize";

/** 공식 시·도명 → 짧은 표기 (경상남도 → 경남) */
const SIDO_FULL_TO_SHORT: Record<string, string> = Object.fromEntries(
  Object.entries(SIDO_ALIASES).map(([short, full]) => [full, short])
);

/** 광역 권역 표기 (경상남도 → 경상도) */
export function broadRegion(sidoFull: string | null | undefined): string | null {
  if (!sidoFull) return null;
  if (sidoFull.startsWith("경상")) return "경상도";
  if (sidoFull.startsWith("전라") || sidoFull.startsWith("전북")) return "전라도";
  if (sidoFull.startsWith("충청") || sidoFull.startsWith("충북") || sidoFull.startsWith("충남"))
    return "충청도";
  return null;
}

/** 시·군·구에서 접미사를 뗀 지명 (거제시 → 거제, 창원시 성산구 → 창원) */
export function cityStem(sigungu: string | null | undefined): string | null {
  if (!sigungu) return null;
  const first = sigungu.trim().split(/\s+/)[0];
  const stem = first.replace(/(특별자치시|특별시|광역시|자치시|시|군|구)$/, "");
  return stem || first;
}

/** 짧은 시·도 표기 (경상남도 → 경남). 광역시/특별시는 접미사 제거로 대체 */
export function sidoShort(sidoFull: string | null | undefined): string | null {
  if (!sidoFull) return null;
  if (SIDO_FULL_TO_SHORT[sidoFull]) return SIDO_FULL_TO_SHORT[sidoFull];
  return sidoFull.replace(/(특별자치도|특별자치시|특별시|광역시|도)$/, "") || sidoFull;
}

/** 지역 표기 후보를 도시 → 짧은 시도 → 광역권 → 공식명 순으로 반환 (중복 제거) */
export function regionVariants(
  sido: string | null | undefined,
  sigungu: string | null | undefined
): string[] {
  const variants = [
    cityStem(sigungu),
    sidoShort(sido),
    broadRegion(sido),
    sido || null,
  ].filter((v): v is string => Boolean(v && v.trim()));
  return Array.from(new Set(variants));
}

type Species = "dog" | "cat" | "other";

export function detectSpecies(kindCd: string | null | undefined): Species {
  const k = (kindCd || "").toLowerCase();
  if (kindCd?.includes("고양이") || kindCd?.includes("[묘]") || k.includes("cat"))
    return "cat";
  if (kindCd?.includes("[개]") || kindCd?.includes("개") || kindCd?.includes("견"))
    return "dog";
  return "other";
}

function dedupePush(list: string[], value: string) {
  const v = value.replace(/\s+/g, "");
  if (v && !list.includes(v)) list.push(v);
}

function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) || 1;
}

/** 시드 기반 셔플 (SSR에서 매 요청마다 동일한 결과가 나오도록) */
function seededShuffle<T>(arr: T[], seed: string): T[] {
  const a = [...arr];
  let h = strHash(seed);
  const rand = () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * SEO 가이드 페이지용 지역 기반 해시태그.
 * 카테고리 접미 키워드(stems)를 지역명과 결합하고, 시드로 3~5개를 뽑는다.
 * 예) 충청남도 서산시 + 유기동물 → 서산강아지보호소, 충남유기견보호센터 ...
 */
export function buildGuideHashtags(opts: {
  sido?: string | null;
  sigungu?: string | null;
  stems: string[];
  genericTags?: string[];
  seed?: string;
  min?: number;
  max?: number;
}): string[] {
  const { sido, sigungu, stems, genericTags = [], seed = "guide" } = opts;
  const city = cityStem(sigungu);
  const short = sidoShort(sido);
  const broad = broadRegion(sido);
  const full = sido || null;
  const regions = [city, short, broad, full].filter((r): r is string => Boolean(r));

  const regional: string[] = [];
  for (const r of regions) {
    for (const stem of stems) dedupePush(regional, `${r}${stem}`);
  }

  const generic: string[] = [];
  if (!regions.length) for (const stem of stems) dedupePush(generic, stem);
  for (const g of genericTags) dedupePush(generic, g);

  // 지역 결합 태그를 우선하되, 지역/일반을 섞어서 다양성 확보
  const pool = [...seededShuffle(regional, seed), ...seededShuffle(generic, `${seed}-g`)];
  if (!pool.length) return [];

  const min = opts.min ?? 3;
  const max = opts.max ?? 5;
  const count = min + (strHash(`${seed}-n`) % (max - min + 1));
  return pool.slice(0, Math.min(count, pool.length));
}

/**
 * 구조공고용 지역 + 키워드 해시태그.
 * 예) 경상남도 거제시 → 거제강아지보호소, 거제유기견보호센터, 경상도유기견보호센터,
 *     경상남도유기견보호센터, 경남유기견보호센터 ...
 */
export function buildRescueHashtags(opts: {
  sido: string | null | undefined;
  sigungu: string | null | undefined;
  kindCd: string | null | undefined;
}): string[] {
  const city = cityStem(opts.sigungu);
  const short = sidoShort(opts.sido);
  const broad = broadRegion(opts.sido);
  const full = opts.sido || null;
  const regions = [short, broad, full].filter((r): r is string => Boolean(r));
  const species = detectSpecies(opts.kindCd);

  const tags: string[] = [];

  if (species !== "cat") {
    if (city) {
      dedupePush(tags, `${city}강아지보호소`);
      dedupePush(tags, `${city}유기견보호센터`);
      dedupePush(tags, `${city}유기견입양`);
      dedupePush(tags, `${city}강아지무료분양`);
    }
    for (const r of regions) dedupePush(tags, `${r}유기견보호센터`);
  }

  if (species !== "dog") {
    if (city) {
      dedupePush(tags, `${city}고양이보호소`);
      dedupePush(tags, `${city}유기묘입양`);
      dedupePush(tags, `${city}고양이무료분양`);
    }
    for (const r of regions) dedupePush(tags, `${r}유기묘보호센터`);
  }

  if (species === "other" && city) {
    dedupePush(tags, `${city}유기동물보호센터`);
  }

  // 지역 무관 롱테일 키워드
  const generic =
    species === "cat"
      ? ["고양이무료분양", "유기묘무료분양", "유기묘입양", "유기동물보호소"]
      : species === "dog"
        ? ["강아지무료분양", "유기견무료분양", "유기견입양", "강아지보호소", "유기동물보호소"]
        : [
            "강아지무료분양",
            "유기견무료분양",
            "고양이무료분양",
            "유기묘무료분양",
            "유기동물보호소",
            "유기동물보호센터",
          ];
  for (const g of generic) dedupePush(tags, g);

  return tags.slice(0, 20);
}

/** 동반여행용 지역 + 키워드 해시태그 */
export function buildTravelHashtags(opts: {
  sido: string | null | undefined;
  sigungu: string | null | undefined;
}): string[] {
  const city = cityStem(opts.sigungu);
  const short = sidoShort(opts.sido);
  const broad = broadRegion(opts.sido);
  const full = opts.sido || null;
  const regions = [short, broad, full].filter((r): r is string => Boolean(r));

  const tags: string[] = [];
  if (city) {
    dedupePush(tags, `${city}애견동반카페`);
    dedupePush(tags, `${city}애견펜션`);
    dedupePush(tags, `${city}애견동반식당`);
    dedupePush(tags, `${city}반려견동반여행`);
    dedupePush(tags, `${city}강아지랑갈만한곳`);
  }
  for (const r of regions) dedupePush(tags, `${r}반려견동반여행`);

  for (const g of [
    "애견동반카페",
    "반려견동반펜션",
    "애견동반식당",
    "반려견동반여행",
    "강아지랑갈만한곳",
  ]) {
    dedupePush(tags, g);
  }
  return tags.slice(0, 18);
}
