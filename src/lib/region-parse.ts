/** 키워드에서 지역명 추출 (예: 강남애견미용학원 → 강남, 은평구애견미용 → 은평구) */
export const SERVICE_SUFFIXES = [
  "애견미용학원추천",
  "애견미용학원",
  "애견미용학교",
  "애견미용교육",
  "애견미용자격증",
  "애견미용관리사",
  "애견미용사",
  "펫그루밍학원",
  "펫그루밍",
  "반려견미용",
  "강아지미용",
  "애견미용",
  "미용학원",
  "미용교육",
  "자격증",
  "학원",
  "교육",
  "추천",
];

const SEOUL_GU = [
  "강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구",
  "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구",
  "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구",
];

const KNOWN_REGIONS = [
  ...SEOUL_GU,
  "의정부", "강남", "서초", "송파", "마포", "영등포", "용산", "종로", "동대문",
  "성북", "강북", "노원", "도봉", "은평", "서대문", "강서", "양천", "구로", "금천",
  "관악", "동작", "광진", "성동", "강동", "일산", "파주", "김포", "고양", "부천",
  "인천", "수원", "용인", "성남", "안양", "안산", "화성", "평택", "시흥", "광명",
  "부산", "대구", "광주", "대전", "울산", "세종", "창원", "천안", "청주", "전주",
  "제주", "춘천", "원주", "포항", "구미", "김해", "진주", "순천", "목포", "여수",
  "자양동", "성수동", "군자동", "면목동", "삼성동", "잠실", "송파동", "문정동",
  "가락동", "천호동", "구의동", "광나루", "화양동", "능동", "자곡동", "세곡동",
  "삼전동", "역삼동", "논현동", "신사동", "압구정", "대치동", "개포동",
  "상봉리", "하남", "미사", "강일동", "중랑", "망우동", "신내동",
];

export { KNOWN_REGIONS };

const SORTED_REGIONS = [...KNOWN_REGIONS].sort((a, b) => b.length - a.length);

/** 키워드 앞부분 행정구역 (은평구, 강동구, 자양동 등) */
function matchRegionPrefix(normalized: string): string | null {
  for (const region of SORTED_REGIONS) {
    if (normalized.startsWith(region)) return region;
  }

  const auto = normalized.match(/^([가-힣]{2,8}(?:구|시|군|동|읍|면|리))/);
  if (auto?.[1]) return auto[1];

  return null;
}

export function extractRegionFromKeyword(keyword: string): string | null {
  const normalized = keyword.replace(/\s+/g, "").trim();
  if (!normalized) return null;

  const prefix = matchRegionPrefix(normalized);
  if (prefix) return prefix;

  let text = normalized;
  const sorted = [...SERVICE_SUFFIXES].sort((a, b) => b.length - a.length);
  for (const suffix of sorted) {
    if (text.endsWith(suffix)) {
      text = text.slice(0, -suffix.length);
      break;
    }
  }

  text = text.trim();
  if (text.length < 2 || text.length > 10) return null;
  return text;
}
