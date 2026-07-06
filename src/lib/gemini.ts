import type { SiteConfig } from "./site-config-types";
import type { SeoFaq } from "./data";
import {
  buildSeoCorePhrase,
  extractServicePhrase,
  generateVariedSeoTitle,
  normalizeSeoKeyword,
  polishSeoHtmlContent,
  polishSeoText,
  extractRegionForKeyword,
} from "./seo-keyword";

interface GenerateOptions {
  keyword: string;
  apiKey: string;
  site: SiteConfig;
}

export interface GeneratedSeoContent {
  title: string;
  description: string;
  content: string;
  slug?: string;
  faqs: SeoFaq[];
}

const CONTENT_RULES = `
작성 조건:
- 키워드를 자연스럽게 본문 전체에 5~8회 포함
- 업체명·전화번호는 반드시 {{brandName}}, {{phone}} 등 토큰으로만 표기 (직접 입력 금지)
- 애견미용학원, 애견미용사·애견미용관리사 자격증, 펫그루밍 교육 관점으로 작성
- 신뢰감 있는 전문가 톤, 허위·과장 금지
- h2, h3, p, ul 태그만 사용 (img 태그 직접 사용 금지)
- 본문 순수 텍스트 기준 **2800자 이상** (짧으면 안 됨)
- h2 섹션 **최소 5개**, 각 섹션마다 p 2~3문단 또는 ul 목록 포함
- 이미지는 시스템에서 본문에 자동 삽입되므로 img 태그·이미지 플레이스홀더 사용 금지
- 다른 SEO 페이지와 문장·사례·섹션 순서가 겹치지 않게 작성
- 자주 묻는 질문(FAQ) 3개: 키워드와 관련된 실질적 질문과 답변 (답변 2문장 이상, 토큰 사용)
- 제목: 지역명을 두 번 반복하지 말 것 (예: "강남 강남애견미용학원" 금지)
- 제목: "저렴한 학원", "추천 학원" 같은 뻔한 문구만 반복하지 말고, 키워드·지역·과정 특성이 드러나게 매번 다른 표현 사용
- 제목: 다른 페이지와 같은 패턴·같은 문장 구조 금지
- 제목: {{brandName}}·상호명은 제목에 넣지 말 것 (시스템이 자동 추가)
- 제목: 반드시 지역명 1회 포함 (지역 맥락이 있을 때)
- 본문 h2/h3: 지역명 2회 연속 금지
`;

const WRITING_ANGLES = [
  "수강생 입장에서 자격증·실습·취업 목표를 중심으로",
  "창업 준비자 관점에서 커리큘럼·실습 환경·창업 연계를 중심으로",
  "직장인·주부 등 시간대별 수업(주말·야간) 선택을 중심으로",
  "애견미용사와 애견미용관리사 과정 차이와 진로를 중심으로",
  "수강료·실습 비율·1:1 지도 여부 등 학원 비교 포인트를 중심으로",
  "지역별 학원 특성과 통학·실습 일정을 중심으로",
];

const TITLE_STYLE_HINTS = [
  "자격증·실습 과정 강조형",
  "학원 비교·맞춤 추천형",
  "창업·취업 연계형",
  "수강료·커리큘럼 안내형",
  "지역 특화 학원 정보형",
  "기초·실무 단계별 안내형",
  "펫그루밍·미용 실무형",
];

