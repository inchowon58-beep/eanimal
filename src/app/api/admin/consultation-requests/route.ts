import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/admin-auth";
import { getSupabaseService } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
}

/** 상태 변경 (pending ↔ done) */
export async function PATCH(req: Request) {
  if (!(await isAdminLoggedIn())) return unauthorized();

  const body = (await req.json().catch(() => null)) as {
    id?: string;
    done?: boolean;
  } | null;
  if (!body?.id) {
    return NextResponse.json({ ok: false, error: "id가 필요합니다." }, { status: 400 });
  }
  const done = Boolean(body.done);

  const supabase = getSupabaseService();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "service role 키가 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  const { error } = await supabase
    .from("consultation_requests")
    .update({ status: done ? "done" : "pending" })
    .eq("id", body.id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: done ? "done" : "pending" });
}

/** 신청 내역 삭제 */
export async function DELETE(req: Request) {
  if (!(await isAdminLoggedIn())) return unauthorized();

  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "id가 필요합니다." }, { status: 400 });
  }

  const supabase = getSupabaseService();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "service role 키가 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  const { error } = await supabase.from("consultation_requests").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
