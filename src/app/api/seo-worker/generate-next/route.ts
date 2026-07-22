import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 대량등록(VM 대기열 생성) 비활성화 — Vercel 과금 방지.
 * 기존 VM이 호출해도 생성을 시작하지 않는다.
 */
function disabled() {
  return NextResponse.json(
    {
      ok: false,
      status: "disabled",
      message: "대량등록(SEO 워커 생성)이 비활성화되었습니다. 관리자에서 키워드 1개씩 즉시 생성하세요.",
      remaining: 0,
      shouldPause: true,
      retryAfterSec: 86400,
    },
    { status: 410, headers: { "Cache-Control": "no-store", "Retry-After": "86400" } }
  );
}

export async function POST() {
  return disabled();
}

export async function GET() {
  return disabled();
}
