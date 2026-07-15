import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/admin-auth";
import { getSupabaseService } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const BUCKET = "banners";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const supabase = getSupabaseService();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "service role 키가 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "파일이 없습니다." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "이미지는 5MB 이하만 업로드할 수 있습니다." },
      { status: 400 }
    );
  }

  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || "png"}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || "image/png",
    upsert: false,
  });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: `업로드 실패: ${error.message} (Supabase에 '${BUCKET}' 버킷이 있는지 확인해 주세요)`,
      },
      { status: 500 }
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl });
}
