import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import ConsultationForm from "@/components/seo/ConsultationForm";
import { resolveCategoryForm } from "@/lib/consultation/forms";
import { getCategory } from "@/lib/seo-pages/categories";
import { getBaseSeoBySlug, listBaseSeoSlugs } from "@/lib/base-seo/store";
import { SITE } from "@/lib/site";

export const revalidate = 86400;
export const dynamic = "force-static";
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await listBaseSeoSlugs(1000);
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getBaseSeoBySlug(decodeURIComponent(slug));
  if (!page) return { title: "페이지를 찾을 수 없습니다" };

  const canonical = `/info/${encodeURIComponent(page.slug)}`;
  return {
    title: page.title,
    description: page.description,
    keywords: page.meta_keywords,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: page.title,
      description: page.description,
      url: canonical,
      siteName: SITE.name,
      locale: "ko_KR",
      ...(page.image_url ? { images: [{ url: page.image_url, alt: page.h1 }] } : {}),
    },
    twitter: {
      card: page.image_url ? "summary_large_image" : "summary",
      title: page.title,
      description: page.description,
      ...(page.image_url ? { images: [page.image_url] } : {}),
    },
  };
}

/** 기본 SEO 발행 페이지 — /guide 와 다른 레이아웃·톤 */
export default async function BaseSeoInfoPage({ params }: Props) {
  const { slug } = await params;
  const page = await getBaseSeoBySlug(decodeURIComponent(slug));
  if (!page) notFound();

  const cat = getCategory(page.category);
  const form = resolveCategoryForm(page.category);
  const url = `${SITE.url.replace(/\/$/, "")}/info/${encodeURIComponent(page.slug)}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "홈", item: SITE.url },
        { "@type": "ListItem", position: 2, name: cat?.label || "안내", item: `${SITE.url}/` },
        { "@type": "ListItem", position: 3, name: page.h1, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.title,
      description: page.description,
      url,
      inLanguage: "ko-KR",
      isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
      about: page.keyword,
      keywords: page.meta_keywords.join(", "),
      ...(page.image_url ? { primaryImageOfPage: { "@type": "ImageObject", url: page.image_url } } : {}),
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
    <div className="base-seo-page min-h-screen bg-[linear-gradient(180deg,#eef3f6_0%,#f7fafb_42%,#ffffff_100%)]">
      <JsonLd data={jsonLd} />

      <div className="mx-auto max-w-3xl px-4 pb-28 pt-8 sm:px-6 sm:pt-12">
        <Link
          href="/"
          className="text-xs font-medium tracking-wide text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline"
        >
          {SITE.name} 홈
        </Link>

        <header className="mt-6 border-l-4 border-slate-800 pl-4 sm:pl-5">
          {page.hero_kicker && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-800/80">
              {page.hero_kicker}
            </p>
          )}
          <p className="mt-2 text-sm font-medium text-slate-600">{page.keyword}</p>
          <h1 className="mt-2 font-display text-[1.65rem] font-bold leading-snug tracking-tight text-slate-900 sm:text-4xl">
            {page.h1}
          </h1>
          {page.hero_subtitle && (
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              {page.hero_subtitle}
            </p>
          )}
          {page.region_label && (
            <p className="mt-3 inline-block rounded-md bg-slate-900/5 px-2.5 py-1 text-xs font-medium text-slate-700">
              지역 기준 · {page.region_label}
            </p>
          )}
        </header>

        {page.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={page.image_url}
            alt={page.h1}
            className="mt-8 w-full rounded-none border border-slate-200 object-cover shadow-sm"
            loading="eager"
            fetchPriority="high"
          />
        )}

        <article className="mt-10 space-y-10">
          {page.sections.map((sec) => (
            <section key={sec.h2} className="scroll-mt-24">
              <h2 className="font-display text-lg font-bold text-slate-900 sm:text-xl">
                {sec.h2}
              </h2>
              <div className="mt-3 space-y-3 text-[15px] leading-7 text-slate-700">
                {sec.paragraphs.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </article>

        {page.faqs.length > 0 && (
          <section className="mt-12 border-t border-slate-200 pt-8">
            <h2 className="font-display text-lg font-bold text-slate-900">자주 묻는 질문</h2>
            <div className="mt-4 divide-y divide-slate-200">
              {page.faqs.map((f) => (
                <details key={f.question} className="group py-3">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900 marker:content-none">
                    <span className="mr-2 text-teal-700">Q.</span>
                    {f.question}
                  </summary>
                  <p className="mt-2 pl-6 text-sm leading-relaxed text-slate-600">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 rounded-none border border-slate-300 bg-white p-5 sm:p-6">
          <p className="text-sm font-semibold text-slate-900">
            {page.cta_text || `${SITE.name} 상담`}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            기본 SEO 발행 페이지 · 키워드 맞춤 안내
          </p>
          <div className="mt-4">
            <ConsultationForm
              category={page.category}
              categoryLabel={cat?.label}
              keyword={page.keyword}
              slug={page.slug}
              intro={form.intro}
              fields={form.fields}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
