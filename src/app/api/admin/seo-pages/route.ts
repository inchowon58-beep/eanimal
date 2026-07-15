import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/admin-auth";
import { createSeoPageFromKeyword, SeoCreateError } from "@/lib/seo-pages/service";
import { deleteSeoPage, listSeoPages } from "@/lib/seo-pages/store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function unauthorized() {
  return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
}

export async function GET() {
  if (!(await isAdminLoggedIn())) return unauthorized();
  const pages = await listSeoPages();
  return NextResponse.json({ ok: true, pages });
}

export async function POST(req: Request) {
  if (!(await isAdminLoggedIn())) return unauthorized();
  const body = (await req.json().catch(() => null)) as { keyword?: string } | null;
  const keyword = body?.keyword?.trim();
  if (!keyword) {
    return NextResponse.json({ ok: false, error: "키워드를 입력해 주세요." }, { status: 400 });
  }

  try {
    const page = await createSeoPageFromKeyword(keyword);
    return NextResponse.json({ ok: true, page });
  } catch (e) {
    const status = e instanceof SeoCreateError && e.code === "QUOTA" ? 429 : 500;
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "생성 실패" },
      { status }
    );
  }
}

export async function DELETE(req: Request) {
  if (!(await isAdminLoggedIn())) return unauthorized();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "id가 필요합니다." }, { status: 400 });
  }
  const { error } = await deleteSeoPage(id);
  if (error) return NextResponse.json({ ok: false, error }, { status: 500 });
  return NextResponse.json({ ok: true });
}
