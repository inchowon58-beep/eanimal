import Link from "next/link";
import { listCategoryGuidePool } from "@/lib/seo-pages/store";

interface Props {
  category: string | null | undefined;
  currentSlug: string;
  categoryLabel?: string;
}

/** 같은 카테고리에서 생성된 글을 랜덤 30개 가로 스크롤로 노출 (키워드 링크) */
export default async function RelatedGuides({ category, currentSlug, categoryLabel }: Props) {
  const pool = await listCategoryGuidePool(category, currentSlug, 300);
  if (pool.length === 0) return null;

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const items = shuffled.slice(0, 30);

  return (
    <section className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-8">
      <h2 className="font-display text-lg font-semibold text-foreground">반려동물 관련 정보</h2>
      <p className="mt-1 text-xs text-muted-fg">
        {categoryLabel ? `${categoryLabel} ` : ""}관련해 함께 보면 좋은 정보들을 모았습니다.
      </p>

      <div className="scroll-row mt-5 flex gap-3 overflow-x-auto pb-3">
        {items.map((it) => (
          <Link
            key={it.slug}
            href={`/guide/${encodeURIComponent(it.slug)}`}
            className="group flex w-[190px] shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-background transition hover:border-accent"
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-muted/30">
              {it.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={it.image_url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl text-muted-fg/40">
                  🐾
                </div>
              )}
            </div>
            <div className="p-3">
              <span className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-accent">
                {it.keyword}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
