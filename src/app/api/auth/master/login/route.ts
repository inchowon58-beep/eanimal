import { NextRequest, NextResponse } from "next/server";
import {
  createMasterSession,
  setMasterSessionCookie,
  validateMasterPassword,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!validateMasterPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await createMasterSession();
  await setMasterSessionCookie(token);

  return NextResponse.json({ success: true });
}
