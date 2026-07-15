import type { PetTravelPlace } from "@/lib/travel/types";
import { hashSeed, seededPick } from "@/lib/seo/variation";

export function buildTravelListSeo(opts: { sido?: string; total: number }): string {
  const region = opts.sido || "전국";
  const n = opts.total.toLocaleString("ko-KR");
  return [
    `${region}에서 반려견·반려묘와 함께 가기 좋은 반려동물 동반여행 장소를 모았습니다. "애견동반 카페", "반려견 동반 펜션", "주차 가능한 애견카페"처럼 지역과 업종이 섞인 검색으로 찾는 분들을 위해 상호·주소·연락처와 동반 조건을 함께 정리했습니다.`,
    `현재 ${region} 기준으로 약 ${n}곳의 동반 가능 장소가 등록되어 있습니다. 각 장소마다 목줄·배변·크기 제한 등 동반 유의사항이 다를 수 있으니, 방문 전에는 장소 측에 반려동물 동반 조건을 미리 확인해 주세요.`,
    `가까운 카페부터 펜션·식당·관광지까지 지역별로 살펴보고, 반려동물과 함께하는 나들이 계획을 세워 보세요. 아래 목록에서 원하는 지역을 선택하면 더 많은 장소를 볼 수 있습니다.`,
  ].join("\n\n");
}

export function buildTravelDetailSeo(p: PetTravelPlace): string {
  const region = [p.sido, p.sigungu].filter(Boolean).join(" ") || "전국";
  const addr = [p.address, p.address_detail].filter(Boolean).join(" ") || "주소 별도 확인";
  const tel = p.tel || "연락처 미등록";
  const overview = p.overview
    ? p.overview.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400)
    : null;
  const seed = hashSeed(p.content_id || `${p.title}${addr}`);

  const p1 = [
    `${p.title}은(는) ${region}에 있는 반려동물 동반 가능 장소입니다. 주소는 ${addr}, 연락처는 ${tel}입니다. 반려견·반려묘와 함께 방문할 수 있는 곳을 찾고 있다면 참고해 보세요.`,
    `${region}에서 반려동물과 함께 갈 수 있는 ${p.title} 정보입니다. ${addr}에 위치해 있으며, 문의는 ${tel}로 하실 수 있습니다.`,
  ];
  const p2 = [
    `동반 안내: ${p.pet_info || "상세 동반 조건은 방문 전 장소 측에 확인해 주세요."} 유의사항: ${p.pet_rule || "목줄·배변봉투 등 기본 에티켓을 지켜 주세요."}`,
    `반려동물 동반 조건은 다음과 같습니다. ${p.pet_info || "구체적인 동반 가능 여부는 현장 안내를 따릅니다."} 방문 시에는 ${p.pet_rule || "목줄 착용과 배변 처리 등 기본 매너"}를 지켜 주세요.`,
  ];
  const p3 = overview
    ? [
        `${overview}`,
        `${p.title} 소개: ${overview}`,
      ]
    : [
        `${p.title}의 세부 이용 조건과 운영 시간은 현장 안내에 따를 수 있으니, 방문 전 연락처로 확인하시길 권장합니다.`,
        `운영 시간·이용 요금 등은 변동될 수 있으므로, 방문 전 ${p.title}에 직접 문의해 최신 정보를 확인해 주세요.`,
      ];

  return [
    seededPick(p1, seed),
    seededPick(p2, seed >> 3),
    seededPick(p3, seed >> 6),
  ].join("\n\n");
}
