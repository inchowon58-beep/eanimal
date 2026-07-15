import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketingBanner from "@/components/places/MarketingBanner";
import RemoteImage from "@/components/media/RemoteImage";
import JsonLd from "@/components/seo/JsonLd";
import KeywordTags from "@/components/seo/KeywordTags";
import RegionalRelated from "@/components/seo/RegionalRelated";
import { getTravelByContentId } from "@/lib/travel/queries";
import { buildTravelDetailSeo } from "@/lib/travel/seo";
import { buildTravelHashtags } from "@/lib/seo/region-keywords";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

function isHttp(url: string | null | undefined): url is string {
  return Boolean(url && /^https?:\/\//i.test(url));
}

function toNum(v: string | null | undefined): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n !== 0 ? n : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const place = await getTravelByContentId(decodeURIComponent(id));
  if (!place) return { title: "장소를 찾을 수 없습니다" };

  const region = [place.sido, place.sigungu].filter(Boolean).join(" ") || "전국";
  const title = `${place.title} 반려동물 동반`;
  const description = `${region} 반려동물 동반 가능 장소 ${place.title}. ${[place.address, place.address_detail].filter(Boolean).join(" ")} — ${SITE.name}`;
  const canonical = `/travel/${encodeURIComponent(place.content_id)}`;
  const hashtags = buildTravelHashtags({ sido: place.sido, sigungu: place.sigungu });
  const ogImages = isHttp(place.image_url)
    ? [{ url: place.image_url, alt: place.title }]
    : undefined;
  const lat = toNum(place.mapy);
  const lng = toNum(place.mapx);

  return {
    title,
    description,
    keywords: hashtags,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      siteName: SITE.name,
      locale: "ko_KR",
      images: ogImages,
    },
    twitter: {
      card: ogImages ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImages?.map((i) => i.url),
    },
    other: {
      "geo.region": "KR",
      "geo.placename": region,
      ...(lat && lng
        ? { "geo.position": `${lat};${lng}`, ICBM: `${lat}, ${lng}` }
        : {}),
    },
  };
}

export default async function TravelDetailPage({ params }: Props) {
  const { id } = await params;
  const place = await getTravelByContentId(decodeURIComponent(id));
  if (!place) notFound();

  const seo = buildTravelDetailSeo(place);
  const paragraphs = seo.split("\n\n");
  const region = [place.sido, place.sigungu].filter(Boolean).join(" ") || "전국";
  const hashtags = buildTravelHashtags({ sido: place.sido, sigungu: place.sigungu });
  const overviewText = place.overview
    ? place.overview.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : null;
  const lat = toNum(place.mapy);
  const lng = toNum(place.mapx);

  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "홈", item: SITE.url },
        { "@type": "ListItem", position: 2, name: "반려동물 동반여행", item: `${SITE.url}/travel` },
        { "@type": "ListItem", position: 3, name: place.title },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "TouristAttraction",
      name: place.title,
      description: `${region} 반려동물 동반 가능 장소`,
      inLanguage: "ko-KR",
      url: `${SITE.url}/travel/${encodeURIComponent(place.content_id)}`,
      ...(isHttp(place.image_url) ? { image: place.image_url } : {}),
      ...(place.tel ? { telephone: place.tel } : {}),
      address: {
        "@type": "PostalAddress",
        addressCountry: "KR",
        addressRegion: place.sido || undefined,
        addressLocality: place.sigungu || undefined,
        streetAddress:
          [place.address, place.address_detail].filter(Boolean).join(" ") || undefined,
      },
      ...(lat && lng
        ? { geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lng } }
        : {}),
      isAccessibleForFree: true,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <JsonLd data={jsonLd} />
      <MarketingBanner placement="travel" />
      <Link href="/travel" className="mt-4 inline-block text-sm text-muted-fg hover:text-foreground">
        ← 동반여행 목록
      </Link>

      <article className="mt-4 overflow-hidden rounded-2xl border border-border bg-card lg:grid lg:grid-cols-2">
        <div className="relative aspect-[16/10] bg-muted lg:aspect-auto lg:min-h-[360px]">
          <RemoteImage src={place.image_url} alt={place.title} sizes="(max-width: 1024px) 100vw, 576px" priority />
        </div>
        <div className="p-5 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-foreground">{place.title}</h1>
          <p className="mt-2 text-sm text-muted-fg">
            {[place.address, place.address_detail].filter(Boolean).join(" ") || "주소 미상"}
          </p>
          {place.tel && (
            <p className="mt-1 text-sm">
              <a href={`tel:${place.tel.replace(/\s/g, "")}`} className="text-accent">{place.tel}</a>
            </p>
          )}

          {(place.pet_info || place.pet_rule) && (
            <div className="mt-6 space-y-3 rounded-xl bg-muted/50 p-4 text-sm">
              {place.pet_info && (
                <div>
                  <p className="text-xs font-medium text-muted-fg">동반 정보</p>
                  <p className="mt-1 text-foreground">{place.pet_info}</p>
                </div>
              )}
              {place.pet_rule && (
                <div>
                  <p className="text-xs font-medium text-muted-fg">유의사항·에티켓</p>
                  <p className="mt-1 text-foreground">{place.pet_rule}</p>
                </div>
              )}
            </div>
          )}

          {overviewText && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-foreground">소개</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-fg">{overviewText}</p>
            </div>
          )}
        </div>
      </article>

      <section className="seo-body mt-8 rounded-xl border border-border bg-card p-5 sm:p-8">
        <h2 className="font-display text-lg font-semibold">동반여행 안내</h2>
        <div className="mt-4">
          {paragraphs.map((para) => (
            <p key={para.slice(0, 24)}>{para}</p>
          ))}
        </div>
      </section>

      <KeywordTags title={`${region} 반려동물 동반여행 관련 검색어`} tags={hashtags} />

      <RegionalRelated
        sido={place.sido}
        sigungu={place.sigungu}
        exclude={{ travel: place.content_id }}
      />
    </div>
  );
}
