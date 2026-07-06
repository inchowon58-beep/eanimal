import { getPages } from "./data";
import { guidePageUrl } from "./constants";
import { resolveSeoPage, type SiteConfig } from "./site-config";

export interface RelatedPageLink {
  slug: string;
  href: string;
  title: string;
  description: string;
  keyword: string;
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  for (let i = arr.length - 1; i > 0; i--) {
    hash = (hash * 1664525 + 1013904223) | 0;
    const j = Math.abs(hash) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function getRelatedPages(
  currentSlug: string,
  config: SiteConfig,
  count = 5
): Promise<RelatedPageLink[]> {
  const all = await getPages();
  const others = all.filter((p) => p.slug !== currentSlug);
  if (others.length === 0) return [];

  const picked = seededShuffle(others, currentSlug).slice(0, Math.min(count, others.length));

  return picked.map((page) => {
    const resolved = resolveSeoPage(page, config);
    const desc = resolved.description.trim();
    return {
      slug: page.slug,
      href: guidePageUrl(page.slug),
      title: resolved.title,
      description: desc.length > 120 ? `${desc.slice(0, 120)}…` : desc,
      keyword: page.keyword,
    };
  });
}
