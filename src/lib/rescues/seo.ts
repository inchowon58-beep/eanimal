import { SITE } from "@/lib/site";
import type { RescuedAnimal } from "@/lib/rescues/types";
import {
  formatHappenDt,
  neuterLabel,
  sexLabel,
} from "@/lib/rescues/types";

export function buildRescueListSeo(opts: {
  sido?: string;
  total: number;
}): string {
  const region = opts.sido || "전국";
  const n = opts.total.toLocaleString("ko-KR");
  return [
    `${SITE.name}는 ${region} 유실·유기동물(구조동물) 공고를 국가동물보호정보시스템 데이터를 바탕으로 정리합니다. "오늘 구조된 ${region} 유기견", "${region} 보호소 공고"처럼 지역·품종·날짜가 섞인 롱테일 검색에 대응하기 위해, 각 공고의 구조 장소·발견일·품종·특징을 텍스트로 노출합니다.`,
    `현재 ${region} 조건에서 확인 가능한 구조동물 공고는 약 ${n}건입니다. 공고는 지자체·보호센터에서 수시로 갱신되므로, 방문·입양 문의 전에는 보호소 연락처로 상태를 다시 확인해 주세요.`,
    `목록에는 품종명, 발견 장소, 공고 기간, 보호소명이 함께 표시됩니다. 이미지는 공공기관 원본 URL만 참조하며(파일 저장 없음), 페이지 본문에는 네이버·구글 로봇이 수집할 수 있는 설명 문단을 충분히 포함합니다.`,
    `${SITE.name}는 구조 공고 안내와 함께 안심 보호·분양 파트너 정보를 연결하는 포털입니다. 응급 보호가 필요하거나 입양을 고려 중이라면 하단 가이드·배너 영역도 함께 확인해 주세요.`,
  ].join("\n\n");
}

export function buildRescueDetailSeo(a: RescuedAnimal): string {
  const when = formatHappenDt(a.happen_dt);
  const place = a.happen_place || "장소 미상";
  const kind = a.kind_cd || "품종 미상";
  const sex = sexLabel(a.sex_cd);
  const neuter = neuterLabel(a.neuter_yn);
  const mark = a.special_mark || "특이사항 없음";
  const care = a.care_nm || "보호소 미상";
  const region = [a.sido, a.sigungu].filter(Boolean).join(" ") || "전국";

  return [
    `${kind} 구조동물 공고(유기번호 ${a.desertion_no})입니다. ${when} ${place}에서 발견·구조되어 ${care}에서 보호 중인 기록입니다. 성별은 ${sex}, ${neuter}이며, 특징은 "${mark}"로 안내됩니다.`,
    `${region} 유실·유기동물 공고를 찾는 이용자는 보통 발견 장소와 공고 기간(${a.notice_sdt || "?"}~${a.notice_edt || "?"}), 보호소 연락처(${a.care_tel || "미등록"})를 먼저 확인합니다. ${SITE.name}는 국가동물보호정보시스템 공개 정보를 SSR 페이지로 제공하여 검색 로봇이 본문 텍스트를 즉시 수집할 수 있게 합니다.`,
    `이미지(원본 URL)는 공공 서버를 그대로 참조하며 DB에는 주소 문자열만 저장합니다. 입양·임시보호·인수 문의는 ${care}(${a.care_addr || "주소 미상"})로 연락해 주세요. ${SITE.name}는 공고를 중개·안내하며 개별 보호 결과를 보장하지 않습니다.`,
  ].join("\n\n");
}
