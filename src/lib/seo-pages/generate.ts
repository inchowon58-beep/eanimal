import { SITE } from "@/lib/site";
import { SIDO_LIST } from "@/lib/regions";
import { SIDO_ALIASES } from "@/lib/public-data/normalize";
import type { SeoFaq } from "@/lib/seo-pages/types";

export interface GeneratedContent {
  title: string;
  description: string;
  content: string;
  faqs: SeoFaq[];
  slug?: string;
  region: string | null;
}

const MIN_BODY_CHARS = 1100;

export function normalizeKeyword(raw: string): string {
  return raw.replace(/\s+/g, " ").normalize("NFC").trim();
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** 키워드에서 지역명 추출 (시·도 풀네임/짧은표기) */
export function extractRegion(keyword: string): string | null {
  const k = keyword.replace(/\s+/g, "");
  for (const full of SIDO_LIST) {
    if (k.includes(full)) return full;
  }
  for (const [short, full] of Object.entries(SIDO_ALIASES)) {
    if (k.includes(short)) return full;
  }
  return null;
}

/** 키워드에서 지역 추정에 방해되는 일반 단어 제거 */
function stripTopicWords(keyword: string): string {
  return keyword
    .replace(/\s+/g, "")
    .replace(
      /강아지|고양이|반려견|반려묘|반려동물|유기견|유기묘|유기동물|파양|분양|입양|무료|보호소|보호센터|병원|약국|장례|장묘|카페|호텔|펜션|미용|학원|정보|추천|가격|비용|동반|여행/g,
      ""
    );
}

function matchSigunguInKeyword(
  keywordCompact: string,
  sigungu: string
): boolean {
  const first = sigungu.trim().split(/\s+/)[0];
  const stem = first.replace(/(특별자치시|특별시|광역시|자치시|시|군|구)$/, "");
  return (
    keywordCompact.includes(first) ||
    (stem.length >= 2 && keywordCompact.includes(stem))
  );
}

/**
 * 키워드에서 시·도 + 시·군·구까지 해석.
 * 1) 시·도가 키워드에 있으면 해당 시·도의 시군구 매칭
 * 2) 없으면 places의 시군구 목록에서 매칭 (예: 금산군강아지파양)
 * 3) 그래도 없으면 places 주소에서 동·읍·면 등 지명 추론 (예: 이태원동강아지파양)
 */
export async function resolveRegionDetail(
  keyword: string
): Promise<{ sido: string | null; sigungu: string | null }> {
  const k = keyword.replace(/\s+/g, "");
  const sido = extractRegion(keyword);

  try {
    const { getSupabaseServer } = await import("@/lib/supabase/server");
    const supabase = getSupabaseServer();
    if (!supabase) return { sido, sigungu: null };

    // 시·도·시군구 후보를 한 번에 가져옴
    let pairsQuery = supabase
      .from("places")
      .select("sido, sigungu")
      .eq("hidden", false)
      .not("sido", "is", null)
      .not("sigungu", "is", null)
      .limit(8000);
    if (sido) pairsQuery = pairsQuery.eq("sido", sido);

    const { data: pairs } = await pairsQuery;
    if (pairs?.length) {
      const seen = new Set<string>();
      for (const row of pairs as { sido: string; sigungu: string }[]) {
        const key = `${row.sido}|${row.sigungu}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (matchSigunguInKeyword(k, row.sigungu)) {
          return { sido: row.sido, sigungu: row.sigungu.trim().split(/\s+/)[0] };
        }
      }
    }

    if (sido) return { sido, sigungu: null };

    // 동·읍·면 등: places 주소로 추론
    const placeHint = stripTopicWords(keyword).replace(/(동|읍|면|리)$/, "");
    if (placeHint.length >= 2) {
      const { data } = await supabase
        .from("places")
        .select("sido, sigungu")
        .eq("hidden", false)
        .or(
          `address_road.ilike.%${placeHint}%,address_jibun.ilike.%${placeHint}%,sigungu.ilike.%${placeHint}%`
        )
        .not("sido", "is", null)
        .limit(1)
        .maybeSingle();
      if (data?.sido) {
        return {
          sido: data.sido as string,
          sigungu: (data.sigungu as string) || null,
        };
      }
    }
  } catch {
    /* DB 미연결 시 시·도만 */
  }
  return { sido, sigungu: null };
}

function asciiSlug(input: string | undefined): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function buildSlug(keyword: string, geminiSlug?: string): string {
  const base = asciiSlug(geminiSlug);
  const rand = Math.random().toString(36).slice(2, 7);
  if (base) return `${base}-${rand}`;
  return `p-${hash(keyword).toString(36)}-${rand}`;
}

/** 생성 HTML 경량 정화 — script/style/on 핸들러/javascript 링크 제거 */
export function sanitizeContentHtml(html: string): string {
  return html
    .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<\s*style[\s\S]*?<\s*\/\s*style\s*>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const ANGLES = [
  "기본 개념과 배경을 중심으로",
  "실질적인 준비 사항과 절차를 중심으로",
  "지역 상황과 이용 팁을 중심으로",
  "자주 하는 오해와 주의점을 중심으로",
];

async function callGemini(prompt: string, key: string): Promise<string | null> {
  const models = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55_000);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 1.05,
              topP: 0.95,
              maxOutputTokens: 4096,
              responseMimeType: "application/json",
            },
          }),
        }
      );
      if (!res.ok) continue;
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch {
      /* try next model */
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

export interface GenerateOptions {
  /** 본문에 자연스럽게 녹여 넣을 연관 키워드 (카테고리 풀에서 랜덤 추출) */
  relatedKeywords?: string[];
}

export async function generateSeoContent(
  rawKeyword: string,
  options: GenerateOptions = {}
): Promise<GeneratedContent> {
  const keyword = normalizeKeyword(rawKeyword);
  const region = extractRegion(keyword);
  const related = (options.relatedKeywords || [])
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 3);
  const key = process.env.GEMINI_API_KEY?.trim() || "";

  if (key) {
    const angle = ANGLES[hash(keyword) % ANGLES.length];
    const prompt = `당신은 반려동물 생활 정보 전문 에디터입니다. "${SITE.name}" 사이트에 올릴, 독자에게 도움이 되는 한국어 정보성 안내 문서를 HTML로 작성하세요.

키워드: "${keyword}"
${region ? `지역 맥락: ${region}` : ""}
${related.length ? `함께 다룰 연관 키워드: ${related.join(", ")}` : ""}
작성 관점: ${angle}
고유 시드: ${keyword}-${hash(keyword)}-${Date.now()}

작성 조건:
- 키워드를 본문 전체에 자연스럽게 4~6회 포함
${related.length ? `- 위 연관 키워드(${related.join(", ")})도 본문에 각각 1회 이상 자연스럽게 녹여서 포함` : ""}
- 정보성/공익적 톤. 특정 업체 홍보·과장·허위·수익보장 표현 금지
- 전화번호·주소·상호 같은 연락처 문구는 넣지 말 것
- h2 소제목 정확히 4개, 각 섹션마다 p 문단 2개 이상. 목록이 필요하면 ul 사용
- 사용 태그: h2, h3, p, ul, li 만 (img, script, style, a 금지)
- 본문 순수 텍스트(태그 제외) 1200자 이상
- "SEO", "최적화", "키워드문서" 같은 내부 용어는 절대 쓰지 말 것
- 다른 문서와 문장·구성이 겹치지 않게 매번 새로 작성

JSON만 응답:
{
  "title": "60자 이내 안내 제목",
  "description": "150자 이내 메타 설명",
  "slug": "english-lowercase-slug",
  "content": "HTML 본문",
  "faqs": [{"question":"질문1","answer":"답변1"},{"question":"질문2","answer":"답변2"}]
}`;

    const text = await callGemini(prompt, key);
    if (text) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]) as {
            title?: string;
            description?: string;
            content?: string;
            slug?: string;
            faqs?: SeoFaq[];
          };
          const content = sanitizeContentHtml(parsed.content || "");
          if (content && stripTags(content).length >= MIN_BODY_CHARS) {
            const faqs = (parsed.faqs || [])
              .filter((f) => f?.question?.trim() && f?.answer?.trim())
              .slice(0, 3);
            return {
              title: (parsed.title || keyword).trim().slice(0, 80),
              description: (parsed.description || "").trim().slice(0, 200),
              content,
              faqs: faqs.length ? faqs : buildFallbackFaqs(keyword, region),
              slug: parsed.slug,
              region,
            };
          }
        } catch {
          /* fall through to template */
        }
      }
    }
  }

  return buildFallbackContent(keyword, region, related);
}

function buildFallbackFaqs(keyword: string, region: string | null): SeoFaq[] {
  const r = region ? `${region} ` : "";
  const sets: SeoFaq[][] = [
    [
      {
        question: `${keyword}, 무엇부터 확인하면 좋나요?`,
        answer: `${r}관련 정보를 찾을 때는 공신력 있는 공개 자료와 최신 안내를 먼저 확인하는 것이 좋습니다. ${SITE.name}은 공공데이터와 검증 정보를 바탕으로 도움을 드립니다.`,
      },
      {
        question: `${keyword} 관련 정보는 어디서 확인하나요?`,
        answer: `지역별 시설·공고·정보를 ${SITE.name}에서 한눈에 확인할 수 있으며, 필요에 따라 관련 기관 자료를 함께 참고하시길 권장합니다.`,
      },
    ],
    [
      {
        question: `${keyword}는 어떤 경우에 필요한가요?`,
        answer: `상황과 목적에 따라 다르므로, ${r}지역 여건과 개별 조건을 함께 살펴보는 것이 중요합니다. 무리한 판단보다 확인 가능한 정보 위주로 접근하세요.`,
      },
      {
        question: `주의할 점이 있을까요?`,
        answer: `과장된 정보나 검증되지 않은 광고성 문구에 주의하고, 공개된 근거 자료를 기준으로 확인하는 습관이 도움이 됩니다.`,
      },
    ],
  ];
  return sets[hash(keyword) % sets.length];
}

function buildFallbackContent(
  keyword: string,
  region: string | null,
  related: string[] = []
): GeneratedContent {
  const area = region || "전국";
  const relatedLine = related.length
    ? `<p>${keyword}를 찾는 분들은 ${related.join(", ")} 같은 주제도 함께 살펴보는 경우가 많습니다. 서로 연결된 정보를 폭넓게 확인하면 더 나은 판단에 도움이 됩니다.</p>`
    : "";
  const content = sanitizeContentHtml(
    `
<h2>${keyword} 기본 이해</h2>
<p>${keyword}에 대해 처음 알아보는 분들은 정보가 흩어져 있어 혼란을 겪는 경우가 많습니다. ${SITE.name}은 ${area} 지역을 포함해 공개된 공공데이터와 검증 가능한 자료를 바탕으로, 실제 도움이 되는 내용을 정리해 안내합니다. 단편적인 광고성 정보보다 사실 관계와 배경을 먼저 이해하는 편이 안전합니다.</p>
<p>특히 반려문화가 빠르게 확산되면서 관련 정보의 양은 늘었지만, 신뢰할 수 있는 자료를 가려내는 일이 점점 중요해지고 있습니다. 이 문서는 ${keyword}를 이해하는 데 필요한 기본 개념과 확인 포인트를 차분히 짚어 드립니다.</p>
${relatedLine}

<h2>${keyword} 확인 전 준비</h2>
<p>${keyword}를 알아보기 전에는 목적과 상황을 먼저 정리하는 것이 좋습니다. 어떤 정보가 필요한지, 지역 여건은 어떤지, 우선순위는 무엇인지 정리하면 불필요한 시행착오를 줄일 수 있습니다.</p>
<ul>
<li>필요한 정보의 범위와 목적</li>
<li>${area} 지역의 여건과 접근성</li>
<li>공개 자료·공식 안내 확인 여부</li>
<li>추가로 문의할 기관이나 채널</li>
</ul>
<p>준비가 정리되면 원하는 정보를 더 빠르고 정확하게 찾을 수 있습니다.</p>

<h2>${area}에서의 활용 팁</h2>
<p>${area} 지역에서도 ${keyword} 관련 정보를 지역 단위로 확인하는 것이 효율적입니다. 같은 주제라도 지역별로 상황과 여건이 다를 수 있으므로, 지역 기준으로 정리된 자료를 함께 살펴보는 것을 권장합니다.</p>
<p>${SITE.name}은 지역별 동물병원·약국·장묘, 유기동물 공고, 반려동물 동반여행 정보 등을 함께 제공하므로, ${keyword}와 연관된 주변 정보를 한 번에 확인할 수 있습니다.</p>

<h2>${keyword} 정리와 다음 단계</h2>
<p>${keyword}에 대한 정보를 확인했다면, 필요한 내용을 스스로 정리해 두는 것이 좋습니다. 확인한 자료의 출처와 갱신 시점을 함께 기록해 두면 이후에도 유용하게 활용할 수 있습니다.</p>
<p>올바른 반려문화는 정확한 정보에서 시작됩니다. ${SITE.name}은 공공데이터와 검증 정보를 바탕으로 ${keyword}를 비롯한 다양한 주제를 지속적으로 안내합니다.</p>
`.trim()
  );

  return {
    title: `${keyword} 안내 · ${SITE.name}`.slice(0, 80),
    description: `${area} ${keyword} 관련 정보를 ${SITE.name}에서 정리했습니다. 공공데이터와 검증 정보 기반 안내.`.slice(
      0,
      200
    ),
    content,
    faqs: buildFallbackFaqs(keyword, region),
    region,
  };
}
