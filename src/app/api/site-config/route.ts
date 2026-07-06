import { NextResponse } from "next/server";
import { getSiteConfig, toPublicConfig } from "@/lib/site-config";

export async function GET() {
  const config = await getSiteConfig();
  return NextResponse.json(toPublicConfig(config));
}
