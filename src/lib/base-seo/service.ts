import { isValidCategory } from "@/lib/seo-pages/categories";
import { SITE } from "@/lib/site";
import { generateBaseSeoContent } from "./template";
import { deleteBaseSeoPage, insertBaseSeoPage } from "./store";
import type { BaseSeoPage } from "./types";

export class BaseSeoError extends Error {
  constructor(
    message: string,
    public code: "VALIDATION" | "STORAGE" = "VALIDATION"
  ) {
    super(message);
    this.name = "BaseSeoError";
  }
}

export async function createBaseSeoFromKeyword(
  keywordRaw: string,
  categoryRaw: string,
  opts?: { publishSource?: "web" | "local"; imageUrl?: string | null }
): Promise<BaseSeoPage> {
  const keyword = keywordRaw.trim();
  const category = categoryRaw.trim();
  if (!keyword) throw new BaseSeoError("키워드를 입력해 주세요.");
  if (!isValidCategory(category)) {
    throw new BaseSeoError("유효한 카테고리를 선택해 주세요.");
  }

  const draft = generateBaseSeoContent({
    keyword,
    category,
    publishSource: opts?.publishSource || "web",
    imageUrl: opts?.imageUrl,
  });

  const { id, error } = await insertBaseSeoPage(draft);
  if (error || !id) {
    throw new BaseSeoError(error || "저장에 실패했습니다.", "STORAGE");
  }

  try {
    const { revalidatePath, revalidateTag } = await import("next/cache");
    revalidatePath(`/info/${draft.slug}`, "page");
    revalidatePath("/sitemap.xml");
    revalidateTag("base-seo-pages", "max");
  } catch {
    /* ignore */
  }

  try {
    const { submitToIndexNow } = await import("@/lib/seo/indexnow");
    await submitToIndexNow([`/info/${draft.slug}`]);
  } catch {
    /* ignore */
  }

  const now = new Date().toISOString();
  return {
    id,
    ...draft,
    hidden: false,
    created_at: now,
    updated_at: now,
  };
}

export async function createBaseSeoBatch(
  keywords: string[],
  category: string,
  opts?: { publishSource?: "web" | "local" }
): Promise<{ created: BaseSeoPage[]; errors: { keyword: string; error: string }[] }> {
  const created: BaseSeoPage[] = [];
  const errors: { keyword: string; error: string }[] = [];
  for (const kw of keywords) {
    const keyword = kw.trim();
    if (!keyword) continue;
    try {
      const page = await createBaseSeoFromKeyword(keyword, category, {
        publishSource: opts?.publishSource || "local",
      });
      created.push(page);
    } catch (e) {
      errors.push({
        keyword,
        error: e instanceof Error ? e.message : "실패",
      });
    }
  }
  return { created, errors };
}

export async function removeBaseSeo(id: string): Promise<void> {
  const { error, slug } = await deleteBaseSeoPage(id);
  if (error) throw new BaseSeoError(error, "STORAGE");
  if (slug) {
    try {
      const { revalidatePath, revalidateTag } = await import("next/cache");
      revalidatePath(`/info/${slug}`, "page");
      revalidateTag("base-seo-pages", "max");
    } catch {
      /* ignore */
    }
  }
}

export function absoluteInfoUrl(slug: string): string {
  return `${SITE.url.replace(/\/$/, "")}/info/${encodeURIComponent(slug)}`;
}
