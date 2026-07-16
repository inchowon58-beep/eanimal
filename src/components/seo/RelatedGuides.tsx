import Link from "next/link";
import { listCategoryGuidePool } from "@/lib/seo-pages/store";

interface Props {
  category: string | null | undefined;
  currentSlug: string;
  keyword: string;
  categoryLabel?: string;
}

function seededShuffle<T>(arr: T[], seed: string): T[] {
  const a = [...arr];
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  h = Math.abs(h) || 1;
  const rand = () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 같은 카테고리에서 생성된 글을 시드 고정으로 노출 (키워드 카드) */
export default async function RelatedGuides({
  category,
  currentSlug,
  keyword,
  categoryLabel,
}: Props) {
  const pool = await listCategoryGuidePool(category, currentSlug, 300);
  if (pool.length === 0) return null;

  const items = seededShuffle(pool, `${currentSlug}-cards`).slice(0, 30);

  return (
    <section className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-8">
      <h2 className="font-display text-lg font-semibold text-foreground">
        {keyword} 관련 다른지역 정보
      </h2>
      <p className="mt-1 text-xs text-muted-fg">
        다른 지역의 {categoryLabel ? `${categoryLabel} ` : ""}관련 정보도 함께
        확인해 보세요.
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
                  alt={it.keyword}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-fg/50">
                  {categoryLabel || "안내"}
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
