import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
}

function disabled() {
  return NextResponse.json(
    {
      ok: false,
      error: "대량등록·대기열이 비활성화되었습니다. 키워드 1개씩 즉시 생성만 가능합니다.",
    },
    { status: 410 }
  );
}

/** 대량등록 비활성화 — Vercel 과금 방지 */
export async function GET() {
  if (!(await isAdminLoggedIn())) return unauthorized();
  return disabled();
}

export async function POST() {
  if (!(await isAdminLoggedIn())) return unauthorized();
  return disabled();
}

export async function PUT() {
  if (!(await isAdminLoggedIn())) return unauthorized();
  return disabled();
}
