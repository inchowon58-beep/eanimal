import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    category?: string;
    name?: string;
    phone?: string;
    answers?: Record<string, string>;
    agreed?: boolean;
    sourceSlug?: string;
    sourceKeyword?: string;
    pageUrl?: string;
  } | null;

  const name = body?.name?.trim() || "";
  const phone = body?.phone?.trim() || "";
  const category = body?.category?.trim() || "";
  const agreed = Boolean(body?.agreed);

  if (!name || !phone) {
    return NextResponse.json(
      { ok: false, error: "성함과 연락처를 입력해 주세요." },
      { status: 400 }
    );
  }
  if (!agreed) {
    return NextResponse.json(
      { ok: false, error: "개인정보 수집 및 이용에 동의해 주세요." },
      { status: 400 }
    );
  }
  if (name.length > 100 || phone.length > 40) {
    return NextResponse.json({ ok: false, error: "입력 길이가 너무 깁니다." }, { status: 400 });
  }

  // 동적 필드 값 정리
  const answers: Record<string, string> = {};
  if (body?.answers && typeof body.answers === "object") {
    for (const [k, v] of Object.entries(body.answers)) {
      if (typeof v === "string" && v.trim()) answers[k] = v.trim().slice(0, 2000);
    }
  }

  // 자동 수집 항목
  const h = req.headers;
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "";
  const referrer = h.get("referer") || "";
  const userAgent = h.get("user-agent") || "";

  const supabase = getSupabaseService() || getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "DB 연결이 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  const { error } = await supabase.from("consultation_requests").insert({
    category,
    name,
    phone,
    answers,
    agreed,
    source_slug: body?.sourceSlug?.trim() || "",
    source_keyword: body?.sourceKeyword?.trim() || "",
    page_url: body?.pageUrl?.trim() || "",
    referrer,
    ip,
    user_agent: userAgent,
  });

  if (error) {
    console.error("[consultation_requests]", error.message);
    return NextResponse.json(
      { ok: false, error: "접수에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
