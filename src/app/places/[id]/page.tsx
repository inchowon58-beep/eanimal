import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketingBanner from "@/components/places/MarketingBanner";
import { categoryToPlacement } from "@/lib/banners/types";
import JsonLd from "@/components/seo/JsonLd";
import KeywordTags from "@/components/seo/KeywordTags";
import RegionalRelated from "@/components/seo/RegionalRelated";
import { getPlaceById } from "@/lib/places/queries";
import { buildPlaceDetailSeoCopy } from "@/lib/places/seo-copy";
import { cityStem, sidoShort } from "@/lib/seo/region-keywords";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

const SCHEMA_TYPE: Record<string, string> = {
  동물병원: "VeterinaryCare",
  동물약국: "Pharmacy",
  동물장묘업: "LocalBusiness",
};

function placeHashtags(
  category: string,
  sido: string | null,
  sigungu: string | null
): string[] {
  const city = cityStem(sigungu);
  const short = sidoShort(sido);
  const tags: string[] = [];
  const push = (s: string) => {
    const v = s.replace(/\s+/g, "");
    if (v && !tags.includes(v)) tags.push(v);
  };
  if (city) {
    push(`${city}${category}`);
    push(`${city}반려동물${category === "동물병원" ? "병원" : category === "동물약국" ? "약국" : "장묘"}`);
  }
  if (short) push(`${short}${category}`);
  if (sido) push(`${sido}${category}`);
  push(`${category}추천`);
  push(`반려동물${category}`);
  return tags.slice(0, 12);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const place = await getPlaceById(id);
  if (!place) return { title: "시설을 찾을 수 없습니다" };
  const region = [place.sido, place.sigungu].filter(Boolean).join(" ");
  const title = `${place.title} · ${place.category}`;
  const description = `${region} ${place.category} ${place.title} 정보 — ${SITE.name}`;
  const canonical = `/places/${place.id}`;
  return {
    title,
    description,
    keywords: placeHashtags(place.category, place.sido, place.sigungu),
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      siteName: SITE.name,
      locale: "ko_KR",
      images: [{ url: "/logo.png", alt: SITE.name }],
    },
    other: {
      "geo.region": "KR",
      "geo.placename": region || "전국",
    },
  };
}

function isOpen(status: string) {
  return status.includes("영업") && !status.includes("폐업") && !status.includes("휴업");
}

export default async function PlaceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const place = await getPlaceById(id);
  if (!place) notFound();

  const open = isOpen(place.status);
  const address = place.address_road || place.address_jibun || "주소 미등록";
  const region = [place.sido, place.sigungu].filter(Boolean).join(" ") || "전국";
  const seo = buildPlaceDetailSeoCopy(place);
  const paragraphs = seo.split("\n\n").filter(Boolean);
  const hashtags = placeHashtags(place.category, place.sido, place.sigungu);

  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "홈", item: SITE.url },
        { "@type": "ListItem", position: 2, name: "시설 목록", item: `${SITE.url}/places` },
        { "@type": "ListItem", position: 3, name: place.title },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": SCHEMA_TYPE[place.category] || "LocalBusiness",
      name: place.title,
      inLanguage: "ko-KR",
      url: `${SITE.url}/places/${place.id}`,
      ...(place.phone ? { telephone: place.phone } : {}),
      address: {
        "@type": "PostalAddress",
        addressCountry: "KR",
        addressRegion: place.sido || undefined,
        addressLocality: place.sigungu || undefined,
        streetAddress: address,
      },
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <JsonLd data={jsonLd} />
      <MarketingBanner placement={categoryToPlacement(place.category)} />

      <div className="mt-6 mb-4">
        <Link href="/places" className="text-sm text-muted-fg hover:text-foreground">
          ← 목록으로
        </Link>
      </div>

      <article className="rounded-2xl border border-border bg-card p-5 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-fg">
            {place.category}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-fg">
            <span
              className={`h-2 w-2 rounded-full ${open ? "bg-success" : "bg-danger"}`}
              aria-hidden
            />
            <span>{place.status}</span>
          </span>
        </div>

        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {place.title}
        </h1>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <dt className="text-xs font-medium text-muted-fg">주소</dt>
            <dd className="mt-1 text-sm leading-relaxed text-foreground">
              {address}
              {place.address_road && place.address_jibun ? (
                <span className="mt-1 block text-xs text-muted-fg">
                  지번: {place.address_jibun}
                </span>
              ) : null}
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <dt className="text-xs font-medium text-muted-fg">전화번호</dt>
            <dd className="mt-1 text-sm text-foreground">
              {place.phone ? (
                <a href={`tel:${place.phone.replace(/\s/g, "")}`} className="text-accent">
                  {place.phone}
                </a>
              ) : (
                "미등록"
              )}
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <dt className="text-xs font-medium text-muted-fg">지역</dt>
            <dd className="mt-1 text-sm text-foreground">{region}</dd>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <dt className="text-xs font-medium text-muted-fg">인허가 번호</dt>
            <dd className="mt-1 break-all text-sm text-foreground">{place.local_id}</dd>
          </div>
        </dl>
      </article>

      <section className="seo-body mt-10 rounded-xl border border-border bg-card p-5 sm:p-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          {place.title} 지역 인프라 안내
        </h2>
        <div className="mt-4">
          {paragraphs.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </div>
      </section>

      <KeywordTags title={`${region} ${place.category} 관련 검색어`} tags={hashtags} />

      <RegionalRelated sido={place.sido} sigungu={place.sigungu} exclude={{ place: place.id }} />
    </div>
  );
}
