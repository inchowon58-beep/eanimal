import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketingBanner from "@/components/places/MarketingBanner";
import RemoteImage from "@/components/media/RemoteImage";
import { getRescueByDesertionNo } from "@/lib/rescues/queries";
import { buildRescueDetailSeo } from "@/lib/rescues/seo";
import {
  formatHappenDt,
  neuterLabel,
  sexLabel,
} from "@/lib/rescues/types";
import { SITE } from "@/lib/site";
import { countSeoChars } from "@/lib/places/seo-copy";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const animal = await getRescueByDesertionNo(decodeURIComponent(id));
  if (!animal) return { title: "공고를 찾을 수 없습니다" };
  return {
    title: `${animal.kind_cd || "구조동물"} ${animal.happen_place || ""} 공고`,
    description: `${formatHappenDt(animal.happen_dt)} 구조 · ${animal.care_nm || ""} — ${SITE.name}`,
  };
}

export default async function RescueDetailPage({ params }: Props) {
  const { id } = await params;
  const animal = await getRescueByDesertionNo(decodeURIComponent(id));
  if (!animal) notFound();

  const seo = buildRescueDetailSeo(animal);
  const paragraphs = seo.split("\n\n");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <MarketingBanner />
      <Link href="/rescues" className="mt-4 inline-block text-sm text-muted-fg hover:text-foreground">
        ← 공고 목록
      </Link>

      <article className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative aspect-[16/10] bg-muted">
          <RemoteImage
            src={animal.image_url}
            alt={animal.kind_cd || "구조동물"}
            sizes="(max-width: 768px) 100vw, 800px"
            priority
          />
        </div>
        <div className="p-5 sm:p-8">
          <p className="text-xs text-muted-fg">유기번호 {animal.desertion_no}</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-foreground">
            {animal.kind_cd || "품종 미상"}
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
        <h2 className="font-display text-lg font-semibold">공고 상세 안내</h2>
        <p className="mt-1 text-xs text-muted-fg">본문 약 {countSeoChars(seo).toLocaleString("ko-KR")}자</p>
        <div className="mt-5">
          {paragraphs.map((para) => (
            <p key={para.slice(0, 24)}>{para}</p>
          ))}
        </div>
      </section>

      <div className="mt-8">
        <MarketingBanner />
      </div>
    </div>
  );
}
