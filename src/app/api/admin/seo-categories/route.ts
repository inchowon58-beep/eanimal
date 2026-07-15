import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/admin-auth";
import { SEO_CATEGORIES, isValidCategory } from "@/lib/seo-pages/categories";
import { getCategoryPools, saveCategoryPool } from "@/lib/seo-pages/settings";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
}

/** 카테고리 목록 + 저장된 풀(없으면 기본값) 반환 */
export async function GET() {
  if (!(await isAdminLoggedIn())) return unauthorized();
  const saved = await getCategoryPools();
  const categories = SEO_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    topic: c.topic,
    pool: saved[c.id] ?? c.defaultPool,
    isDefault: saved[c.id] === undefined,
  }));
  return NextResponse.json({ ok: true, categories });
}

/** 카테고리 1개 풀 저장 */
export async function PUT(req: Request) {
  if (!(await isAdminLoggedIn())) return unauthorized();
  const body = (await req.json().catch(() => null)) as {
    id?: string;
    pool?: string;
  } | null;
  const id = body?.id;
  if (!id || !isValidCategory(id)) {
    return NextResponse.json({ ok: false, error: "유효한 카테고리가 아닙니다." }, { status: 400 });
  }
  const { error } = await saveCategoryPool(id, body?.pool ?? "");
  if (error) return NextResponse.json({ ok: false, error }, { status: 500 });
  return NextResponse.json({ ok: true, message: "연관 키워드를 저장했습니다." });
}
