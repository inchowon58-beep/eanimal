import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** 배포 버전 확인용 — Vercel 배포 후 commit SHA 비교 */
export async function GET() {
  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local",
    ref: process.env.VERCEL_GIT_COMMIT_REF || "local",
    env: process.env.VERCEL_ENV || "development",
    builtAt: new Date().toISOString(),
    features: {
      seoRankings: true,
      adminRankUi: true,
    },
  });
}
