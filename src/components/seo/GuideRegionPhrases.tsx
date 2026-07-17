import Link from "next/link";
import { getCategory } from "@/lib/seo-pages/categories";
import type { RelatedGuideItem } from "@/lib/seo-pages/store";
import { buildGuideHashtags } from "@/lib/seo/region-keywords";

interface Props {
  category: string | null | undefined;
  currentSlug: string;
  keyword: string;
  sido?: string | null;
  sigungu?: string | null;
  /** 페이지에서 한 번 조회한 풀을 넘기면 추가 DB 없음 */
  pool?: RelatedGuideItem[];
}

/**
 * 유아독존식 지역 연관어 스트립.
 * - 지역×카테고리 롱테일 문구를 노출
 * - 실제 가이드 페이지가 있으면 링크로, 없으면 텍스트만 (도어웨이 방지)
 */
export default function GuideRegionPhrases({
  category,
  currentSlug,
  keyword,
  sido,
  sigungu,
  pool = [],
}: Props) {
  if (!sido && !sigungu) return null;

  const cat = getCategory(category);
  if (!cat) return null;

  const phrases = buildGuideHashtags({
    sido,
    sigungu,
    stems: cat.hashtagStems,
    genericTags: cat.genericTags.slice(0, 3),
    seed: currentSlug,
    min: 5,
    max: 8,
  }).filter((p) => p.replace(/\s+/g, "") !== keyword.replace(/\s+/g, ""));

  if (!phrases.length) return null;

  const byCompact = new Map(
    pool.map((p) => [p.keyword.replace(/\s+/g, ""), p.slug])
  );

  const regionLabel = [sido, sigungu].filter(Boolean).join(" ");

  return (
    <section className="mt-5 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-4 sm:px-5">
      <h2 className="text-sm font-semibold text-foreground">
        {regionLabel} 관련 검색어
      </h2>
      <p className="mt-1 text-xs text-muted-fg">
        같은 지역에서 자주 찾는 주제입니다. 안내 문서가 있는 항목은 바로 이동할 수
        있습니다.
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {phrases.map((phrase) => {
          const slug = byCompact.get(phrase.replace(/\s+/g, ""));
          if (slug) {
            return (
              <li key={phrase}>
                <Link
                  href={`/guide/${encodeURIComponent(slug)}`}
                  className="inline-block rounded-md bg-background px-2.5 py-1 text-xs font-medium text-accent underline-offset-2 hover:underline"
                >
                  {phrase}
                </Link>
              </li>
            );
          }
          return (
            <li key={phrase}>
              <span className="inline-block rounded-md bg-background/80 px-2.5 py-1 text-xs text-muted-fg">
                {phrase}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
