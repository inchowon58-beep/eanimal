import { getCategory } from "@/lib/seo-pages/categories";
import { SITE } from "@/lib/site";
import type { BaseSeoFaq, BaseSeoInsert, BaseSeoSection } from "./types";

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

/** 키워드에서 지역 힌트(앞 토큰) 추정 */
export function guessRegionLabel(keyword: string): string {
  const parts = keyword.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return "전국";
  return parts[0];
}

function asciiSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/gi, "-")
    .replace(/[가-힣]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function buildBaseSeoSlug(keyword: string, category: string): string {
  const base = asciiSlug(keyword) || `info-${hash(keyword).toString(36)}`;
  const cat = asciiSlug(category).slice(0, 12) || "base";
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}-${cat}-${rand}`.replace(/-+/g, "-").replace(/^-|-$/g, "");
}

type CatPack = {
  kickers: string[];
  subtitles: string[];
  titleTpl: string[];
  h1Tpl: string[];
  descTpl: string[];
  sectionBuilders: ((kw: string, region: string, seed: number) => BaseSeoSection)[];
  faqBuilders: ((kw: string, region: string) => BaseSeoFaq)[];
  keywordsExtra: string[];
};

const PACKS: Record<string, CatPack> = {
  shelter: {
    kickers: ["책임 있는 보호 안내", "파양·입양 전 체크", "지역 보호 정보"],
    subtitles: [
      "유기 대신 상담으로 새 가정을 찾는 길",
      "비용·환경·절차를 먼저 확인하세요",
      "보호자와 아이 모두를 위한 안내",
    ],
    titleTpl: [
      "{kw} 안내 · 절차·비용·보호환경 체크리스트",
      "{kw} | {region} 기준 파양·입양 전 확인사항",
      "{kw} — 신중한 결정을 돕는 {site} 가이드",
    ],
    h1Tpl: [
      "{kw}, 유기 전에 확인해야 할 것",
      "{region} {kw} 상담 전 핵심 포인트",
      "{kw} 정보와 안전한 다음 단계",
    ],
    descTpl: [
      "{kw} 정보를 {region} 기준으로 정리했습니다. 입소·보호 환경·비용 항목을 비교한 뒤 상담하세요. {site}.",
      "{kw} — 파양·무료분양 전 절차와 주의사항을 안내합니다. {region} 인근도 함께 확인하세요.",
    ],
    sectionBuilders: [
      (kw, region) => ({
        h2: `${kw}를 찾기 전에`,
        paragraphs: [
          `${region}에서 ${kw}를 검색 중이라면, 급한 결정보다 아이 상태·접종·중성화 이력을 먼저 정리하는 것이 좋습니다.`,
          `사설 보호·위탁은 운영비 구조가 달라 비용이 발생할 수 있습니다. ‘싸다/비싸다’보다 포함 항목과 보호 환경을 확인하세요.`,
          `${SITE.name}는 지역 보호 정보와 상담 창구를 연결해, 유기 대신 새 가정을 찾는 선택을 돕습니다.`,
        ],
      }),
      (kw, region) => ({
        h2: `${region}에서 확인할 체크리스트`,
        paragraphs: [
          `상담 전 확인: 입소 가능 여부, 보호 공간, 의료 케어, 재분양(입양) 절차, 연락 응대 품질.`,
          `${kw} 문의 시 아이 나이·성격·특이사항을 정확히 전달하면 매칭·보호 판단이 빨라집니다.`,
          `뉴스에 보도된 부실 운영 사례도 있으므로, 방문·통화로 환경을 직접 확인하는 편이 안전합니다.`,
        ],
      }),
      (kw) => ({
        h2: `${kw} 이후 흐름`,
        paragraphs: [
          `상담 → 서류·상태 확인 → 보호/위탁 → 입양 공고의 순으로 진행되는 경우가 많습니다.`,
          `아래 FAQ와 상담 접수를 활용해 ${SITE.name}에 상황을 남겨 주시면 안내를 도와드립니다.`,
        ],
      }),
    ],
    faqBuilders: [
      (kw, region) => ({
        question: `${kw} 상담은 어떻게 시작하나요?`,
        answer: `${region} 기준으로 아이 상태와 일정을 정리한 뒤, 보호·위탁 상담 창구 또는 ${SITE.name} 문의 폼으로 연락하면 됩니다.`,
      }),
      (kw) => ({
        question: `${kw}에 비용이 드나요?`,
        answer: `보호·의료·케어 운영비가 들어가는 경우 입소·위탁 비용이 발생할 수 있습니다. 항목별 설명을 요구하세요.`,
      }),
      (kw) => ({
        question: `유기 대신 ${kw}를 선택해야 하는 이유는?`,
        answer: `유기는 아이와 지역 모두에 큰 위험이 됩니다. 상담을 통해 안전한 보호·입양으로 연결하는 것이 바람직합니다.`,
      }),
    ],
    keywordsExtra: ["강아지파양", "유기견입양", "무료분양", "보호소상담"],
  },
  adopt: {
    kickers: ["분양 전 가이드", "입양 준비 체크", "책임 분양 안내"],
    subtitles: ["건강·환경·준비가 갖춰진 분양", "충동 구매 대신 체크리스트", "아이와 가정을 위한 안내"],
    titleTpl: ["{kw} 가이드 · 준비물·건강·환경 체크", "{kw} | {region} 분양·입양 전 확인사항"],
    h1Tpl: ["{kw}, 분양 전 꼭 확인할 점", "{region} {kw} 안내"],
    descTpl: ["{kw} 정보를 정리했습니다. 건강·접종·사육환경·준비물을 확인한 뒤 결정하세요. {site}."],
    sectionBuilders: [
      (kw, region) => ({
        h2: `${kw} 준비`,
        paragraphs: [
          `${region}에서 ${kw}를 알아볼 때 예방접종·기생충·성격·사육 환경을 함께 확인하세요.`,
          `초기 적응 기간의 사료·배변·산책 루틴을 미리 계획하면 실패를 줄일 수 있습니다.`,
        ],
      }),
      (kw) => ({
        h2: `${kw} 시 질문 리스트`,
        paragraphs: [
          `부모견 건강, 접종 기록, 중성화 여부, 환불·재입양 정책, 초기 케어 지원 여부를 문의하세요.`,
          `${SITE.name} 상담 접수로도 지역·견종 질문을 남길 수 있습니다.`,
        ],
      }),
    ],
    faqBuilders: [
      (kw) => ({
        question: `${kw} 전 필수 준비물은?`,
        answer: `사료, 식기, 배변패드, 목줄·하네스, 이동장, 기본 예방접종 일정을 준비하세요.`,
      }),
      (kw) => ({
        question: `${kw} 후 병원은 언제 가나요?`,
        answer: `입양·분양 직후 건강검진과 접종 스케줄을 동물병원에서 확인하는 것이 좋습니다.`,
      }),
    ],
    keywordsExtra: ["강아지입양", "애견분양", "분양준비"],
  },
  hospital: {
    kickers: ["진료 전 안내", "병원 선택 포인트", "응급·예방 정보"],
    subtitles: ["증상·예방접종·응급실 기준", "지역 병원 정보를 차분히", "보호자를 위한 체크리스트"],
    titleTpl: ["{kw} 안내 · 진료 전 확인사항", "{kw} | {region} 동물병원 정보 가이드"],
    h1Tpl: ["{kw} 방문 전 알아둘 점", "{region} {kw} 정보"],
    descTpl: ["{kw} 관련 진료·예방·응급 포인트를 정리했습니다. {region} 기준으로 참고하세요. {site}."],
    sectionBuilders: [
      (kw, region) => ({
        h2: `${kw} 선택 기준`,
        paragraphs: [
          `${region} ${kw}를 고를 때 진료과목, 야간·응급 여부, 예약 방식, 후기보다 실제 응대를 확인하세요.`,
          `증상·체온·식욕·배변 변화를 메모해 두면 초진이 빨라집니다.`,
        ],
      }),
      (kw) => ({
        h2: `${kw}와 예방 관리`,
        paragraphs: [
          `정기 접종·심장사상충·스케일링 주기를 병원과 맞춰 관리하세요.`,
          `${SITE.name}에서 지역 병원 목록도 함께 확인할 수 있습니다.`,
        ],
      }),
    ],
    faqBuilders: [
      (kw) => ({
        question: `${kw} 응급 상황은?`,
        answer: `호흡곤란, 경련, 지속 구토·설사, 외상 출혈 시 즉시 응급 가능한 병원을 찾으세요.`,
      }),
      (kw) => ({
        question: `초진 시 무엇을 가져가나요?`,
        answer: `접종수첩, 최근 사료·약 정보, 증상 시작 시점 메모를 가져가면 도움이 됩니다.`,
      }),
    ],
    keywordsExtra: ["24시동물병원", "예방접종", "강아지병원"],
  },
  funeral: {
    kickers: ["장묘 안내", "이별 준비", "절차·비용 체크"],
    subtitles: ["존엄한 이별을 위한 정보", "화장·봉안·추모 선택", "보호자를 위한 안내"],
    titleTpl: ["{kw} 안내 · 절차와 준비", "{kw} | {region} 반려동물 장묘 가이드"],
    h1Tpl: ["{kw}, 차분히 확인하는 절차", "{region} {kw} 정보"],
    descTpl: ["{kw} 절차·준비물·비용 확인 포인트를 정리했습니다. {site}."],
    sectionBuilders: [
      (kw, region) => ({
        h2: `${kw} 진행 순서`,
        paragraphs: [
          `${region}에서 ${kw}를 알아볼 때 이동, 화장, 유골 수습, 봉안·산골 여부를 먼저 확인하세요.`,
          `급할수록 항목별 견적을 문서로 받아 비교하는 것이 좋습니다.`,
        ],
      }),
      (kw) => ({
        h2: `${kw} 상담 시 질문`,
        paragraphs: [
          `대기 시간, 동행 가능 여부, 유골함 선택, 추모 공간, 추가 비용을 문의하세요.`,
          `${SITE.name} 상담으로도 지역·일정 질문을 남길 수 있습니다.`,
        ],
      }),
    ],
    faqBuilders: [
      (kw) => ({
        question: `${kw} 예약은 필수인가요?`,
        answer: `대부분 예약이 필요합니다. 이동·대기 시간을 미리 확인하세요.`,
      }),
      (kw) => ({
        question: `비용에 포함되는 항목은?`,
        answer: `업체마다 다릅니다. 화장·유골함·차량·추모용품을 구분해 확인하세요.`,
      }),
    ],
    keywordsExtra: ["반려동물화장", "애견장례", "유골함"],
  },
  cafe: {
    kickers: ["동반 카페 안내", "방문 전 매너", "지역 추천 포인트"],
    subtitles: ["아이와 함께하는 카페 팁", "예약·매너·시설 체크", "편안한 외출을 위해"],
    titleTpl: ["{kw} 가이드 · 매너와 시설 체크", "{kw} | {region} 애견동반 카페 정보"],
    h1Tpl: ["{kw} 방문 전 체크리스트", "{region} {kw} 안내"],
    descTpl: ["{kw} 이용 시 매너·예약·시설 확인 포인트를 정리했습니다. {site}."],
    sectionBuilders: [
      (kw, region) => ({
        h2: `${kw} 이용 팁`,
        paragraphs: [
          `${region} ${kw}는 대형견 가능 여부, 실내·야외 구분, 예약 필요 여부를 먼저 확인하세요.`,
          `배변 봉투·물그릇·목줄을 준비하고, 다른 손님·동물과의 거리를 지켜 주세요.`,
        ],
      }),
    ],
    faqBuilders: [
      (kw) => ({
        question: `${kw}에 예방접종 증명이 필요한가요?`,
        answer: `매장 정책에 따릅니다. 방문 전 문의하는 것이 안전합니다.`,
      }),
    ],
    keywordsExtra: ["애견동반", "강아지카페", "대형견카페"],
  },
  pharmacy: {
    kickers: ["동물약국 안내", "구매 전 확인", "복약 주의"],
    subtitles: ["처방전·상담이 중요한 이유", "영양제·의약품 선택", "안전한 복약 관리"],
    titleTpl: ["{kw} 안내 · 구매·복약 체크", "{kw} | {region} 동물약국 가이드"],
    h1Tpl: ["{kw}에서 확인할 점", "{region} {kw} 정보"],
    descTpl: ["{kw} 이용 시 처방·복약·보관 주의사항을 정리했습니다. {site}."],
    sectionBuilders: [
      (kw, region) => ({
        h2: `${kw} 이용 전`,
        paragraphs: [
          `${region} ${kw}에서는 처방 필요 여부, 성분, 용량을 확인하세요.`,
          `사람약이 아닌 동물용 제품인지, 유통기한·보관법을 함께 점검합니다.`,
        ],
      }),
    ],
    faqBuilders: [
      (kw) => ({
        question: `${kw}에서 처방전 없이 살 수 있나요?`,
        answer: `제품에 따라 다릅니다. 전문의약품은 처방이 필요할 수 있습니다.`,
      }),
    ],
    keywordsExtra: ["강아지약", "영양제", "처방전"],
  },
  hotel: {
    kickers: ["호텔·펜션 안내", "맡기기 전 체크", "동반숙소 팁"],
    subtitles: ["위탁·동반 숙소 선택", "시설·케어·비상연락", "아이 스트레스 줄이기"],
    titleTpl: ["{kw} 가이드 · 시설·케어 체크", "{kw} | {region} 애견호텔·펜션 정보"],
    h1Tpl: ["{kw} 예약 전 확인사항", "{region} {kw} 안내"],
    descTpl: ["{kw} 예약 시 시설·케어·응급 대응을 확인하는 포인트를 정리했습니다. {site}."],
    sectionBuilders: [
      (kw, region) => ({
        h2: `${kw} 선택 포인트`,
        paragraphs: [
          `${region} ${kw}는 CCTV, 산책, 급여, 응급병원 연계, 중성화·접종 조건을 확인하세요.`,
          `첫 위탁은 짧은 시간부터 적응시키는 편이 좋습니다.`,
        ],
      }),
    ],
    faqBuilders: [
      (kw) => ({
        question: `${kw}에 가져갈 물건은?`,
        answer: `평소 사료, 담요, 약, 접종수첩, 비상 연락처를 준비하세요.`,
      }),
    ],
    keywordsExtra: ["강아지호텔", "애견동반펜션", "위탁"],
  },
  academy: {
    kickers: ["미용학원 안내", "수강 전 체크", "자격·실습 정보"],
    subtitles: ["커리큘럼·실습·취업 연계", "학원 선택 기준", "배움을 위한 가이드"],
    titleTpl: ["{kw} 가이드 · 커리큘럼·실습 체크", "{kw} | {region} 애견미용학원 정보"],
    h1Tpl: ["{kw} 등록 전 확인사항", "{region} {kw} 안내"],
    descTpl: ["{kw} 선택 시 커리큘럼·실습·자격 준비 포인트를 정리했습니다. {site}."],
    sectionBuilders: [
      (kw, region) => ({
        h2: `${kw} 고르는 법`,
        paragraphs: [
          `${region} ${kw}는 실습 비중, 강사 경력, 모델견 지원, 취업·창업 연계를 비교하세요.`,
          `수강료에 교재·도구·시험비가 포함되는지 확인합니다.`,
        ],
      }),
    ],
    faqBuilders: [
      (kw) => ({
        question: `${kw} 수강 기간은?`,
        answer: `과정마다 다릅니다. 평일·주말 반과 총 실습 시간을 문의하세요.`,
      }),
    ],
    keywordsExtra: ["애견미용사", "자격증", "실습"],
  },
};

const FALLBACK = PACKS.shelter;

function fill(tpl: string, kw: string, region: string): string {
  return tpl
    .replace(/\{kw\}/g, kw)
    .replace(/\{region\}/g, region)
    .replace(/\{site\}/g, SITE.name);
}

/**
 * 카테고리 기본 양식 기반 템플릿 생성 (Gemini 없음).
 * 키워드 해시로 문장·제목을 소폭 변형해 대량 발행에도 중복감을 줄입니다.
 */
export function generateBaseSeoContent(input: {
  keyword: string;
  category: string;
  publishSource?: "web" | "local";
  imageUrl?: string | null;
}): BaseSeoInsert {
  const keyword = input.keyword.trim();
  const category = input.category.trim() || "shelter";
  const catDef = getCategory(category);
  const pack = PACKS[category] || FALLBACK;
  const region = guessRegionLabel(keyword);
  const seed = hash(`${keyword}|${category}|${SITE.name}`);
  const source = input.publishSource || "web";

  const title = fill(pick(pack.titleTpl, seed), keyword, region);
  const h1 = fill(pick(pack.h1Tpl, seed + 1), keyword, region);
  let description = fill(pick(pack.descTpl, seed + 2), keyword, region);
  if (description.length > 145) description = description.slice(0, 142) + "…";
  if (description.length < 80) {
    description = `${keyword} 관련 안내 — ${SITE.name}에서 ${region} 기준으로 절차와 확인 포인트를 정리했습니다.`;
  }

  const sections = pack.sectionBuilders.map((b, i) => b(keyword, region, seed + i));
  // 소폭 변형
  if (seed % 2 === 1 && sections[0]?.paragraphs[0]) {
    sections[0].paragraphs[0] = sections[0].paragraphs[0].replace("확인", "점검");
  }

  const faqs = pack.faqBuilders.map((b) => b(keyword, region));
  const metaKeywords = Array.from(
    new Set([
      keyword,
      region,
      catDef?.label || category,
      ...pack.keywordsExtra,
      ...(catDef?.genericTags || []).slice(0, 4),
      SITE.name,
    ])
  );

  return {
    slug: buildBaseSeoSlug(keyword, category),
    keyword,
    category,
    region_label: region === "전국" ? null : region,
    title,
    h1,
    description,
    meta_keywords: metaKeywords,
    hero_kicker: pick(pack.kickers, seed),
    hero_subtitle: pick(pack.subtitles, seed + 3),
    sections,
    faqs,
    cta_text: `${SITE.name} ${catDef?.label || ""} 상담 문의`.trim(),
    image_url: input.imageUrl || null,
    publish_source: source,
  };
}
