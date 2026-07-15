import type { Place } from "@/lib/places/types";
import type { PlaceCategory } from "@/lib/site";
import { SITE } from "@/lib/site";
import { hashSeed, seededPick } from "@/lib/seo/variation";

function regionLabel(sido?: string, sigungu?: string): string {
  if (sido && sigungu) return `${sido} ${sigungu}`;
  if (sido) return sido;
  if (sigungu) return sigungu;
  return "전국";
}

function categoryLabel(category?: PlaceCategory | ""): string {
  if (category) return category;
  return "동물병원·동물약국·동물장묘업";
}

/** 목록(지역·카테고리) 페이지용 SEO 본문 */
export function buildPlacesListSeoCopy(opts: {
  sido?: string;
  sigungu?: string;
  category?: PlaceCategory | "";
  total: number;
}): string {
  const region = regionLabel(opts.sido, opts.sigungu);
  const cat = categoryLabel(opts.category);
  const totalText =
    opts.total > 0
      ? `현재 이 조건으로 확인되는 시설은 약 ${opts.total.toLocaleString("ko-KR")}곳입니다.`
      : `아직 이 조건에 맞는 시설이 확인되지 않습니다. 지역이나 카테고리를 바꿔 다시 찾아보세요.`;

  const paragraphs = [
    `${region} 지역의 ${cat} 정보를 한눈에 확인할 수 있는 페이지입니다. 반려동물과 함께 생활하는 가구가 늘면서 병원·약국·장묘 시설을 미리 알아두는 일은 일상 돌봄과 응급 상황 모두에서 중요합니다.`,

    `${region}에서 ${cat}를 찾을 때는 영업 상태, 도로명·지번 주소, 연락처를 먼저 확인하는 것이 좋습니다. 같은 상호가 여러 지역에 있거나 간판 이름과 등록된 업체명이 다른 경우도 있으니, 방문 전 주소와 전화번호를 함께 확인하면 헛걸음을 줄일 수 있습니다.`,

    `동물병원은 진료·접종·응급 처치의 거점이고, 동물약국은 처방과 상담을 돕는 접근점이며, 동물장묘업은 반려동물 장례·화장·봉안 서비스를 담당합니다. ${region}에 거주한다면 집·직장 동선과 야간·주말 이용 가능성을 함께 살펴보면 선택의 폭이 넓어집니다. ${totalText}`,

    `"${region} ${cat}", "${region} 반려동물 병원", "${opts.sigungu || opts.sido || "우리 동네"} 동물약국"처럼 지역과 업종이 섞인 검색으로 들어오는 분들이 많습니다. 아래 목록에서 원하는 지역·카테고리를 선택해 필요한 시설을 빠르게 찾아보세요.`,

    `영업 상태가 "영업중"으로 표시되어 있어도 임시 휴무·이전·상호 변경이 있을 수 있고, 폐업·휴업 표시는 실제보다 늦게 반영될 수 있습니다. 따라서 방문·예약 전에는 해당 시설에 직접 연락해 운영 여부를 다시 확인해 주세요.`,

    `${SITE.name}는 ${region}의 반려동물 생활 인프라를 지역별로 더 쉽게 찾아볼 수 있도록 정보를 정리해 안내하는 포털입니다. 개별 시설의 서비스 품질을 보증하지는 않으며, 실제 이용 조건은 각 시설에 확인하시기 바랍니다.`,
  ];

  return paragraphs.join("\n\n");
}

/** 시설 상세 페이지용 SEO 본문 (페이지별 문장 변형) */
export function buildPlaceDetailSeoCopy(place: Place): string {
  const region = regionLabel(place.sido ?? undefined, place.sigungu ?? undefined);
  const address = place.address_road || place.address_jibun || "주소 정보 없음";
  const phone = place.phone || "전화번호 미등록";
  const seed = hashSeed(place.local_id || place.id || place.title);

  const p1 = [
    `${place.title}은(는) ${region}에 위치한 ${place.category}입니다. 현재 공개된 영업 상태는 "${place.status}"이며, 대표 연락처는 ${phone}, 안내 주소는 ${address}입니다.`,
    `${region}에 있는 ${place.category} ${place.title}의 정보입니다. 영업 상태는 "${place.status}", 연락처는 ${phone}, 주소는 ${address}로 안내됩니다.`,
  ];
  const p2 = [
    `${region}에서 ${place.category}를 찾을 때는 거리, 영업 여부, 전화 연결 가능성을 먼저 확인하는 경우가 많습니다. ${place.title}의 도로명·지번 주소가 함께 제공되면 내비게이션이나 도보 이동 시 혼선을 줄일 수 있습니다.`,
    `${place.title}을(를) 방문하기 전에는 영업 시간과 위치를 확인해 두는 것이 좋습니다. ${region} 안에서 비슷한 ${place.category}를 함께 비교해 보면 선택지가 넓어집니다.`,
  ];
  const p3 = [
    `${place.category} 이용 목적에 따라 준비물이 달라집니다. 진료·처방·장례 예약이 필요할 수 있고, 응급 상황에서는 인근 대체 시설을 함께 알아두면 안심할 수 있습니다. 영업 상태가 바뀌었을 수 있으니 방문 전 전화 문의를 권장합니다.`,
    `필요에 따라 사전 예약이나 상담이 필요할 수 있습니다. 특히 응급 상황을 대비해 ${region} 내 다른 ${place.category} 위치도 미리 확인해 두면 도움이 됩니다.`,
  ];
  const p4 = [
    `이 정보는 공개된 인허가 자료를 바탕으로 한 안내이며, 의료·약사·장묘 계약의 법적 효력을 대신하지 않습니다. 실제 서비스 가능 여부와 비용, 운영 시간은 ${place.title}에 직접 문의해 주세요.`,
    `본 페이지는 참고용 안내이며, 실제 이용 조건·비용·운영 시간은 ${place.title}에 확인하셔야 합니다. ${SITE.name}는 ${region} 반려동물 인프라를 더 투명하게 연결하는 것을 목표로 합니다.`,
  ];

  return [
    seededPick(p1, seed),
    seededPick(p2, seed >> 3),
    seededPick(p3, seed >> 6),
    seededPick(p4, seed >> 9),
  ].join("\n\n");
}

export function countSeoChars(text: string): number {
  return text.replace(/\s+/g, "").length;
}
