import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/admin-auth";
import { parseKeywords } from "@/lib/seo-pages/service";
import { enqueueJobs, listSeoJobs, replacePendingJobs } from "@/lib/seo-pages/store";
import { normalizeKeyword } from "@/lib/seo-pages/generate";
import type { SeoJob } from "@/lib/seo-pages/types";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
}

function toItems(text: string) {
  return parseKeywords(text).map((keyword) => ({
    keyword,
    normalized: normalizeKeyword(keyword).replace(/\s+/g, ""),
  }));
}

function summarize(jobs: SeoJob[]) {
  const summary = { pending: 0, processing: 0, completed: 0, failed: 0, total: jobs.length };
  for (const j of jobs) {
    if (j.status in summary) (summary as Record<string, number>)[j.status] += 1;
  }
  return summary;
}

export async function GET(req: Request) {
  if (!(await isAdminLoggedIn())) return unauthorized();

  const jobs = await listSeoJobs();
  const pending = jobs.filter((j) => j.status === "pending");

  if (new URL(req.url).searchParams.get("download") === "txt") {
    const body = pending.map((j) => j.keyword).join("\n");
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="seo-pending-keywords.txt"',
      },
    });
  }

  return NextResponse.json({
    ok: true,
    summary: summarize(jobs),
    jobs,
    pendingText: pending.map((j) => j.keyword).join("\n"),
  });
}

export async function POST(req: Request) {
  if (!(await isAdminLoggedIn())) return unauthorized();
  const body = (await req.json().catch(() => null)) as { text?: string } | null;
  const items = toItems(body?.text || "");
  if (items.length === 0) {
    return NextResponse.json({ ok: false, error: "등록할 키워드가 없습니다." }, { status: 400 });
  }
  const { added, skipped } = await enqueueJobs(items);
  return NextResponse.json({
    ok: true,
    added,
    skipped,
    message: `${added}개 키워드를 대기열에 등록했습니다.${skipped ? ` (중복 등 ${skipped}건 건너뜀)` : ""}`,
  });
}

export async function PUT(req: Request) {
  if (!(await isAdminLoggedIn())) return unauthorized();
  const body = (await req.json().catch(() => null)) as { text?: string } | null;
  const items = toItems(body?.text || "");
  const { added, skipped } = await replacePendingJobs(items);
  return NextResponse.json({
    ok: true,
    added,
    skipped,
    message: `대기열을 저장했습니다. (대기 ${added}개${skipped ? `, 건너뜀 ${skipped}건` : ""})`,
  });
}
