import { NextResponse } from "next/server";
import { processNextGenerationJob } from "@/lib/seo-pages/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * VM SEO 생성 워커 — 대기열에서 1개 꺼내 생성.
 * 인증: Authorization: Bearer <CRON_SECRET | SYNC_SECRET | COLLECTION_WORKER_SECRET>
 *       또는 ?secret= (기존 폼스키 VM 토큰과 호환)
 * 반환: 429(쿼터/기간, Retry-After) · 200(생성/비어있음) · 503(오류)
 */
function authorize(req: Request): boolean {
  const secrets = [
    process.env.CRON_SECRET,
    process.env.SYNC_SECRET,
    process.env.COLLECTION_WORKER_SECRET,
  ].filter((s): s is string => Boolean(s && s.trim()));

  if (secrets.length === 0) {
    return (
      process.env.NODE_ENV === "development" && process.env.ALLOW_DEV_SYNC === "1"
    );
  }

  const auth = req.headers.get("authorization");
  const querySecret = new URL(req.url).searchParams.get("secret");
  return secrets.some(
    (secret) => auth === `Bearer ${secret}` || querySecret === secret
  );
}

export async function POST(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processNextGenerationJob();

  const headers: Record<string, string> = {};
  if (result.retryAfterSec) headers["Retry-After"] = String(result.retryAfterSec);

  let status = 200;
  if (result.status === "quota" || result.status === "service") status = 429;
  else if (result.status === "failed") status = 503;

  return NextResponse.json(result, { status, headers });
}

export async function GET(req: Request) {
  return POST(req);
}
