import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketingBanner from "@/components/places/MarketingBanner";
import ConsultationForm from "@/components/seo/ConsultationForm";
import GuideKeywordBrand from "@/components/seo/GuideKeywordBrand";
import GuideRegionPhrases from "@/components/seo/GuideRegionPhrases";
import GuideRelatedChips from "@/components/seo/GuideRelatedChips";
import JsonLd from "@/components/seo/JsonLd";
import RegionalRelated from "@/components/seo/RegionalRelated";
import RelatedGuides from "@/components/seo/RelatedGuides";
import { resolveCategoryForm } from "@/lib/consultation/forms";
import { getCategory } from "@/lib/seo-pages/categories";
import {
  ensureKeywordInTitle,
  ensureNaverDescription,
  resolveRegionDetail,
} from "@/lib/seo-pages/generate";
import { getCategoryForms } from "@/lib/seo-pages/settings";
import { getSeoPageBySlug, listSeoPageSlugs } from "@/lib/seo-pages/store";
import { buildGuideHashtags } from "@/lib/seo/region-keywords";
import type { SeoPage } from "@/lib/seo-pages/types";
import { SITE } from "@/lib/site";

/** 1시간 ISR — DB는 유지하되 HTML은 정적에 가깝게 캐시. 생성/삭제 시 revalidatePath로 즉시 갱신 */
export const revalidate = 3600;

const DEFAULT_STEMS = ["동물병원", "애견카페", "강아지분양", "유기동물보호센터", "애견호텔"];
const DEFAULT_GENERIC = ["반려동물정보", "강아지정보", "반려견"];
const LOGO_URL = `${SITE.url.replace(/\/$/, "")}/logo.png`;

interface Props {
  params: Promise<{ slug: string }>;
}

/** 최근 가이드 일부를 빌드/워밍에 포함 (나머지는 첫 방문 시 on-demand ISR) */
export async function generateStaticParams() {
  try {
    const rows = await listSeoPageSlugs(0, 49);
    return rows.map((r) => ({ slug: r.slug }));
  } catch {
    return [];
  }
}

