const TERM_PAIRS: [string, string][] = [
  ["애견미용학원", "dog-grooming-school"],
  ["애견미용", "dog-grooming"],
  ["애견미용사", "groomer"],
  ["애견미용관리사", "grooming-manager"],
  ["펫그루밍", "pet-grooming"],
  ["반려견", "pet-dog"],
  ["강아지", "puppy"],
  ["미용", "grooming"],
  ["자격증", "certificate"],
  ["학원", "academy"],
  ["교육", "education"],
  ["추천", "recommend"],
  ["수강", "course"],
];

export function englishSlugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function keywordToEnglishSlug(keyword: string): string {
  let translated = keyword.trim();
  for (const [kr, en] of TERM_PAIRS) {
    translated = translated.split(kr).join(` ${en} `);
  }
  return englishSlugify(translated);
}

export function buildSeoSlug(
  keyword: string,
  pageId: string,
  aiSlug?: string
): string {
  const fromAi = aiSlug ? englishSlugify(aiSlug) : "";
  if (fromAi) return fromAi;

  const keywordPart = keywordToEnglishSlug(keyword);
  if (keywordPart) return keywordPart;

  return pageId.replace(/^page-/, "");
}

export async function ensureUniqueSeoSlug(
  baseSlug: string,
  existingSlugs: string[]
): Promise<string> {
  const taken = new Set(existingSlugs);
  if (!taken.has(baseSlug)) return baseSlug;

  let i = 2;
  while (taken.has(`${baseSlug}-${i}`)) i++;
  return `${baseSlug}-${i}`;
}
