import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
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
  extractRegion,
} from "@/lib/seo-pages/generate";
import {
  getGuidePageCached,
  getGuidePoolCached,
  GUIDE_REVALIDATE_SECONDS,
  listAllGuideSlugs,
} from "@/lib/seo-pages/guide-data";
import { buildGuideHashtags } from "@/lib/seo/region-keywords";
import type { SeoPage } from "@/lib/seo-pages/types";
import { SITE } from "@/lib/site";

/**
 * SEO 가이드 = 정적 HTML에 가깝게 서빙
 * - 빌드/생성 시 HTML 프리렌더
 * - CDN에 24시간 캐시 (생성·삭제 시 태그로 즉시 무효화)
 * - 유기동물 공고 등 다른 라우트는 기존 동적 유지
 */
export const revalidate = GUIDE_REVALIDATE_SECONDS;
export const dynamic = "force-static";
export const dynamicParams = true;

const DEFAULT_STEMS = ["동물병원", "애견카페", "강아지분양", "유기동물보호센터", "애견호텔"];
const DEFAULT_GENERIC = ["반려동물정보", "강아지정보", "반려견"];
const LOGO_URL = `${SITE.url.replace(/\/$/, "")}/logo.png`;

interface Props {
  params: Promise<{ slug: string }>;
}

/** 공개 가이드 전체를 프리렌더 (최대 2000) — 첫 방문 지연 제거 */
export async function generateStaticParams() {
  try {
    const slugs = await listAllGuideSlugs(2000);
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

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
  const page = await getGuidePageCached(decodeURIComponent(slug));
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
  const page = await getGuidePageCached(decodeURIComponent(slug));
  if (!page) notFound();

  const pageTitle = ensureKeywordInTitle(page.title, page.keyword);
  const description = ensureNaverDescription(
    page.description || `${page.keyword} 관련 정보 안내`,
    page.keyword
  );

  // 기본/카테고리 코드 폼만 사용 — 렌더 시 settings DB 조회 제거 (정적화)
  const form = resolveCategoryForm(page.category);

  const sido = page.region_name || extractRegion(page.keyword);
  const sigungu = page.region_sigungu;

  // 관련 칩·연관어·카드용 풀을 1회만 조회
  const pool = await getGuidePoolCached(page.category, page.slug);
  const categoryLabel = getCategory(page.category)?.label;

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
      <Suspense fallback={null}>
        <MarketingBanner placement="main_top" />
      </Suspense>
      <Link href="/" className="mt-4 inline-block text-sm text-muted-fg hover:text-foreground">
        ← {SITE.name}
      </Link>

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

      <GuideRelatedChips
        category={page.category}
        currentSlug={page.slug}
        keyword={page.keyword}
        categoryLabel={categoryLabel}
        pool={pool}
      />

      <GuideRegionPhrases
        category={page.category}
        currentSlug={page.slug}
        keyword={page.keyword}
        sido={sido}
        sigungu={sigungu}
        pool={pool}
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
        categoryLabel={categoryLabel}
        keyword={page.keyword}
        slug={page.slug}
        intro={form.intro}
        fields={form.fields}
      />

      {/* 지역 병원·공고 등은 Suspense로 본문 HTML과 분리 — 캐시 히트 시에도 본문이 우선 */}
      <Suspense fallback={null}>
        <RegionalRelated sido={sido} sigungu={sigungu} />
      </Suspense>

      <RelatedGuides
        category={page.category}
        currentSlug={page.slug}
        keyword={page.keyword}
        categoryLabel={categoryLabel}
        pool={pool}
      />

      <div className="mt-8">
        <Suspense fallback={null}>
          <MarketingBanner placement="main_top" />
        </Suspense>
      </div>
    </div>
  );
}
