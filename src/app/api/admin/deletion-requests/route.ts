import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/admin-auth";
import { getSupabaseService } from "@/lib/supabase/server";
import { parseTargetUrl, setTargetHidden } from "@/lib/deletion/target";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
}

/** 삭제처리(done=true) 또는 복원(done=false) */
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

  const { data: row, error: fetchErr } = await supabase
    .from("deletion_requests")
    .select("id, target_url")
    .eq("id", body.id)
    .maybeSingle();

  if (fetchErr || !row) {
    return NextResponse.json(
      { ok: false, error: "요청을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const target = parseTargetUrl(row.target_url as string);
  if (!target) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "URL에서 삭제할 페이지를 인식하지 못했습니다. (/places, /rescues, /travel 상세 주소인지 확인해 주세요)",
      },
      { status: 422 }
    );
  }

  const { matched, error: hideErr } = await setTargetHidden(target, done);
  if (hideErr) {
    return NextResponse.json({ ok: false, error: hideErr }, { status: 500 });
  }

  const { error: updErr } = await supabase
    .from("deletion_requests")
    .update({ status: done ? "done" : "pending" })
    .eq("id", body.id);

  if (updErr) {
    return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    status: done ? "done" : "pending",
    kind: target.kind,
    matched,
  });
}

/** 문의(요청) 내역 자체 삭제 */
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

  const { error } = await supabase.from("deletion_requests").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