function hashKeyword(keyword: string): number {
  let hash = 0;
  for (let i = 0; i < keyword.length; i++) {
    hash = (hash << 5) - hash + keyword.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickAngle(keyword: string): string {
  const idx = hashKeyword(keyword) % WRITING_ANGLES.length;
  return WRITING_ANGLES[idx];
}

export async function generateSeoContent({
  keyword: rawKeyword,
  apiKey,
  site,
}: GenerateOptions): Promise<GeneratedSeoContent> {
  const keyword = normalizeSeoKeyword(rawKeyword);
  const corePhrase = buildSeoCorePhrase(keyword);

  if (!apiKey) {
    return generateFallbackContent(keyword, site);
  }

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const region = extractRegionForKeyword(keyword);
  const angle = pickAngle(keyword);
  const uniqueSeed = `${keyword}-${hashKeyword(keyword)}`;
  const titleStyleHint =
    TITLE_STYLE_HINTS[hashKeyword(keyword + "style") % TITLE_STYLE_HINTS.length];

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 1.1,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  });

  const prompt = `당신은 애견미용학원·펫그루밍 SEO 전문 작가입니다. 네이버 검색 최적화를 고려하여 한국어 HTML 콘텐츠를 작성하세요.

사이트 정보 (본문에 아래 토큰을 그대로 사용하세요):
- 상호: {{brandName}} ({{companyName}})
- 연락처: {{phone}}
- 과정: {{supportBase}}, {{supportExtra}}, 전국 {{supportMax}} 정보
- 특징: 검증된 학원 정보, 무료 학원 상담·매칭, 자격증·실습·창업 과정 안내, 학원 등록·제휴

키워드: "${corePhrase}"
(원본 입력: "${keyword}" — 지역명은 한 번만 사용)
${region ? `지역 맥락: ${region} 지역 애견미용학원·교육 (제목·본문에 "${region} ${region}"처럼 두 번 쓰지 말 것)` : ""}
제목 작성 스타일: ${titleStyleHint}
작성 관점: ${angle}
고유 시드(다른 글과 중복 금지): ${uniqueSeed}

중요: 이전에 작성한 다른 키워드 페이지와 동일한 문장·구조·사례·제목 패턴을 재사용하지 마세요. 키워드와 지역에 맞는 구체적인 상황을 새로 작성하세요.
${CONTENT_RULES}

JSON 형식으로만 응답:
{
  "title": "55자 이내 SEO 제목 — 지역 1회, 상호명·| 구분자 없이, 매번 다른 문장 구조",
  "description": "150자 이내 메타 설명 (토큰 사용 가능)",
  "slug": "영문 소문자 URL slug",
  "content": "HTML 본문",
  "faqs": [
    { "question": "질문1", "answer": "답변1" },
    { "question": "질문2", "answer": "답변2" },
    { "question": "질문3", "answer": "답변3" }
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid response");

    const parsed = JSON.parse(jsonMatch[0]) as {
      title: string;
      description: string;
      content: string;
      slug?: string;
      faqs?: SeoFaq[];
    };

    if (!parsed.content || parsed.content.length < 800) {
      throw new Error("Content too short");
    }

    return {
      title: generateVariedSeoTitle(keyword, region, parsed.title),
      description: polishSeoText(parsed.description, region),
      content: polishSeoHtmlContent(parsed.content, keyword),
      slug: parsed.slug,
      faqs: normalizeFaqs(parsed.faqs, keyword, site),
    };
  } catch {
    return generateFallbackContent(keyword, site);
  }
}

function normalizeFaqs(
  faqs: SeoFaq[] | undefined,
  keyword: string,
  site: SiteConfig
): SeoFaq[] {
  const valid = (faqs || []).filter((f) => f.question?.trim() && f.answer?.trim());
  if (valid.length >= 3) return valid.slice(0, 3);
  return buildDefaultFaqs(keyword, site);
}

export function buildDefaultFaqs(keyword: string, site: SiteConfig): SeoFaq[] {
  const region = extractRegionForKeyword(keyword);
  const regionNote = region ? `${region} 지역 ` : "";

  const faqSets: SeoFaq[][] = [
    [
      {
        question: `${keyword} 수강료는 어떻게 되나요?`,
        answer: `과정(기초·자격증·창업), 수업 형태(1:1·그룹), 실습 비율에 따라 달라집니다. {{brandName}}은 무료 상담을 통해 목표에 맞는 학원을 비교·추천하며, {{supportBase}}·{{supportExtra}} 과정별 안내를 제공합니다.`,
      },
      {
        question: `${keyword}에서 애견미용사 자격증을 취득할 수 있나요?`,
        answer: `네. {{brandName}}은 국가자격 대비 과정을 운영하는 학원 정보를 제공합니다. 검증된 정보를 바탕으로 신뢰할 수 있는 학원을 안내하며, {{phone}}로 상담 가능합니다.`,
      },
      {
        question: `${keyword} 상담은 어떻게 하나요?`,
        answer: `전화 {{phone}}로 상담 후 목표(자격증·창업·취업)와 희망 지역을 알려주시면 맞춤 학원 정보를 안내해 드립니다. 학원 등록 요청·제휴 문의도 같은 번호로 받습니다.`,
      },
    ],
    [
      {
        question: `${regionNote}${keyword} 추천 기준이 있나요?`,
        answer: `{{brandName}}은 실습 환경, 강사 경력, 자격증 합격률, 수강료 투명성 등을 기준으로 학원을 비교합니다. 신뢰할 수 있는 정보 포털로 안내해 드립니다.`,
      },
      {
        question: `${keyword} 수업 기간은 얼마나 걸리나요?`,
        answer: `기초 과정은 4~8주, 자격증 대비 과정은 3~6개월, 창업·실무 과정은 학원마다 다릅니다. {{phone}} 상담 시 일정에 맞는 학원을 추천해 드립니다.`,
      },
      {
        question: `주말·야간 수업도 가능한가요?`,
        answer: `직장인·주부 수강생을 위해 주말반·야간반을 운영하는 학원 정보를 별도로 안내합니다. {{brandName}} 상담 시 희망 시간대를 알려주시면 됩니다.`,
      },
    ],
    [
      {
        question: `${keyword} 창업 연계 과정이 있나요?`,
        answer: `창업·취업 연계 커리큘럼을 운영하는 학원을 {{brandName}}에서 비교할 수 있습니다. 실습 후 샵 오픈 컨설팅·취업 연결까지 지원하는 곳도 있습니다.`,
      },
      {
        question: `애견미용사와 애견미용관리사 차이는 무엇인가요?`,
        answer: `애견미용사는 미용 실무·자격증 중심, 애견미용관리사는 반려견 관리·위생·행동 이해 등 종합 관리 역량을 다룹니다. {{brandName}}이 목표에 맞는 과정을 안내합니다.`,
      },
      {
        question: `학원 정보 등록은 어떻게 하나요?`,
        answer: `애견미용학원 운영자는 {{phone}}로 학원정보 등록요청·제휴문의를 하실 수 있습니다. {{brandName}}은 전국 {{supportMax}} 정보를 제공합니다.`,
      },
    ],
  ];

  const idx = hashKeyword(keyword) % faqSets.length;
  return faqSets[idx];
}

type FallbackBuilder = (keyword: string, region: string | null) => string;

const FALLBACK_VARIANTS: FallbackBuilder[] = [
  (keyword, region) => {
    const core = buildSeoCorePhrase(keyword);
    return `
<h2>${core} — {{brandName}} 맞춤 안내</h2>
<p>{{companyName}} {{brandName}}은 ${region ? `${region}을 포함한 ` : ""}전국 애견미용학원 정보를 제공하며, ${core} 관련 문의가 많은 편입니다. 학원마다 실습 비율, 자격증 과정, 수강료 구성이 달라 동일 기간이라도 커리큘럼 차이가 큽니다.</p>
<p>{{brandName}} 정보 포털로, {{phone}} 상담을 통해 목표에 맞는 학원을 비교·추천해 드립니다.</p>
{{image1}}

<h2>${keyword} 학원 선택 시 확인할 항목</h2>
<p>실습 장비·모델견 제공, 1:1 지도 비율, 자격증 합격률, 졸업 후 창업·취업 연계 여부가 중요합니다. ${region || "해당"} 지역은 학원 밀집도와 교통 접근성도 함께 고려하세요.</p>
<p>{{brandName}}은 항목별로 학원을 비교해 숨은 비용·과장 광고를 줄이는 데 도움을 드립니다.</p>
<ul>
<li>과정: {{supportBase}}, {{supportExtra}}, 창업·실무</li>
<li>수업: 주간·주말·야간, 1:1·그룹</li>
<li>실습: 모델견·장비·실습 시간</li>
</ul>

<h2>자격증 과정 안내</h2>
<p>애견미용사·애견미용관리사 국가자격 대비 과정은 학원마다 커리큘럼과 기간이 다릅니다. ${region ? `${region} ` : ""}지역에서 수강 시 통학·실습 일정을 미리 확인하는 것이 좋습니다.</p>
<p>{{brandName}}은 {{supportBase}}·{{supportExtra}} 과정별 특징을 정리해 드립니다.</p>
{{image2}}

<h2>${keyword} 상담·등록 절차</h2>
<ul>
<li>1단계: 전화 상담 — 목표·지역·희망 일정 확인</li>
<li>2단계: 학원 비교 — 과정·수강료·실습 환경 안내</li>
<li>3단계: 맞춤 추천 — {{brandName}} 검증 학원 연결</li>
<li>4단계: 수강·등록 — 학원과 직접 일정 조율</li>
</ul>
<p>학원 운영자는 학원정보 등록요청·제휴문의도 {{phone}}로 가능합니다.</p>

<h2>신뢰할 수 있는 정보</h2>
<p>반려견 미용 교육 시장은 정보의 질이 수강 결과에 큰 영향을 줍니다. {{brandName}}은 신뢰할 수 있는 학원 정보만 제공합니다.</p>
<p>과장된 합격률·저렴한 수강료만 내세우는 학원보다, 실습 환경과 커리큘럼을 투명히 공개하는 곳을 권합니다.</p>
{{image3}}

<h2>문의 안내</h2>
<p>${keyword} 관련 상담은 {{phone}} · {{brandName}}. ${region || "전국"} 학원 정보를 기준으로 맞춤 안내해 드립니다.</p>`.trim();
  },

  (keyword, region) => {
    const core = buildSeoCorePhrase(keyword);
    const loc = region ? `${region} ` : "";
    return `
<h2>${core} — 수강생이 자주 묻는 질문</h2>
<p>애견미용을 처음 배우는 분들은 "얼마나 걸리나", "자격증이 필요한가"를 가장 많이 묻습니다. {{brandName}}은 {{phone}} 상담 시 이 두 가지를 먼저 정리해 드립니다.</p>
<p>{{companyName}}은 기초·자격증·창업 과정별 학원 정보를 제공하며, ${keyword} 키워드로 찾으신 분들께 맞춤 안내를 합니다.</p>
{{image1}}

<h2>과정별 ${keyword} 차이</h2>
<p>기초반은 빗질·목욕·기본 컷부터, 자격증반은 국가시험 대비 실습 중심, 창업반은 샵 운영·고객 응대까지 다룹니다.</p>
<p>${loc}지역 특성을 반영해 통학·실습 일정에 맞는 학원을 추천합니다.</p>

<h2>학원 비교 포인트</h2>
<ul>
<li>실습 시간·모델견 제공 여부</li>
<li>{{supportBase}}·{{supportExtra}} 과정 운영</li>
<li>수강료·재료비·시험비 투명성</li>
<li>졸업 후 창업·취업 연계</li>
</ul>
{{image2}}

<h2>신뢰할 수 있는 학원 정보</h2>
<p>반려견 복지와 올바른 미용 교육을 제공하는 학원을 우선 안내합니다.</p>
<p>{{brandName}}은 {{phone}}으로 학원 등록·제휴·수강 상담을 받습니다.</p>

<h2>지금 상담 받기</h2>
<p>무료 학원 상담 {{phone}} · {{brandName}}. ${loc} 및 인근 지역 학원 정보도 문의 환영합니다.</p>`.trim();
  },

  (keyword, region) => {
    const core = buildSeoCorePhrase(keyword);
    return `
<h2>{{brandName}}이 ${core}를 다루는 방식</h2>
<p>애견미용학원 선택은 단순 가격 비교가 아니라 자격·실습·진로까지 연결된 결정입니다. {{companyName}}은 커리큘럼과 실습 환경을 기준으로 투명한 정보를 제공합니다.</p>
<p>키워드 ${keyword}로 검색하신 분들께는 목표, 지역, 희망 수업 시간 세 가지를 먼저 확인한 뒤 맞춤 안내를 드립니다.</p>
{{image1}}

<h2>학원 정보에 꼭 들어가야 할 항목</h2>
<ul>
<li>과정명·수강 기간·수업 시간</li>
<li>실습 비율·장비·모델견</li>
<li>자격증({{supportBase}}, {{supportExtra}}) 대비 여부</li>
<li>수강료·재료비·추가 비용</li>
<li>창업·취업 연계 프로그램</li>
</ul>
<p>{{brandName}} 안내 자료는 위 항목을 구분해 작성하므로 학원 간 비교가 수월합니다.</p>

<h2>전국 {{supportMax}} 정보</h2>
<p>{{brandName}}은 전국 애견미용학원 정보를 수집·안내합니다. 학원 등록 요청도 받고 있습니다.</p>
{{image2}}

<h2>${region || "지역"} 특성을 고려한 선택</h2>
<p>대도시는 학원 선택지가 많고, 지방은 통학·숙박·실습 일정을 함께 검토해야 합니다. {{phone}} 상담 시 지역별 특성을 반영해 안내합니다.</p>

<h2>지금 상담 받기</h2>
<p>${keyword} — {{brandName}} {{phone}}. 무료 학원 상담과 등록·제휴 문의를 함께 안내해 드립니다.</p>`.trim();
  },

  (keyword, region) => {
    const core = buildSeoCorePhrase(keyword);
    const area = region ? `${region} ` : "";
    return `
<h2>${core} — 입문자를 위한 실전 가이드</h2>
<p>애견미용 학원 선택을 미루면 목표 달성 시기가 늦어질 수 있습니다. {{brandName}}은 {{phone}} 접수 후 빠르게 맞춤 학원 정보를 안내해 드립니다.</p>
<p>{{brandName}}은 신뢰할 수 있는 정보만 제공하며, 학원정보 등록요청·제휴문의도 {{phone}}로 받습니다.</p>
{{image1}}

<h2>수강 전 3가지 확인</h2>
<ul>
<li>목표: 자격증·창업·취업·취미</li>
<li>일정: 주간·주말·야간 수업 가능 여부</li>
<li>예산: 수강료·재료비·시험비 포함 총비용</li>
</ul>
<p>위 세 가지가 정리되면 ${keyword} 학원 비교가 훨씬 정확해집니다.</p>

<h2>{{supportBase}} · {{supportExtra}} 과정</h2>
<p>애견미용사는 미용 실무·자격 중심, 애견미용관리사는 반려견 관리·위생·행동 이해 등을 다룹니다. {{brandName}}과 사전 상담을 권합니다.</p>
{{image2}}

<h2>왜 {{brandName}}인가</h2>
<p>학원 정보, 과정 비교, 무료 상담, 등록·제휴를 한 곳에서 진행할 수 있습니다. {{brandName}}에서 신뢰할 수 있는 정보를 제공합니다.</p>
{{image3}}

<h2>${keyword} 무료 상담</h2>
<p>전화 {{phone}} · {{brandName}}. ${area}인근 애견미용학원 정보도 문의 환영합니다.</p>`.trim();
  },
];

function generateFallbackContent(
  keyword: string,
  site: SiteConfig
): GeneratedSeoContent {
  const region = extractRegionForKeyword(keyword);
  const variantIdx = hashKeyword(keyword) % FALLBACK_VARIANTS.length;
  const content = FALLBACK_VARIANTS[variantIdx](keyword, region);

  const titleVariants = [
    (k: string, r: string | null) => generateVariedSeoTitle(k, r),
    (k: string, r: string | null) =>
      generateVariedSeoTitle(k, r, `${extractServicePhrase(k, r)} 무료 상담`),
    (k: string, r: string | null) =>
      generateVariedSeoTitle(k, r, `${extractServicePhrase(k, r)} 맞춤 안내`),
    (k: string, r: string | null) =>
      generateVariedSeoTitle(k, r, `${extractServicePhrase(k, r)} — 과정·수강료`),
  ];
  const descVariants = [
    (k: string, r: string | null) =>
      `${buildSeoCorePhrase(k)} 무료 학원 상담, {{supportBase}}·{{supportExtra}} 과정 안내. {{brandName}} 애견미용학원 정보.`,
    (k: string, r: string | null) =>
      `${r ? `${r} ` : ""}${extractServicePhrase(k, r)} 맞춤 학원 추천. 전국 {{supportMax}}, {{brandName}}.`,
    (k: string) =>
      `{{brandName}} ${buildSeoCorePhrase(k)} — 자격증·실습·창업 과정. 전화 {{phone}} 무료 상담.`,
    (k: string) =>
      `${buildSeoCorePhrase(k)} 수강료·과정·후기 한번에. {{brandName}} 애견미용학원 정보.`,
  ];

  const tIdx = hashKeyword(keyword + "t") % titleVariants.length;
  const dIdx = hashKeyword(keyword + "d") % descVariants.length;

  return {
    title: titleVariants[tIdx](keyword, region),
    description: polishSeoText(descVariants[dIdx](keyword, region), region),
    content: polishSeoHtmlContent(content, keyword),
    faqs: buildDefaultFaqs(keyword, site),
  };
}
