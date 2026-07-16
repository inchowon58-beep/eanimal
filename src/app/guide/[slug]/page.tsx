import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketingBanner from "@/components/places/MarketingBanner";
import ConsultationForm from "@/components/seo/ConsultationForm";
import JsonLd from "@/components/seo/JsonLd";
import KeywordTags from "@/components/seo/KeywordTags";
import RegionalRelated from "@/components/seo/RegionalRelated";
import RelatedGuides from "@/components/seo/RelatedGuides";
import { resolveCategoryForm } from "@/lib/consultation/forms";
import { getCategory } from "@/lib/seo-pages/categories";
import { resolveRegionDetail } from "@/lib/seo-pages/generate";
import { getCategoryForms } from "@/lib/seo-pages/settings";
import { getSeoPageBySlug } from "@/lib/seo-pages/store";
import { buildGuideHashtags } from "@/lib/seo/region-keywords";
import type { SeoPage } from "@/lib/seo-pages/types";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

const DEFAULT_STEMS = ["동물병원", "애견카페", "강아지분양", "유기동물보호센터", "애견호텔"];
const DEFAULT_GENERIC = ["반려동물정보", "강아지정보", "반려견"];
const LOGO_URL = `${SITE.url.replace(/\/$/, "")}/logo.png`;

interface Props {
  params: Promise<{ slug: string }>;
}

/** 카테고리·지역 기반 해시태그 (제목 포함) */
function guideTags(page: SeoPage) {
  const cat = getCategory(page.category);
  const topic = cat?.topic ?? "반려동물";
  const tags = buildGuideHashtags({
    sido: page.region_name,
    sigungu: page.region_sigungu,
    stems: cat?.hashtagStems ?? DEFAULT_STEMS,
    genericTags: cat?.genericTags ?? DEFAULT_GENERIC,
    seed: page.slug,
  });
  const regionLabel = [page.region_name, page.region_sigungu].filter(Boolean).join(" ");
  const title = `${regionLabel ? `${regionLabel} ` : ""}${topic} 관련 검색어`;
  return { tags, title };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getSeoPageBySlug(decodeURIComponent(slug));
  if (!page) return { title: "페이지를 찾을 수 없습니다" };

  const canonical = `/guide/${encodeURIComponent(page.slug)}`;
  const description = page.description || `${page.keyword} 관련 정보 안내 — ${SITE.name}`;
  const hasImage = Boolean(page.image_url);
  const ogUrl = page.image_url || LOGO_URL;
  const ogImages = [{ url: ogUrl, alt: page.title }];

  const { tags } = guideTags(page);
  const keywords = Array.from(
    new Set([page.keyword, ...(page.keywords || []), ...tags])
  );

  return {
    title: page.title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: page.title,
      description,
      url: canonical,
      siteName: SITE.name,
      locale: "ko_KR",
      images: ogImages,
    },
    twitter: {
      card: hasImage ? "summary_large_image" : "summary",
      title: page.title,
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

  const description = page.description || `${page.keyword} 관련 정보 안내`;
  const { tags, title: tagsTitle } = guideTags(page);

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
        { "@type": "ListItem", position: 2, name: page.title },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: page.title,
      description,
      inLanguage: "ko-KR",
      url: `${SITE.url}/guide/${encodeURIComponent(page.slug)}`,
      datePublished: page.created_at,
      dateModified: page.updated_at,
      ...(page.image_url ? { image: page.image_url } : {}),
      author: { "@type": "Organization", name: SITE.name },
      publisher: { "@type": "Organization", name: SITE.name },
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
      <ConsultationForm
        category={page.category}
        categoryLabel={getCategory(page.category)?.label}
        keyword={page.keyword}
        slug={page.slug}
        intro={form.intro}
        fields={form.fields}
      />
      <Link href="/" className="mt-4 inline-block text-sm text-muted-fg hover:text-foreground">
        ← {SITE.name}
      </Link>

      <article className="mt-4 rounded-2xl border border-border bg-card p-6 sm:p-9">
        <h1 className="font-display text-2xl font-bold leading-snug text-foreground sm:text-3xl">
          {page.title}
        </h1>
        {page.region_name && (
          <p className="mt-2 text-sm text-muted-fg">{page.region_name}</p>
        )}
        <div
          className="seo-body mt-6 leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </article>

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

      {tags.length > 0 && <KeywordTags title={tagsTitle} tags={tags} />}

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
