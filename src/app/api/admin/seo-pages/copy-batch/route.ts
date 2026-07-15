import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/admin-auth";
import {
  getCopyStats,
  getUncopiedBatch,
  markCopied,
  resetCopied,
} from "@/lib/seo-pages/store";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 50;

function unauthorized() {
  return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
}

/** 다음 복사 대상(최대 50개, 오래된 순) + 통계 */
export async function GET() {
  if (!(await isAdminLoggedIn())) return unauthorized();
  const [items, stats] = await Promise.all([
    getUncopiedBatch(BATCH_SIZE),
    getCopyStats(),
  ]);
  return NextResponse.json({
    ok: true,
    items,
    total: stats.total,
    copied: stats.copied,
    remaining: Math.max(0, stats.total - stats.copied),
  });
}

/** 복사한 페이지들을 복사됨으로 표시 */
export async function POST(req: Request) {
  if (!(await isAdminLoggedIn())) return unauthorized();
  const body = (await req.json().catch(() => null)) as { ids?: string[] } | null;
  const ids = Array.isArray(body?.ids) ? body!.ids.filter((x) => typeof x === "string") : [];
  if (ids.length === 0) {
    return NextResponse.json({ ok: false, error: "대상이 없습니다." }, { status: 400 });
  }
  const { error } = await markCopied(ids);
  if (error) return NextResponse.json({ ok: false, error }, { status: 500 });
  return NextResponse.json({ ok: true, marked: ids.length });
}

/** 복사 기록 초기화 */
export async function DELETE() {
  if (!(await isAdminLoggedIn())) return unauthorized();
  const { error } = await resetCopied();
  if (error) return NextResponse.json({ ok: false, error }, { status: 500 });
  return NextResponse.json({ ok: true });
}
