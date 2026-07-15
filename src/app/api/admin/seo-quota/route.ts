import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/admin-auth";
import { getQuotaStatus } from "@/lib/seo-pages/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
  }
  const quota = await getQuotaStatus();
  return NextResponse.json(quota);
}
