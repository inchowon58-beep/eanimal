import { NextResponse } from "next/server";
import { clearSessionCookieOptions } from "@/lib/admin-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const opt = clearSessionCookieOptions();
  res.cookies.set(opt.name, opt.value, opt);
  return res;
}
