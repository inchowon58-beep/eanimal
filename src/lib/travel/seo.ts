import { SITE } from "@/lib/site";
import type { PetTravelPlace } from "@/lib/travel/types";

export function buildTravelListSeo(opts: { sido?: string; total: number }): string {
  const region = opts.sido || "전국";
  const n = opts.total.toLocaleString("ko-KR");
  return [
    `${SITE.name}의 반려동물 동반여행 디렉터리는 한국관광공사 공개 데이터를 바탕으로 ${region}에서 반려견·반려묘와 함께 가기 좋은 장소를 안내합니다. "애견동반 카페", "반려견 동반 펜션", "주차 가능 애견카페"처럼 지역+업종 롱테일 검색에 맞춘 텍스트 중심 페이지입니다.`,
    `현재 ${region} 기준으로 약 ${n}곳의 동반 가능 장소가 수집되어 있습니다. 각 카드에는 상호·주소·연락처와 함께 관광공사가 제공하는 동반 유의사항(목줄·배변·크기 제한 등)을 본문에 풀어 써 SEO 품질을 높입니다.`,
    `썸네일 이미지는 tong.visitkorea.or.kr 등 원본 URL만 DB에 텍스트로 캐시하며, Next.js Image로 지연 로딩·포맷 최적화를 적용합니다. 파일 자체를 서버에 저장하지 않습니다.`,
  ].join("\n\n");
}

export function buildTravelDetailSeo(p: PetTravelPlace): string {
  const region = [p.sido, p.sigungu].filter(Boolean).join(" ") || "전국";
  const addr = [p.address, p.address_detail].filter(Boolean).join(" ") || "주소 미상";
  return [
    `${p.title}은(는) ${region}의 반려동물 동반 가능 장소입니다. 안내 주소는 ${addr}, 연락처는 ${p.tel || "미등록"}입니다. ${SITE.name}는 한국관광공사 반려동물 동반여행 데이터를 SSR로 제공해 검색 엔진이 상호·주소·에티켓 문구를 텍스트로 수집할 수 있게 합니다.`,
    `동반 관련 안내: ${p.pet_info || "상세 동반 조건은 장소 측에 확인해 주세요."} 유의사항: ${p.pet_rule || "목줄·배변봉투 등 기본 에티켓을 지켜 주세요."}`,
    `${p.overview ? p.overview.replace(/<[^>]+>/g, " ").slice(0, 500) : `${p.title}에 대한 추가 소개는 관광공사 원문과 현장 안내에 따릅니다.`} 이미지는 원본 URL만 참조하며, ${SITE.name}는 정보 안내 포털로서 예약·이용 품질을 보증하지 않습니다.`,
  ].join("\n\n");
}
