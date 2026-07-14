import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketingBanner from "@/components/places/MarketingBanner";
import RemoteImage from "@/components/media/RemoteImage";
import { getTravelByContentId } from "@/lib/travel/queries";
import { buildTravelDetailSeo } from "@/lib/travel/seo";
import { SITE } from "@/lib/site";
import { countSeoChars } from "@/lib/places/seo-copy";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const place = await getTravelByContentId(decodeURIComponent(id));
  if (!place) return { title: "장소를 찾을 수 없습니다" };
  return {
    title: `${place.title} 반려동물 동반`,
    description: `${[place.sido, place.address].filter(Boolean).join(" ")} — ${SITE.name}`,
  };
}

export default async function TravelDetailPage({ params }: Props) {
  const { id } = await params;
  const place = await getTravelByContentId(decodeURIComponent(id));
  if (!place) notFound();

  const seo = buildTravelDetailSeo(place);
  const paragraphs = seo.split("\n\n");
  const overviewText = place.overview
    ? place.overview.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <MarketingBanner />
      <Link href="/travel" className="mt-4 inline-block text-sm text-muted-fg hover:text-foreground">
        ← 동반여행 목록
      </Link>

      <article className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative aspect-[16/10] bg-muted">
          <RemoteImage src={place.image_url} alt={place.title} sizes="(max-width: 768px) 100vw, 800px" priority />
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
        <h2 className="font-display text-lg font-semibold">동반여행 상세 안내</h2>
        <p className="mt-1 text-xs text-muted-fg">본문 약 {countSeoChars(seo).toLocaleString("ko-KR")}자</p>
        <div className="mt-5">
          {paragraphs.map((para) => (
            <p key={para.slice(0, 24)}>{para}</p>
          ))}
        </div>
      </section>
    </div>
  );
}
