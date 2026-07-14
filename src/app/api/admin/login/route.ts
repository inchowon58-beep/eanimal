import { NextResponse } from "next/server";
import {
  createSessionToken,
  sessionCookieOptions,
  verifyCredentials,
} from "@/lib/admin-auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    username?: string;
    password?: string;
  } | null;

  if (
    !body?.username ||
    !body?.password ||
    !verifyCredentials(body.username, body.password)
  ) {
    return NextResponse.json(
      { ok: false, error: "아이디 또는 비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  }

  const token = createSessionToken();
  const res = NextResponse.json({ ok: true });
  const opt = sessionCookieOptions(token);
  res.cookies.set(opt.name, opt.value, opt);
  return res;
}
