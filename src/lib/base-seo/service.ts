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

function pickCdnImage(
  cdn: string | null | undefined,
  max: number | null | undefined,
  ext: string | null | undefined,
  seed: string
): string | null {
  const base = (cdn || "").trim().replace(/\/$/, "");
  const n = Number(max) || 0;
  if (!base.startsWith("http") || n < 1) return null;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const num = (Math.abs(h) % n) + 1;
  const e = (ext || "webp").replace(/^\./, "") || "webp";
  return `${base}/${String(num).padStart(2, "0")}.${e}`;
}

export async function createBaseSeoFromKeyword(
  keywordRaw: string,
  categoryRaw: string,
  opts?: {
    publishSource?: "web" | "local";
    imageUrl?: string | null;
    imageCdn?: string | null;
    imageMax?: number | null;
    imageExt?: string | null;
    skipIndexNow?: boolean;
    skipRevalidate?: boolean;
  }
): Promise<BaseSeoPage> {
  const keyword = keywordRaw.trim();
  const category = categoryRaw.trim();
  if (!keyword) throw new BaseSeoError("키워드를 입력해 주세요.");
  if (!isValidCategory(category)) {
    throw new BaseSeoError("유효한 카테고리를 선택해 주세요.");
  }

  const imageUrl =
    (opts?.imageUrl || "").trim() ||
    pickCdnImage(
      opts?.imageCdn,
      opts?.imageMax,
      opts?.imageExt,
      `${keyword}|${category}`
    ) ||
    null;

  const draft = generateBaseSeoContent({
    keyword,
    category,
    publishSource: opts?.publishSource || "web",
    imageUrl,
  });

  const { id, error } = await insertBaseSeoPage(draft);
  if (error || !id) {
    throw new BaseSeoError(error || "저장에 실패했습니다.", "STORAGE");
  }

  if (!opts?.skipRevalidate) {
    try {
      const { revalidatePath, revalidateTag } = await import("next/cache");
      revalidatePath(`/info/${draft.slug}`, "page");
      revalidatePath("/sitemap.xml");
      revalidateTag("base-seo-pages", "max");
    } catch {
      /* ignore */
    }
  }

  if (!opts?.skipIndexNow) {
    try {
      const { submitToIndexNow } = await import("@/lib/seo/indexnow");
      await submitToIndexNow([`/info/${draft.slug}`]);
    } catch {
      /* ignore */
    }
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
  opts?: {
    publishSource?: "web" | "local";
    imageCdn?: string | null;
    imageMax?: number | null;
    imageExt?: string | null;
    items?: { keyword: string; imageUrl?: string | null }[];
    skipIndexNow?: boolean;
  }
): Promise<{ created: BaseSeoPage[]; errors: { keyword: string; error: string }[] }> {
  const created: BaseSeoPage[] = [];
  const errors: { keyword: string; error: string }[] = [];

  const list = opts?.items?.length
    ? opts.items
    : keywords.map((keyword) => ({ keyword, imageUrl: null as string | null }));

  for (const item of list) {
    const keyword = String(item.keyword || "").trim();
    if (!keyword) continue;
    try {
      const page = await createBaseSeoFromKeyword(keyword, category, {
        publishSource: opts?.publishSource || "local",
        imageUrl: item.imageUrl,
        imageCdn: opts?.imageCdn,
        imageMax: opts?.imageMax,
        imageExt: opts?.imageExt,
        skipIndexNow: true,
        skipRevalidate: true,
      });
      created.push(page);
    } catch (e) {
      errors.push({
        keyword,
        error: e instanceof Error ? e.message : "실패",
      });
    }
  }

  if (created.length) {
    try {
      const { revalidatePath, revalidateTag } = await import("next/cache");
      revalidatePath("/sitemap.xml");
      revalidateTag("base-seo-pages", "max");
      for (const p of created.slice(0, 40)) {
        revalidatePath(`/info/${p.slug}`, "page");
      }
    } catch {
      /* ignore */
    }
  }

  if (!opts?.skipIndexNow && created.length) {
    try {
      const { submitToIndexNow } = await import("@/lib/seo/indexnow");
      await submitToIndexNow(created.map((p) => `/info/${p.slug}`));
    } catch {
      /* ignore */
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
