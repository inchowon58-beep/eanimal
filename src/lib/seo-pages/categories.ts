/**
 * SEO 페이지 카테고리 정의 (순수 데이터 — 서버/클라이언트 공용)
 * - label: 관리자 화면 표기
 * - topic: 해시태그 섹션 제목에 쓰는 주제어 (예: "충청남도 서산시 {topic} 관련 검색어")
 * - hashtagStems: 지역명과 결합해 만드는 접미 키워드 (지역 롱테일)
 * - genericTags: 지역 무관 롱테일 키워드
 * - defaultPool: 본문에 녹여 넣을 연관 키워드 기본값 (관리자에서 편집 가능)
 */
export interface SeoCategoryDef {
  id: string;
  label: string;
  topic: string;
  hashtagStems: string[];
  genericTags: string[];
  defaultPool: string;
}

export const SEO_CATEGORIES: SeoCategoryDef[] = [
  {
    id: "shelter",
    label: "보호소",
    topic: "유기동물",
    hashtagStems: ["강아지보호소", "유기견보호센터", "유기견입양", "유기동물보호센터", "고양이보호소"],
    genericTags: ["강아지무료분양", "유기견무료분양", "유기견입양", "유기동물보호소", "고양이무료분양"],
    defaultPool:
      "강아지보호소,강아지무료분양,유기견보호소,유기동물보호소,유기견보호센터,유기견무료분양,유기견입양,고양이무료분양,유기묘무료분양,유기묘입양",
  },
  {
    id: "adopt",
    label: "강아지분양",
    topic: "강아지분양",
    hashtagStems: ["강아지분양", "강아지무료분양", "애견분양", "소형견분양", "강아지입양"],
    genericTags: ["강아지분양", "강아지무료분양", "애견분양", "소형견분양", "강아지분양가격"],
    defaultPool:
      "강아지분양,강아지무료분양,애견분양,소형견분양,강아지입양,포메라니안분양,푸들분양,말티즈분양,비숑분양,강아지분양가격",
  },
  {
    id: "hospital",
    label: "동물병원",
    topic: "동물병원",
    hashtagStems: ["동물병원", "24시동물병원", "강아지병원", "고양이병원", "동물병원추천"],
    genericTags: ["동물병원추천", "24시동물병원", "강아지예방접종", "반려동물병원"],
    defaultPool:
      "동물병원,24시동물병원,강아지병원,고양이병원,동물병원추천,동물병원가격,강아지예방접종,반려동물병원",
  },
  {
    id: "funeral",
    label: "장례식장",
    topic: "반려동물장례",
    hashtagStems: ["강아지장례식장", "반려동물장례식장", "애견장례", "강아지화장", "고양이장례식장"],
    genericTags: ["반려동물장례식장", "강아지장례비용", "애견장례", "반려동물화장장"],
    defaultPool:
      "강아지장례식장,반려동물장례식장,애견장례,강아지화장,반려동물화장장,강아지장례비용,고양이장례식장,반려동물장묘",
  },
  {
    id: "cafe",
    label: "애견카페",
    topic: "애견카페",
    hashtagStems: ["애견카페", "강아지카페", "애견동반카페", "대형견카페"],
    genericTags: ["애견카페추천", "강아지랑갈만한곳", "애견동반카페", "대형견카페"],
    defaultPool:
      "애견카페,강아지카페,애견동반카페,대형견카페,애견카페추천,강아지랑갈만한곳,애견동반",
  },
  {
    id: "pharmacy",
    label: "동물약국",
    topic: "동물약국",
    hashtagStems: ["동물약국", "강아지약국", "반려동물약국", "고양이약국"],
    genericTags: ["동물약국", "강아지영양제", "반려동물의약품", "강아지약"],
    defaultPool:
      "동물약국,강아지약국,반려동물약국,강아지영양제,강아지약,고양이약국,반려동물의약품",
  },
  {
    id: "hotel",
    label: "애견호텔·펜션",
    topic: "애견호텔·펜션",
    hashtagStems: ["애견호텔", "애견펜션", "강아지호텔", "애견동반펜션", "반려견펜션"],
    genericTags: ["애견동반숙소", "강아지호텔링", "반려견펜션", "강아지맡기는곳"],
    defaultPool:
      "애견호텔,애견펜션,강아지호텔,애견동반펜션,강아지호텔링,애견동반숙소,반려견펜션,강아지맡기는곳",
  },
  {
    id: "academy",
    label: "미용학원",
    topic: "애견미용",
    hashtagStems: ["애견미용학원", "강아지미용학원", "반려동물미용학원", "애견미용사"],
    genericTags: ["애견미용자격증", "애견미용배우기", "반려동물미용자격증", "애견미용학원비용"],
    defaultPool:
      "애견미용학원,강아지미용학원,애견미용자격증,반려동물미용학원,애견미용사,애견미용학원비용,애견미용배우기,반려동물미용자격증",
  },
];

const BY_ID = new Map(SEO_CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: string | null | undefined): SeoCategoryDef | null {
  if (!id) return null;
  return BY_ID.get(id) ?? null;
}

export function isValidCategory(id: string | null | undefined): boolean {
  return Boolean(id && BY_ID.has(id));
}

/** 카테고리 풀 문자열을 키워드 배열로 파싱 (쉼표/줄바꿈 구분, 중복 제거) */
export function parsePool(pool: string | null | undefined): string[] {
  if (!pool) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of pool.split(/[\n,]+/)) {
    const k = raw.replace(/\s+/g, " ").trim();
    if (!k) continue;
    const norm = k.replace(/\s+/g, "");
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(k);
  }
  return out;
}
