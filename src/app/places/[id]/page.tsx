import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketingBanner from "@/components/places/MarketingBanner";
import { getPlaceById } from "@/lib/places/queries";
import {
  buildPlaceDetailSeoCopy,
  countSeoChars,
} from "@/lib/places/seo-copy";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const place = await getPlaceById(id);
  if (!place) return { title: "시설을 찾을 수 없습니다" };
  const region = [place.sido, place.sigungu].filter(Boolean).join(" ");
  return {
    title: `${place.title} · ${place.category}`,
    description: `${region} ${place.category} ${place.title} 인허가 정보 — ${SITE.name}`,
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
  const seo = buildPlaceDetailSeoCopy(place);
  const paragraphs = seo.split("\n\n").filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <MarketingBanner />

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
            <dd className="mt-1 text-sm text-foreground">
              {[place.sido, place.sigungu].filter(Boolean).join(" ") || "미상"}
            </dd>
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
        <p className="mt-1 text-xs text-muted-fg">
          본문 글자 수(공백 제외) 약 {countSeoChars(seo).toLocaleString("ko-KR")}자
        </p>
        <div className="mt-5">
          {paragraphs.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </div>
      </section>
    </div>
  );
}
