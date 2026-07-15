import { NextResponse } from "next/server";
import { getQuotaStatus } from "@/lib/seo-pages/settings";
import { listSeoJobs } from "@/lib/seo-pages/store";
import { nextKstMidnightIso, secondsUntilKstMidnight } from "@/lib/seo-pages/service";
import { verifyWorkerRequest } from "@/lib/seo-pages/worker-auth";
import type { SeoJob } from "@/lib/seo-pages/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * VM SEO 생성 프로그램 — 대기 키워드 목록 + 일일 한도 상태 (폼스키 규격 호환)
 * GET /api/seo-worker/jobs
 * Authorization: Bearer <CRON_SECRET | SYNC_SECRET | COLLECTION_WORKER_SECRET>
 *
 * shouldPause === true 이면 generate-next 호출하지 말고 retryAfterSec 만큼 대기.
 */
export async function GET(req: Request) {
  if (!verifyWorkerRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [jobs, quota] = await Promise.all([listSeoJobs(), getQuotaStatus()]);

  const summary = { pending: 0, processing: 0, completed: 0, failed: 0, total: jobs.length };
  for (const j of jobs) {
    if (j.status in summary) (summary as Record<string, number>)[j.status] += 1;
  }

  const pendingJobs = jobs
    .filter((j) => j.status === "pending")
    .sort((a: SeoJob, b: SeoJob) => a.requested_at.localeCompare(b.requested_at));

  const shouldPause = !quota.service.active || quota.remaining <= 0;
  const retryAfterSec = shouldPause ? secondsUntilKstMidnight() : undefined;
  const nextEligibleAt = shouldPause ? nextKstMidnightIso() : undefined;

  const body = {
    count: pendingJobs.length,
    summary,
    quota: {
      limit: quota.limit,
      used: quota.used,
      remaining: quota.remaining,
      shouldPause,
      retryAfterSec,
      nextEligibleAt,
      service: quota.service,
    },
    dailyLimit: quota.limit,
    usedToday: quota.used,
    remainingToday: quota.remaining,
    shouldPause,
    retryAfterSec,
    nextEligibleAt,
    jobs: pendingJobs.map((j) => ({
      id: j.id,
      keyword: j.keyword,
      requestedAt: j.requested_at,
    })),
  };

  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (shouldPause && retryAfterSec) headers["Retry-After"] = String(retryAfterSec);

  return NextResponse.json(body, { headers });
}

export async function POST(req: Request) {
  return GET(req);
}