/** 메타 keywords용 (페이지에 해시태그 UI는 노출하지 않음) */
function guideKeywords(page: SeoPage) {
  const cat = getCategory(page.category);
  return buildGuideHashtags({
    sido: page.region_name,
    sigungu: page.region_sigungu,
    stems: cat?.hashtagStems ?? DEFAULT_STEMS,
    genericTags: cat?.genericTags ?? DEFAULT_GENERIC,
    seed: page.slug,
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getSeoPageBySlug(decodeURIComponent(slug));
  if (!page) return { title: "페이지를 찾을 수 없습니다" };

  const canonical = `/guide/${encodeURIComponent(page.slug)}`;
  const pageTitle = ensureKeywordInTitle(page.title, page.keyword);
  const description = ensureNaverDescription(
    page.description || `${page.keyword} 관련 정보 안내 — ${SITE.name}`,
    page.keyword
  );
  const ogUrl = page.image_url || LOGO_URL;
  const hasContentImage = Boolean(page.image_url);
  const ogImages = [
    {
      url: ogUrl,
      alt: hasContentImage ? pageTitle : `${SITE.name} 로고`,
      width: 1200,
      height: 630,
    },
  ];

  const tags = guideKeywords(page);
  const keywords = Array.from(
    new Set([page.keyword, ...(page.keywords || []), ...tags])
  );

  return {
    // 루트 template → "{제목} · 반려문화위원회"
    title: pageTitle,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: pageTitle,
      description,
      url: canonical,
      siteName: SITE.name,
      locale: "ko_KR",
      images: ogImages,
    },
    twitter: {
      card: hasContentImage ? "summary_large_image" : "summary",
      title: pageTitle,
      description,
      images: ogImages.map((i) => i.url),
    },
    other: {
      "geo.region": "KR",
      ...(page.region_name ? { "geo.placename": page.region_name } : {}),
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const page = await getSeoPageBySlug(decodeURIComponent(slug));
  if (!page) notFound();

  const pageTitle = ensureKeywordInTitle(page.title, page.keyword);
  const description = ensureNaverDescription(
    page.description || `${page.keyword} 관련 정보 안내`,
    page.keyword
  );

  const dbForms = await getCategoryForms();
  const form = resolveCategoryForm(page.category, dbForms);

  // DB에 지역이 비어 있어도 키워드에서 시·도/시군구·동을 다시 추론
  let sido = page.region_name;
  let sigungu = page.region_sigungu;
  if (!sido || !sigungu) {
    const inferred = await resolveRegionDetail(page.keyword);
    if (!sido && inferred.sido) sido = inferred.sido;
    if (!sigungu && inferred.sigungu) sigungu = inferred.sigungu;
  }

  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "홈", item: SITE.url },
        { "@type": "ListItem", position: 2, name: pageTitle },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: pageTitle,
      description,
      inLanguage: "ko-KR",
      url: `${SITE.url}/guide/${encodeURIComponent(page.slug)}`,
      datePublished: page.created_at,
      dateModified: page.updated_at,
      ...(page.image_url
        ? { image: page.image_url }
        : { image: LOGO_URL }),
      author: { "@type": "Organization", name: SITE.name },
      publisher: { "@type": "Organization", name: SITE.name },
      isPartOf: {
        "@type": "WebSite",
        name: SITE.name,
        url: SITE.url,
      },
      about: page.keyword,
      keywords: [page.keyword, ...(page.keywords || [])].join(", "),
    },
    ...(page.faqs.length
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: page.faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-28 sm:px-6 sm:py-10 sm:pb-28">
      <JsonLd data={jsonLd} />
      <MarketingBanner placement="main_top" />
      <Link href="/" className="mt-4 inline-block text-sm text-muted-fg hover:text-foreground">
        ← {SITE.name}
      </Link>

      {/* H1·본문을 상단에 — 검색·크롤 우선 */}
      <article className="mt-4 rounded-2xl border border-border bg-card p-6 sm:p-9">
        <GuideKeywordBrand keyword={page.keyword} />
        <h1 className="font-display text-2xl font-bold leading-snug text-foreground sm:text-3xl">
          {pageTitle}
        </h1>
        {page.region_name && (
          <p className="mt-2 text-sm text-muted-fg">{page.region_name}</p>
        )}
        <div
          className="seo-body mt-6 leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </article>

      {/* aga식: 동종 내부링크 칩바 (본문 직후) */}
      <GuideRelatedChips
        category={page.category}
        currentSlug={page.slug}
        keyword={page.keyword}
        categoryLabel={getCategory(page.category)?.label}
      />

      {/* 유아독존식: 지역 연관 검색어 (문서 있을 때만 링크) */}
      <GuideRegionPhrases
        category={page.category}
        currentSlug={page.slug}
        keyword={page.keyword}
        sido={sido}
        sigungu={sigungu}
      />

      {page.faqs.length > 0 && (
        <section className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold text-foreground">자주 묻는 질문</h2>
          <dl className="mt-4 space-y-4">
            {page.faqs.map((f) => (
              <div key={f.question} className="border-b border-border pb-4 last:border-0 last:pb-0">
                <dt className="text-sm font-semibold text-foreground">Q. {f.question}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-muted-fg">{f.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <ConsultationForm
        category={page.category}
        categoryLabel={getCategory(page.category)?.label}
        keyword={page.keyword}
        slug={page.slug}
        intro={form.intro}
        fields={form.fields}
      />

      <RegionalRelated sido={sido} sigungu={sigungu} />

      <RelatedGuides
        category={page.category}
        currentSlug={page.slug}
        keyword={page.keyword}
        categoryLabel={getCategory(page.category)?.label}
      />

      <div className="mt-8">
        <MarketingBanner placement="main_top" />
      </div>
    </div>
  );
}
