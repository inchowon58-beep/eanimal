import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketingBanner from "@/components/places/MarketingBanner";
import JsonLd from "@/components/seo/JsonLd";
import { getSeoPageBySlug } from "@/lib/seo-pages/store";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getSeoPageBySlug(decodeURIComponent(slug));
  if (!page) return { title: "페이지를 찾을 수 없습니다" };

  const canonical = `/guide/${encodeURIComponent(page.slug)}`;
  const description = page.description || `${page.keyword} 관련 정보 안내 — ${SITE.name}`;
  const ogImages = page.image_url ? [{ url: page.image_url, alt: page.title }] : undefined;

  return {
    title: page.title,
    description,
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
      card: ogImages ? "summary_large_image" : "summary",
      title: page.title,
      description,
      images: ogImages?.map((i) => i.url),
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <JsonLd data={jsonLd} />
      <MarketingBanner placement="main_top" />
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
    </div>
  );
}
