import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { runAllRankingChecks } from "@/lib/seo-ranking";

export const maxDuration = 60;

/** 관리자 수동 순위 확인 */
export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runAllRankingChecks();
  return NextResponse.json({ ok: true, ...result });
}
