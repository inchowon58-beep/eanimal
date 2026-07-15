import type { RescuedAnimal } from "@/lib/rescues/types";
import {
  formatHappenDt,
  neuterLabel,
  sexLabel,
} from "@/lib/rescues/types";
import { hashSeed, seededPick } from "@/lib/seo/variation";

export function buildRescueListSeo(opts: {
  sido?: string;
  total: number;
}): string {
  const region = opts.sido || "전국";
  const n = opts.total.toLocaleString("ko-KR");
  return [
    `${region}의 유실·유기동물(구조동물) 공고를 한곳에서 확인할 수 있는 페이지입니다. 지방자치단체와 동물보호센터가 등록한 구조 기록을 모아, 각 동물의 발견 장소·발견일·품종·성별·특징을 함께 안내합니다.`,
    `현재 ${region} 조건에서 확인 가능한 구조동물 공고는 약 ${n}건입니다. 공고 내용은 보호센터 상황에 따라 수시로 바뀌므로, 방문이나 입양 문의 전에는 해당 보호소 연락처로 현재 상태를 한 번 더 확인해 주세요.`,
    `"${region} 유기견 보호소", "${region} 강아지 입양", "우리 동네 유기동물 공고"처럼 지역·품종·상황이 섞인 검색으로 들어오는 분들을 위해 공고별 세부 정보를 정리했습니다. 입양이나 임시보호를 고려하고 있다면 아래 목록과 지역별 보호소 정보를 함께 살펴보시길 권합니다.`,
  ].join("\n\n");
}

export function buildRescueDetailSeo(a: RescuedAnimal): string {
  const when = formatHappenDt(a.happen_dt);
  const place = a.happen_place || "발견 장소 미상";
  const kind = a.kind_cd || "품종 미상";
  const sex = sexLabel(a.sex_cd);
  const neuter = neuterLabel(a.neuter_yn);
  const mark = a.special_mark && a.special_mark !== "없음" ? a.special_mark : null;
  const care = a.care_nm || "관할 보호센터";
  const careAddr = a.care_addr || "보호소 주소 별도 확인";
  const careTel = a.care_tel || "보호소 연락처 미등록";
  const region = [a.sido, a.sigungu].filter(Boolean).join(" ") || "전국";
  const period =
    a.notice_sdt || a.notice_edt
      ? `${a.notice_sdt || "?"} ~ ${a.notice_edt || "?"}`
      : "공고 기간 별도 확인";
  const ageWeight = [a.age, a.weight].filter(Boolean).join(", ");
  const state = a.process_state || "보호 중";
  const seed = hashSeed(a.desertion_no || `${kind}${when}${place}`);

  const p1 = [
    `${when} ${region} ${place} 인근에서 발견된 ${kind}의 구조 공고입니다. 현재 ${care}에서 "${state}" 상태로 관리되고 있으며, 유기번호 ${a.desertion_no}로 조회할 수 있습니다.`,
    `이 공고는 ${region}에서 구조된 ${kind}의 보호 기록입니다. ${when} ${place} 부근에서 발견되어 ${care}로 인계되었고, 현재 상태는 "${state}"으로 확인됩니다. (유기번호 ${a.desertion_no})`,
    `${care}에서 보호 중인 ${kind} 공고입니다. ${when} ${region} ${place}에서 구조되었으며, 원래 보호자를 찾거나 새로운 가족(입양)을 기다리고 있습니다.`,
  ];
  const p2 = [
    `성별은 ${sex}, ${neuter} 상태이며,${ageWeight ? ` 추정 나이·체중은 ${ageWeight}입니다.` : " 나이·체중 정보는 확인되지 않았습니다."}${mark ? ` 외형 특징으로는 "${mark}"이(가) 안내되어 있습니다.` : ""}`,
    `${sex}이고 ${neuter} 상태로 기록되어 있습니다.${mark ? ` 특징은 "${mark}"입니다.` : " 별도의 외형 특징은 기재되어 있지 않습니다."}${ageWeight ? ` 나이·체중은 ${ageWeight} 정도로 안내됩니다.` : ""}`,
  ];
  const p3 = [
    `공고 기간은 ${period}이며, 방문·입양·임시보호 문의는 ${care}로 하시면 됩니다. 보호소 위치는 ${careAddr}, 연락처는 ${careTel}입니다.`,
    `입양·임시보호 또는 보호자 반환을 원하실 경우 공고 기간(${period}) 안에 ${care}(${careAddr}, ${careTel})로 문의해 주세요.`,
  ];
  const p4 = [
    `공고 정보는 보호소 사정에 따라 수시로 바뀔 수 있으므로, 이동 전 연락처로 보호 여부와 건강 상태를 다시 확인하시길 권장합니다.`,
    `구조동물의 상태와 공고 여부는 실시간으로 변동될 수 있습니다. 방문 전 반드시 보호소에 전화해 현재 상황을 확인해 주세요.`,
  ];

  return [
    seededPick(p1, seed),
    seededPick(p2, seed >> 3),
    seededPick(p3, seed >> 6),
    seededPick(p4, seed >> 9),
  ].join("\n\n");
}
