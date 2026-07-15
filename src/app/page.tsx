import Link from "next/link";
import type { ReactNode } from "react";
import MarketingBanner from "@/components/places/MarketingBanner";
import PlaceCard from "@/components/places/PlaceCard";
import PortalSearch from "@/components/layout/PortalSearch";
import QuickServices from "@/components/home/QuickServices";
import RemoteImage from "@/components/media/RemoteImage";
import { listPlaces } from "@/lib/places/queries";
import { listRescues } from "@/lib/rescues/queries";
import { formatHappenDt, sexLabel } from "@/lib/rescues/types";
import { listTravel } from "@/lib/travel/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [hospitals, funerals, rescues, travel] = await Promise.all([
    listPlaces({ category: "동물병원", page: 1, pageSize: 6 }),
    listPlaces({ category: "동물장묘업", page: 1, pageSize: 6 }),
    listRescues({ page: 1 }),
    listTravel({ page: 1 }),
  ]);

  const rescueItems = rescues.items.filter((r) => r.image_url).slice(0, 8);
  const travelItems = travel.items.filter((t) => t.image_url).slice(0, 6);

  return (
    <div>
      {/* 히어로 · 검색 · 퀵 아이콘 */}
      <section className="border-b border-border bg-[linear-gradient(180deg,#eef6f4_0%,#f8faf9_55%,#ffffff_100%)]">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-10">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              전국 반려동물 인프라 포털
            </h1>
            <div className="mx-auto mt-5 max-w-2xl sm:mt-6">
              <PortalSearch large />
            </div>
          </div>
          <QuickServices className="mx-auto mt-8 max-w-3xl" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6 sm:py-12">
        <MarketingBanner />

        {/* 유기동물 공고 */}
        <PortalBlock
          title="유기동물보호센터 공고"
          href="/rescues"
          moreLabel="공고 더보기"
        >
          {rescueItems.length === 0 ? (
            <Empty hint="공고 데이터를 불러오는 중이거나 이미지가 있는 항목이 없습니다." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {rescueItems.map((item) => (
                <Link
                  key={item.desertion_no}
                  href={`/rescues/${encodeURIComponent(item.desertion_no)}`}
                  className="overflow-hidden rounded-xl border border-border bg-card transition hover:border-accent/40"
                >
                  <div className="relative aspect-[4/3] bg-muted">
                    <RemoteImage src={item.image_url} alt={item.kind_cd || "구조동물"} />
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] text-muted-fg">
                      {formatHappenDt(item.happen_dt)}
                    </p>
                    <h3 className="mt-0.5 line-clamp-1 text-sm font-semibold text-foreground">
                      {item.kind_cd || "품종 미상"}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-fg">
                      {item.happen_place || "장소 미상"} · {sexLabel(item.sex_cd)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </PortalBlock>

        {/* 동물병원 */}
        <PortalBlock
          title="동물병원"
          href="/places?category=%EB%8F%99%EB%AC%BC%EB%B3%91%EC%9B%90"
          moreLabel="병원 더보기"
        >
          {hospitals.items.length === 0 ? (
            <Empty hint="등록된 동물병원이 없습니다." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {hospitals.items.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          )}
        </PortalBlock>

        {/* 장묘 */}
        <PortalBlock
          title="강아지장례·동물장묘업"
          href="/places?category=%EB%8F%99%EB%AC%BC%EC%9E%A5%EB%AC%98%EC%97%85"
          moreLabel="장묘업체 더보기"
        >
          {funerals.items.length === 0 ? (
            <Empty hint="등록된 장묘업체가 없습니다." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {funerals.items.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          )}
        </PortalBlock>

        {/* 동반여행 */}
        <PortalBlock
          title="반려동물 동반여행"
          href="/travel"
          moreLabel="여행지 더보기"
        >
          {travelItems.length === 0 ? (
            <Empty hint="동반여행 장소를 불러오는 중입니다." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {travelItems.map((item) => (
                <Link
                  key={item.content_id}
                  href={`/travel/${encodeURIComponent(item.content_id)}`}
                  className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-accent/40"
                >
                  <div className="relative aspect-[16/10] bg-muted">
                    <RemoteImage src={item.image_url} alt={item.title} />
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-1 font-semibold text-foreground group-hover:text-accent">
                      {item.title}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-sm text-muted-fg">
                      {[item.sido, item.address].filter(Boolean).join(" · ") ||
                        "주소 미상"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </PortalBlock>

        {/* 약국 바로가기 밴드 */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                동물약국 인허가 정보
              </h2>
              <p className="mt-1 text-sm text-muted-fg">
                지역별 동물약국 영업 현황을 바로 확인하세요.
              </p>
            </div>
            <Link
              href="/places?category=%EB%8F%99%EB%AC%BC%EC%95%BD%EA%B5%AD"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg"
            >
              동물약국 보기
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function PortalBlock({
  title,
  href,
  moreLabel,
  children,
}: {
  title: string;
  href: string;
  moreLabel: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {title}
        </h2>
        <Link
          href={href}
          className="shrink-0 text-sm font-medium text-accent hover:underline"
        >
          {moreLabel}
        </Link>
      </div>
      {children}
    </section>
  );
}

function Empty({ hint }: { hint: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-10 text-center text-sm text-muted-fg">
      {hint}
    </p>
  );
}
