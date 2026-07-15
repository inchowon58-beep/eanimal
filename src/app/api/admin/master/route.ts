import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/admin-auth";
import { MASTER_PASSWORD } from "@/lib/site";
import { getSeoSettings, saveSeoSettings } from "@/lib/seo-pages/settings";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
}

function checkMaster(password: unknown): boolean {
  return typeof password === "string" && password === MASTER_PASSWORD;
}

/** action: "auth" | "save" — 마스터 비밀번호를 매 요청에 함께 전달 */
export async function POST(req: Request) {
  if (!(await isAdminLoggedIn())) return unauthorized();

  const body = (await req.json().catch(() => null)) as {
    password?: string;
    action?: "auth" | "save";
    dailyLimit?: number;
    serviceExpiresAt?: string | null;
  } | null;

  if (!checkMaster(body?.password)) {
    return NextResponse.json(
      { ok: false, error: "마스터 비밀번호가 올바르지 않습니다." },
      { status: 403 }
    );
  }

  if (body?.action === "save") {
    const { error } = await saveSeoSettings({
      daily_limit: body.dailyLimit,
      service_expires_at: body.serviceExpiresAt ?? undefined,
    });
    if (error) return NextResponse.json({ ok: false, error }, { status: 500 });
  }

  const settings = await getSeoSettings();
  return NextResponse.json({
    ok: true,
    settings: {
      dailyLimit: settings.daily_limit,
      serviceExpiresAt: settings.service_expires_at,
    },
  });
}
