import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { submitToIndexNow } from "@/lib/seo/indexnow";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function authorize(req: Request): boolean {
  const secret = process.env.CRON_SECRET || process.env.SYNC_SECRET;
  if (!secret) {
    return (
      process.env.NODE_ENV === "development" && process.env.ALLOW_DEV_SYNC === "1"
    );
  }
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("secret") === secret;
}

const DEFAULT_TYPES = ["rescues", "travel"] as const;
type SyncType = "rescues" | "travel" | "places";

async function collectUrls(type: SyncType, limit: number): Promise<string[]> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];

  if (type === "rescues") {
    const { data } = await supabase
      .from("rescued_animals")
      .select("desertion_no, updated_at")
      .eq("hidden", false)
      .order("updated_at", { ascending: false })
      .limit(limit);
    return (data ?? []).map(
      (r) => `/rescues/${encodeURIComponent(r.desertion_no)}`
    );
  }
  if (type === "travel") {
    const { data } = await supabase
      .from("pet_travel")
      .select("content_id, updated_at")
      .eq("hidden", false)
      .order("updated_at", { ascending: false })
      .limit(limit);
    return (data ?? []).map(
      (r) => `/travel/${encodeURIComponent(r.content_id)}`
    );
  }
  const { data } = await supabase
    .from("places")
    .select("id, updated_at")
    .eq("hidden", false)
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => `/places/${r.id}`);
}

export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const typesParam = url.searchParams.get("types");
  const types = (
    typesParam
      ? (typesParam.split(",").map((t) => t.trim()) as SyncType[])
      : [...DEFAULT_TYPES]
  ).filter((t): t is SyncType =>
    ["rescues", "travel", "places"].includes(t)
  );
  const limit = Math.min(
    5000,
    Math.max(1, Number(url.searchParams.get("limit") || 2000))
  );

  const collected: string[] = [];
  const perType: Record<string, number> = {};
  for (const type of types) {
    const urls = await collectUrls(type, limit);
    perType[type] = urls.length;
    collected.push(...urls);
  }

  const result = await submitToIndexNow(collected);
  return NextResponse.json(
    { ...result, perType, types },
    { status: result.ok || result.skipped ? 200 : 500 }
  );
}

export async function POST(req: Request) {
  return GET(req);
}
