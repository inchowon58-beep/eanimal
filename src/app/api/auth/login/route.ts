import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  setSessionCookie,
  validateCredentials,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!validateCredentials(username, password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSession();
  await setSessionCookie(token);

  return NextResponse.json({ success: true });
}
