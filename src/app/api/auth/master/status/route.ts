import { NextResponse } from "next/server";
import { isMasterAuthenticated } from "@/lib/auth";

export async function GET() {
  const authed = await isMasterAuthenticated();
  return NextResponse.json({ authenticated: authed });
}
