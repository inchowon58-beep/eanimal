import { buildSlug, generateSeoContent, normalizeKeyword } from "@/lib/seo-pages/generate";
import { consumeQuota, getQuotaStatus } from "@/lib/seo-pages/settings";
import {
  claimNextPendingJob,
  finishJob,
  insertSeoPage,
  keywordExists,
  slugExists,
} from "@/lib/seo-pages/store";
import type { SeoPage } from "@/lib/seo-pages/types";

export class SeoCreateError extends Error {
  constructor(
    message: string,
    public readonly code: "SERVICE" | "QUOTA" | "DUPLICATE" | "GENERATE" | "STORAGE"
  ) {
    super(message);
    this.name = "SeoCreateError";
  }
}

const MAX_BULK = 500;

export function parseKeywords(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of (text || "").split(/[\n,]+/)) {
    const k = normalizeKeyword(raw);
    if (!k) continue;
    const norm = k.replace(/\s+/g, "");
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(k);
    if (out.length >= MAX_BULK) break;
  }
  return out;
}

async function uniqueSlug(keyword: string, geminiSlug?: string): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const slug = buildSlug(keyword, geminiSlug);
    if (!(await slugExists(slug))) return slug;
  }
  return `${buildSlug(keyword)}-${Date.now().toString(36)}`;
}

/** 키워드 1개로 SEO 페이지 생성 (쿼터/기간/중복 검사 포함) */
export async function createSeoPageFromKeyword(rawKeyword: string): Promise<SeoPage> {
  const keyword = normalizeKeyword(rawKeyword);
  if (!keyword) throw new SeoCreateError("키워드가 비어 있습니다.", "GENERATE");

  const quota = await getQuotaStatus();
  if (!quota.service.active) {
    throw new SeoCreateError(
      "사용 기간이 만료되었습니다. 마스터 설정에서 사용가능일을 연장해 주세요.",
      "SERVICE"
    );
  }
  if (quota.remaining <= 0) {
    throw new SeoCreateError(
      `오늘 발행 한도(${quota.limit}개)를 모두 사용했습니다.`,
      "QUOTA"
    );
  }

  if (await keywordExists(keyword)) {
    throw new SeoCreateError(`이미 등록된 키워드입니다: ${keyword}`, "DUPLICATE");
  }

  let generated;
  try {
    generated = await generateSeoContent(keyword);
  } catch (e) {
    throw new SeoCreateError(
      e instanceof Error ? e.message : "콘텐츠 생성에 실패했습니다.",
      "GENERATE"
    );
  }

  const slug = await uniqueSlug(keyword, generated.slug);

  const { id, error } = await insertSeoPage({
    slug,
    keyword,
    region_name: generated.region,
    title: generated.title,
    description: generated.description,
    content: generated.content,
    faqs: generated.faqs,
    image_url: null,
  });

  if (error || !id) {
    throw new SeoCreateError(error || "페이지 저장에 실패했습니다.", "STORAGE");
  }

  await consumeQuota();

  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath(`/guide/${slug}`);
    revalidatePath("/sitemap.xml");
  } catch {
    /* not in request context */
  }

  return {
    id,
    slug,
    keyword,
    region_name: generated.region,
    title: generated.title,
    description: generated.description,
    content: generated.content,
    faqs: generated.faqs,
    image_url: null,
    hidden: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export interface ProcessResult {
  ok: boolean;
  status: "generated" | "empty" | "quota" | "service" | "error";
  keyword?: string;
  slug?: string;
  error?: string;
  retryAfterSec?: number;
}

/** KST 자정까지 남은 초 */
function secondsUntilKstMidnight(): number {
  const now = new Date();
  const kstNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const next = new Date(kstNow);
  next.setHours(24, 0, 0, 0);
  return Math.max(60, Math.ceil((next.getTime() - kstNow.getTime()) / 1000));
}

/** VM 워커: 대기열에서 1개 꺼내 생성 */
export async function processNextGenerationJob(): Promise<ProcessResult> {
  const quota = await getQuotaStatus();
  if (!quota.service.active) {
    return { ok: false, status: "service", error: "사용 기간이 만료되었습니다." };
  }
  if (quota.remaining <= 0) {
    return {
      ok: false,
      status: "quota",
      error: "오늘 발행 한도를 모두 사용했습니다.",
      retryAfterSec: secondsUntilKstMidnight(),
    };
  }

  const job = await claimNextPendingJob();
  if (!job) return { ok: true, status: "empty" };

  try {
    const page = await createSeoPageFromKeyword(job.keyword);
    await finishJob(job.id, { status: "completed", pageId: page.id, slug: page.slug });
    return { ok: true, status: "generated", keyword: job.keyword, slug: page.slug };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "생성 실패";
    // 쿼터/기간 사유면 잡을 다시 대기로 되돌리지 않고 실패 처리하지 않음 → 재시도 가능하게 pending 복귀
    if (e instanceof SeoCreateError && (e.code === "QUOTA" || e.code === "SERVICE")) {
      const { getSupabaseService } = await import("@/lib/supabase/server");
      const supabase = getSupabaseService();
      if (supabase) {
        await supabase
          .from("seo_jobs")
          .update({ status: "pending", started_at: null })
          .eq("id", job.id);
      }
      return {
        ok: false,
        status: e.code === "QUOTA" ? "quota" : "service",
        error: msg,
        retryAfterSec: e.code === "QUOTA" ? secondsUntilKstMidnight() : undefined,
      };
    }
    await finishJob(job.id, { status: "failed", error: msg });
    return { ok: false, status: "error", keyword: job.keyword, error: msg };
  }
}
