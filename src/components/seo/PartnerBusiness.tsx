import { getCategoryBusinesses } from "@/lib/seo-pages/settings";

interface Props {
  category: string | null | undefined;
  keyword: string;
}

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}

/**
 * 카테고리에 등록된 참고 업체정보 중 1개를 랜덤 노출.
 * - 상단 배너 아래에 "{키워드} 참고할만한 업체정보" 헤딩 + 업체 카드
 * - 하단 고정 둥근 버튼 "{키워드} 문의" 로 전화 연결
 */
export default async function PartnerBusiness({ category, keyword }: Props) {
  if (!category) return null;
  const all = await getCategoryBusinesses();
  const list = all[category] || [];
  if (list.length === 0) return null;

  const biz = list[Math.floor(Math.random() * list.length)];
  const hasPhone = Boolean(biz.phone.trim());

  return (
    <>
      <section className="mt-5">
        <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
          {keyword} 참고할만한 업체정보
        </h2>

        <div className="mt-3 overflow-hidden rounded-2xl border border-accent/30 bg-card shadow-sm">
          <div className="flex flex-col sm:flex-row">
            {biz.image_url && (
              <div className="relative h-48 w-full shrink-0 bg-muted/30 sm:h-auto sm:w-56">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={biz.image_url}
                  alt={biz.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="flex flex-1 flex-col justify-center gap-2 p-5 sm:p-6">
              <span className="inline-flex w-fit items-center rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                추천 업체
              </span>
              <h3 className="text-lg font-bold text-foreground sm:text-xl">{biz.name}</h3>
              {biz.description && (
                <p className="text-sm leading-relaxed text-muted-fg">{biz.description}</p>
              )}
              {hasPhone && (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <a
                    href={telHref(biz.phone)}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-95"
                  >
                    <span aria-hidden>📞</span>
                    {keyword} 문의하기
                  </a>
                  <span className="text-sm font-medium text-foreground">{biz.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {hasPhone && (
        <a
          href={telHref(biz.phone)}
          className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-accent px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-accent/30 transition hover:brightness-95"
        >
          <span aria-hidden>📞</span>
          {keyword} 문의
        </a>
      )}
    </>
  );
}
