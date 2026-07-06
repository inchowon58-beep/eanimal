import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  enqueueAllPendingPages,
  enqueueCollectionRequest,
  getCollectionSiteUrl,
  getCollectionStatusMap,
} from "@/lib/collection-queue";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [statusMap, siteUrl] = await Promise.all([
    getCollectionStatusMap(),
    getCollectionSiteUrl(),
  ]);

  return NextResponse.json({
    siteUrl,
    statuses: Object.fromEntries(statusMap),
  });
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { pageId, all } = body as { pageId?: string; all?: boolean };

  if (all) {
    const result = await enqueueAllPendingPages();
    return NextResponse.json({
      ok: true,
      message: `대기열 등록 ${result.added}건, 중복/스킵 ${result.skipped}건`,
      ...result,
    });
  }

  if (!pageId) {
    return NextResponse.json({ error: "pageId 또는 all=true 필요" }, { status: 400 });
  }

  const result = await enqueueCollectionRequest(pageId);
  return NextResponse.json(result, { status: result.ok ? 200 : 409 });
}
