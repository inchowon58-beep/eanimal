import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    businessName?: string;
    targetUrl?: string;
    reason?: string;
  } | null;

  const businessName = body?.businessName?.trim() || "";
  const targetUrl = body?.targetUrl?.trim() || "";
  const reason = body?.reason?.trim() || "";

  if (!businessName || !targetUrl || !reason) {
    return NextResponse.json(
      { ok: false, error: "모든 항목을 입력해 주세요." },
      { status: 400 }
    );
  }

  if (businessName.length > 200 || targetUrl.length > 500 || reason.length > 2000) {
    return NextResponse.json(
      { ok: false, error: "입력 길이가 너무 깁니다." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseService() || getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "DB 연결이 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  const { error } = await supabase.from("deletion_requests").insert({
    business_name: businessName,
    target_url: targetUrl,
    reason,
  });

  if (error) {
    console.error("[deletion_requests]", error.message);
    return NextResponse.json(
      { ok: false, error: "저장에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
