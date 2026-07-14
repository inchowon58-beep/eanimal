import { NextResponse } from "next/server";
import { syncPetTravel } from "@/lib/travel/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorize(req: Request): boolean {
  const secret = process.env.CRON_SECRET || process.env.SYNC_SECRET;
  if (!secret) {
    return process.env.NODE_ENV === "development" && process.env.ALLOW_DEV_SYNC === "1";
  }
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("secret") === secret;
}

export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const maxPages = url.searchParams.get("maxPages");
  const enrich = url.searchParams.get("enrich") !== "0";
  const result = await syncPetTravel({
    maxPages: maxPages ? Number(maxPages) : undefined,
    enrichDetails: enrich,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export async function POST(req: Request) {
  return GET(req);
}
