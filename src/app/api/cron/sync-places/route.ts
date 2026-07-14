import { NextResponse } from "next/server";
import { syncPlacesFromPublicData } from "@/lib/public-data/sync";
import { PLACE_CATEGORIES, type PlaceCategory } from "@/lib/site";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorize(req: Request): boolean {
  const secret = process.env.CRON_SECRET || process.env.SYNC_SECRET;
  if (!secret) {
    // 로컬 개발: secret 없으면 허용하지 않음 (실수 방지). DEV만 예외.
    return process.env.NODE_ENV === "development" && process.env.ALLOW_DEV_SYNC === "1";
  }
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const url = new URL(req.url);
  return url.searchParams.get("secret") === secret;
}

function parseCategories(req: Request): PlaceCategory[] | undefined {
  const url = new URL(req.url);
  const raw = url.searchParams.get("category");
  if (!raw) return undefined;
  if (PLACE_CATEGORIES.includes(raw as PlaceCategory)) {
    return [raw as PlaceCategory];
  }
  return undefined;
}

async function handle(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const maxPages = url.searchParams.get("maxPages");
  const pageSize = url.searchParams.get("pageSize");

  const result = await syncPlacesFromPublicData({
    categories: parseCategories(req),
    maxPages: maxPages ? Number(maxPages) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
