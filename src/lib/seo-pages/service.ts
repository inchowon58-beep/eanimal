import { buildSlug, generateSeoContent, normalizeKeyword } from "@/lib/seo-pages/generate";
import { consumeQuota, getQuotaStatus } from "@/lib/seo-pages/settings";
import {
  claimNextPendingJob,
  countPendingJobs,
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

  // 생성 즉시 네이버에 색인 통보(IndexNow) — "웹문서 등록요청"을 서버가 자동 처리
  const notifyIndexNow = async () => {
    try {
      const { submitToIndexNow } = await import("@/lib/seo/indexnow");
      await submitToIndexNow([`/guide/${slug}`]);
    } catch {
      /* 통보 실패는 무시 (주간 크론이 재통보) */
    }
  };
  try {
    const { after } = await import("next/server");
    after(notifyIndexNow);
  } catch {
    void notifyIndexNow();
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
    copied_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export interface ProcessResult {
  ok: boolean;
  /** 폼스키 VM 규격과 동일한 상태 문자열 */
  status: "created" | "empty" | "quota" | "service" | "failed";
  message: string;
  keyword?: string;
  slug?: string;
  remaining?: number;
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

/** VM 워커: 대기열에서 1개 꺼내 생성 (응답은 폼스키 VM 규격과 호환) */
export async function processNextGenerationJob(): Promise<ProcessResult> {
  const quota = await getQuotaStatus();
  if (!quota.service.active) {
    return {
      ok: false,
      status: "service",
      message: "사용 기간이 만료되었습니다. 마스터 설정에서 사용가능일을 연장하세요.",
      retryAfterSec: secondsUntilKstMidnight(),
    };
  }
  if (quota.remaining <= 0) {
    return {
      ok: false,
      status: "quota",
      message: `오늘 발행 한도(${quota.limit}개)를 모두 사용했습니다.`,
      retryAfterSec: secondsUntilKstMidnight(),
    };
  }

  const job = await claimNextPendingJob();
  if (!job) {
    return {
      ok: true,
      status: "empty",
      message: "대기 중인 키워드가 없습니다.",
      remaining: 0,
      retryAfterSec: 600,
    };
  }

  try {
    const page = await createSeoPageFromKeyword(job.keyword);
    await finishJob(job.id, { status: "completed", pageId: page.id, slug: page.slug });
    const remaining = await countPendingJobs();
    return {
      ok: true,
      status: "created",
      message: `SEO 페이지 생성 완료: ${job.keyword}`,
      keyword: job.keyword,
      slug: page.slug,
      remaining,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "생성 실패";
    // 쿼터/기간 사유면 실패로 소진하지 않고 다시 대기(pending)로 되돌린다.
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
        message: msg,
        retryAfterSec: secondsUntilKstMidnight(),
      };
    }
    await finishJob(job.id, { status: "failed", error: msg });
    return {
      ok: false,
      status: "failed",
      message: msg,
      keyword: job.keyword,
      error: msg,
      remaining: await countPendingJobs(),
    };
  }
}
