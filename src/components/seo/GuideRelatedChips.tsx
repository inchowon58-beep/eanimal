import Link from "next/link";
import { listCategoryGuidePool } from "@/lib/seo-pages/store";

interface Props {
  category: string | null | undefined;
  currentSlug: string;
  keyword: string;
  categoryLabel?: string;
  /** 본문 직후 칩바용 (기본 18) */
  limit?: number;
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

/**
 * aga식 동종 랜딩 칩바 — 같은 카테고리 가이드를 키워드 칩으로 내부링크.
 * 시드 고정 셔플로 크롤마다 결과가 흔들리지 않게 함.
 */
export default async function GuideRelatedChips({
  category,
  currentSlug,
  keyword,
  categoryLabel,
  limit = 18,
}: Props) {
  const pool = await listCategoryGuidePool(category, currentSlug, 300);
  if (pool.length === 0) return null;

  const items = seededShuffle(pool, currentSlug).slice(0, limit);

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-foreground">
        {categoryLabel ? `${categoryLabel} · ` : ""}
        관련 지역 안내
      </h2>
      <p className="mt-1 text-xs text-muted-fg">
        {keyword}와 같은 주제의 다른 지역 안내를 함께 확인해 보세요.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((it) => (
          <Link
            key={it.slug}
            href={`/guide/${encodeURIComponent(it.slug)}`}
            className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:border-accent hover:text-accent"
          >
            {it.keyword}
          </Link>
        ))}
      </div>
    </section>
  );
}
