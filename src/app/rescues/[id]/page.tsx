import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketingBanner from "@/components/places/MarketingBanner";
import RemoteImage from "@/components/media/RemoteImage";
import JsonLd from "@/components/seo/JsonLd";
import KeywordTags from "@/components/seo/KeywordTags";
import RegionalRelated from "@/components/seo/RegionalRelated";
import { getRescueByDesertionNo } from "@/lib/rescues/queries";
import { buildRescueDetailSeo } from "@/lib/rescues/seo";
import { buildRescueHashtags } from "@/lib/seo/region-keywords";
import {
  formatHappenDt,
  neuterLabel,
  sexLabel,
} from "@/lib/rescues/types";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

function isHttp(url: string | null | undefined): url is string {
  return Boolean(url && /^https?:\/\//i.test(url));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const animal = await getRescueByDesertionNo(decodeURIComponent(id));
  if (!animal) return { title: "공고를 찾을 수 없습니다" };

  const region = [animal.sido, animal.sigungu].filter(Boolean).join(" ") || "전국";
  const kind = animal.kind_cd || "구조동물";
  const title = `${region} ${kind} 유기동물 공고`;
  const description = `${formatHappenDt(animal.happen_dt)} ${animal.happen_place || region}에서 구조된 ${kind}. 보호소 ${animal.care_nm || "미상"} · ${SITE.name} 유기동물 공고.`;
  const canonical = `/rescues/${encodeURIComponent(animal.desertion_no)}`;
  const hashtags = buildRescueHashtags({
    sido: animal.sido,
    sigungu: animal.sigungu,
    kindCd: animal.kind_cd,
  });
  const ogImages = isHttp(animal.image_url)
    ? [{ url: animal.image_url, alt: `${kind} 구조 사진` }]
    : undefined;

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
    },
  };
}

export default async function RescueDetailPage({ params }: Props) {
  const { id } = await params;
  const animal = await getRescueByDesertionNo(decodeURIComponent(id));
  if (!animal) notFound();

  const seo = buildRescueDetailSeo(animal);
  const paragraphs = seo.split("\n\n");
  const region = [animal.sido, animal.sigungu].filter(Boolean).join(" ") || "전국";
  const kind = animal.kind_cd || "구조동물";
  const hashtags = buildRescueHashtags({
    sido: animal.sido,
    sigungu: animal.sigungu,
    kindCd: animal.kind_cd,
  });

  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "홈", item: SITE.url },
        { "@type": "ListItem", position: 2, name: "유기동물 공고", item: `${SITE.url}/rescues` },
        { "@type": "ListItem", position: 3, name: `${region} ${kind} 공고` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${region} ${kind} 유기동물 공고`,
      description: `${formatHappenDt(animal.happen_dt)} ${animal.happen_place || region}에서 구조된 ${kind}`,
      inLanguage: "ko-KR",
      url: `${SITE.url}/rescues/${encodeURIComponent(animal.desertion_no)}`,
      ...(isHttp(animal.image_url)
        ? { primaryImageOfPage: { "@type": "ImageObject", contentUrl: animal.image_url } }
        : {}),
      about: {
        "@type": "Thing",
        name: kind,
      },
      ...(animal.care_addr
        ? {
            contentLocation: {
              "@type": "Place",
              name: animal.care_nm || "보호센터",
              address: animal.care_addr,
            },
          }
        : {}),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <JsonLd data={jsonLd} />
      <MarketingBanner />
      <Link href="/rescues" className="mt-4 inline-block text-sm text-muted-fg hover:text-foreground">
        ← 공고 목록
      </Link>

      <article className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative aspect-[16/10] bg-muted">
          <RemoteImage
            src={animal.image_url}
            alt={`${region} ${kind} 구조 사진`}
            sizes="(max-width: 768px) 100vw, 800px"
            priority
          />
        </div>
        <div className="p-5 sm:p-8">
          <p className="text-xs text-muted-fg">유기번호 {animal.desertion_no}</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-foreground">
            {region} {animal.kind_cd || "품종 미상"} 공고
          </h1>
          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-muted-fg">발견일</dt><dd>{formatHappenDt(animal.happen_dt)}</dd></div>
            <div><dt className="text-xs text-muted-fg">구조 장소</dt><dd>{animal.happen_place || "미상"}</dd></div>
            <div><dt className="text-xs text-muted-fg">성별</dt><dd>{sexLabel(animal.sex_cd)}</dd></div>
            <div><dt className="text-xs text-muted-fg">중성화</dt><dd>{neuterLabel(animal.neuter_yn)}</dd></div>
            <div><dt className="text-xs text-muted-fg">나이·체중</dt><dd>{[animal.age, animal.weight].filter(Boolean).join(" / ") || "미상"}</dd></div>
            <div><dt className="text-xs text-muted-fg">상태</dt><dd>{animal.process_state || "미상"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs text-muted-fg">특징</dt><dd>{animal.special_mark || "없음"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs text-muted-fg">보호소</dt><dd>{animal.care_nm || "미상"} · {animal.care_tel || "전화 미등록"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs text-muted-fg">보호소 주소</dt><dd>{animal.care_addr || "미상"}</dd></div>
          </dl>
        </div>
      </article>

      <section className="seo-body mt-8 rounded-xl border border-border bg-card p-5 sm:p-8">
        <h2 className="font-display text-lg font-semibold">이 공고 안내</h2>
        <div className="mt-4">
          {paragraphs.map((para) => (
            <p key={para.slice(0, 24)}>{para}</p>
          ))}
        </div>
      </section>

      <KeywordTags title={`${region} 유기동물 관련 검색어`} tags={hashtags} />

      <RegionalRelated
        sido={animal.sido}
        sigungu={animal.sigungu}
        exclude={{ rescue: animal.desertion_no }}
      />

      <div className="mt-8">
        <MarketingBanner />
      </div>
    </div>
  );
}
