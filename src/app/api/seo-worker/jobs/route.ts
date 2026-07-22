import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 대량등록(VM 대기열) 비활성화 — Vercel 과금 방지.
 * 기존 VM 폴링이 와도 대기 작업이 없다고 응답한다.
 */
function disabled() {
  return NextResponse.json(
    {
      count: 0,
      summary: { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 },
      quota: {
        limit: 0,
        used: 0,
        remaining: 0,
        shouldPause: true,
        retryAfterSec: 86400,
      },
      dailyLimit: 0,
      usedToday: 0,
      remainingToday: 0,
      shouldPause: true,
      retryAfterSec: 86400,
      jobs: [],
      message: "대량등록(SEO 워커)이 비활성화되었습니다.",
    },
    { status: 200, headers: { "Cache-Control": "no-store", "Retry-After": "86400" } }
  );
}

export async function GET() {
  return disabled();
}

export async function POST() {
  return disabled();
}
