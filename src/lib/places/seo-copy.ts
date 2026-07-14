import type { Place } from "@/lib/places/types";
import type { PlaceCategory } from "@/lib/site";
import { SITE } from "@/lib/site";

function regionLabel(sido?: string, sigungu?: string): string {
  if (sido && sigungu) return `${sido} ${sigungu}`;
  if (sido) return sido;
  if (sigungu) return sigungu;
  return "전국";
}

function categoryLabel(category?: PlaceCategory | ""): string {
  if (category) return category;
  return "동물병원·동물약국·위탁관리업";
}

/**
 * SEO 본문용 정형 텍스트 (1,000자+). 이미지로 대체하지 않음.
 */
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
      : `아직 동기화된 데이터가 없거나 해당 조건에 맞는 시설이 없습니다. ${SITE.name}는 공공데이터포털 지방행정인허가 데이터를 기준으로 목록을 갱신합니다.`;

  const paragraphs = [
    `${SITE.name}는 ${region} 지역의 ${cat} 인허가 현황을 정리해 안내합니다. 반려동물과 함께 생활하는 가구가 늘어나면서 병원·약국·위탁관리 시설을 미리 파악하는 일은 일상 돌봄과 응급 대응 모두에서 중요합니다. 본 페이지는 네이버·구글 등 검색 유입을 고려해 서버에서 HTML을 구성하며, 화면에는 필터 조건과 시설 목록, 지역 맥락 설명이 텍스트로 포함됩니다.`,

    `${region}에서 ${cat}를 찾을 때 우선 확인할 항목은 영업 상태, 도로명·지번 주소, 연락처입니다. 동일 상호가 여러 구에 존재하거나 간판명과 인허가상 업체명이 다른 경우도 있어, 방문 전에는 공개된 주소와 전화번호를 교차 확인하는 것이 안전합니다. ${SITE.name} 목록은 공공 인허가 번호(local_id)를 고유키로 관리해 중복 등록을 줄이고 UPSERT 방식으로 최신 상태를 반영합니다.`,

    `${cat} 카테고리별로 이용하는 목적이 다릅니다. 동물병원은 진료·접종·응급 처치의 거점이고, 동물약국은 처방·상담을 보완하는 접근점이며, 위탁관리업은 단단기 돌봄과 외출 중 케어를 담당합니다. ${region} 거주자라면 집·직장 동선과 야간·주말 이용 가능성을 함께 검토하면 실제 선택 폭이 넓어집니다. ${totalText}`,

    `검색 이용자는 "${region} ${cat}", "${region} 반려동물 병원", "${opts.sigungu || opts.sido || "우리 동네"} 동물약국"과 같은 롱테일 키워드로 유입하는 경우가 많습니다. ${SITE.name}는 시·도·시군구·카테고리 조합 페이지를 서버 렌더링으로 제공해 로봇이 본문 문단을 바로 수집할 수 있게 설계했습니다. 목록 카드의 업체명·상태·주소·전화도 텍스트 태그로 노출되므로, 이미지만으로 정보를 대체하지 않습니다.`,

    `데이터 해석 시 유의사항이 있습니다. 인허가상 "영업중"이더라도 임시 휴무·이전·상호 변경이 있을 수 있고, 폐업·휴업 표시는 동기화 시점 기준으로 늦을 수 있습니다. 따라서 방문·예약 전에는 해당 시설에 직접 연락해 운영 여부를 재확인하세요. ${SITE.name}는 정보를 중개·안내하는 포털이며, 개별 시설의 진료·판매·위탁 서비스 품질을 보증하지 않습니다.`,

    `앞으로 ${region} 데이터는 정기 동기화로 갱신되며, 상세 페이지에서는 업체별 대시보드 형태로 상태 인디케이터와 주소·전화를 제공합니다. 프리미엄 분양·보호소 안내는 목록 상단 배너 영역에 별도로 노출될 수 있습니다. ${SITE.name}와 함께 ${region} 반려동물 인프라를 빠르게 훑어보시기 바랍니다.`,
  ];

  return paragraphs.join("\n\n");
}

export function buildPlaceDetailSeoCopy(place: Place): string {
  const region = regionLabel(place.sido ?? undefined, place.sigungu ?? undefined);
  const address =
    place.address_road || place.address_jibun || "주소 정보 없음";
  const phone = place.phone || "전화번호 미등록";

  const paragraphs = [
    `${place.title}은(는) ${region}에 위치한 ${place.category} 인허가 시설로, ${SITE.name} 데이터베이스에 등록되어 있습니다. 현재 공개된 영업 상태는 "${place.status}"이며, 대표 연락처는 ${phone}, 안내 주소는 ${address}입니다. 아래 설명은 검색 엔진이 본문을 텍스트로 수집할 수 있도록 정형화한 지역·인프라 안내입니다.`,

    `${region}에서 ${place.category}를 찾는 이용자는 보통 거리, 영업 여부, 전화 연결 가능성을 먼저 확인합니다. ${place.title}의 도로명 주소와 지번 주소가 모두 제공된 경우 내비게이션·도보 이동 시 혼선을 줄일 수 있습니다. 인허가 고유번호(local_id: ${place.local_id})는 공공데이터 동기화의 기준키로 사용되며, 동일 시설이 중복 노출되지 않도록 UPSERT에 활용됩니다.`,

    `${place.category} 이용 목적에 따라 준비물이 달라집니다. 진료·처방·위탁 모두 예약이 필요할 수 있고, 응급 상황에서는 인근 대체 시설을 함께 알아두는 것이 좋습니다. ${SITE.name} 목록에서 같은 ${place.sido || "시·도"}·${place.sigungu || "시·군·구"} 조건으로 유사 카테고리를 비교하면 선택지가 늘어납니다. 상태가 폐업·휴업으로 바뀐 경우 동기화 시각(updated_at: ${place.updated_at}) 이후 변경일 수 있으니 방문 전 전화를 권장합니다.`,

    `검색 측면에서는 "${place.title}", "${region} ${place.category}", "${place.sigungu || region} 반려동물" 키워드와 상세 페이지 URL이 매칭됩니다. ${SITE.name}는 클라이언트에서 외부 API를 실시간 호출하지 않고, Supabase에 적재된 스냅샷을 서버 컴포넌트로 렌더링합니다. 따라서 첫 HTML에 업체명·상태·주소·전화·지역 설명이 이미 포함됩니다.`,

    `본 정보는 공공 인허가 데이터를 바탕으로 한 안내이며, 의료·약사·위탁 계약의 법적 효력을 대신하지 않습니다. 실제 서비스 가능 여부, 비용, 운영 시간은 ${place.title}에 문의하세요. ${SITE.name}는 ${region} 반려동물 생활 인프라를 더 투명하게 연결하는 것을 목표로 합니다.`,
  ];

  return paragraphs.join("\n\n");
}

export function countSeoChars(text: string): number {
  return text.replace(/\s+/g, "").length;
}
