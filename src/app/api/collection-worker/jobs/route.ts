import { NextResponse } from "next/server";
import {
  getPendingCollectionJobs,
  reportCollectionResults,
  type CollectionResult,
} from "@/lib/collection/store";
import { SITE } from "@/lib/site";
import { verifyWorkerRequest } from "@/lib/seo-pages/worker-auth";

export const dynamic = "force-dynamic";

/**
 * VM 수집 프로그램 — 대기 중인 웹문서 URL 목록 조회
 * GET /api/collection-worker/jobs?siteUrl=https://www.eanimal.kr
 * Authorization: Bearer {CRON_SECRET | SYNC_SECRET | COLLECTION_WORKER_SECRET}
 */
export async function GET(request: Request) {
  if (!verifyWorkerRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paramSite = new URL(request.url).searchParams.get("siteUrl")?.trim();
  const siteUrl = paramSite || SITE.url.replace(/\/$/, "");
  const jobs = await getPendingCollectionJobs();

  return NextResponse.json(
    { siteUrl, count: jobs.length, jobs },
    { headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * VM 수집 프로그램 — 처리 결과 보고
 * POST body: { results: [{ id, status: "submitted"|"failed", error? }] }
 */
export async function POST(request: Request) {
  if (!verifyWorkerRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const results = body?.results as CollectionResult[] | undefined;

  if (!Array.isArray(results) || results.length === 0) {
    return NextResponse.json({ error: "results 배열 필요" }, { status: 400 });
  }

  const updated = await reportCollectionResults(results);
  return NextResponse.json({ ok: true, updated });
}
