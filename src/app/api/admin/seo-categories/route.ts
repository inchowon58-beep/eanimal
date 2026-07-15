import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/admin-auth";
import { SEO_CATEGORIES, isValidCategory } from "@/lib/seo-pages/categories";
import { listFolderImages } from "@/lib/seo-pages/images";
import { defaultCategoryForm, type CategoryForm } from "@/lib/consultation/forms";
import {
  getCategoryForms,
  getCategoryImages,
  getCategoryPools,
  getCategoryTelegram,
  saveCategoryConfig,
} from "@/lib/seo-pages/settings";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
}

/** 카테고리 목록 + 저장된 풀/이미지폴더(없으면 기본값) 반환. ?folder= 있으면 이미지 미리보기. */
export async function GET(req: Request) {
  if (!(await isAdminLoggedIn())) return unauthorized();

  const folderParam = new URL(req.url).searchParams.get("folder");
  if (folderParam !== null) {
    const urls = await listFolderImages(folderParam);
    return NextResponse.json({ ok: true, count: urls.length, sample: urls.slice(0, 8) });
  }

  const [pools, images, forms, telegram] = await Promise.all([
    getCategoryPools(),
    getCategoryImages(),
    getCategoryForms(),
    getCategoryTelegram(),
  ]);
  const categories = SEO_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    topic: c.topic,
    pool: pools[c.id] ?? c.defaultPool,
    imageFolder: images[c.id] ?? "",
    form: forms[c.id] ?? defaultCategoryForm(c.id),
    formCustomized: forms[c.id] !== undefined,
    telegram: telegram[c.id] ?? [],
    isDefault: pools[c.id] === undefined,
  }));
  return NextResponse.json({ ok: true, categories });
}

/** 카테고리 1개 풀/이미지폴더 저장 */
export async function PUT(req: Request) {
  if (!(await isAdminLoggedIn())) return unauthorized();
  const body = (await req.json().catch(() => null)) as {
    id?: string;
    pool?: string;
    imageFolder?: string;
    form?: CategoryForm;
    telegram?: string;
  } | null;
  const id = body?.id;
  if (!id || !isValidCategory(id)) {
    return NextResponse.json({ ok: false, error: "유효한 카테고리가 아닙니다." }, { status: 400 });
  }
  const telegram =
    body?.telegram !== undefined
      ? body.telegram
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
  const { error } = await saveCategoryConfig(id, {
    pool: body?.pool,
    imageFolder: body?.imageFolder,
    form: body?.form,
    telegram,
  });
  if (error) return NextResponse.json({ ok: false, error }, { status: 500 });
  return NextResponse.json({ ok: true, message: "카테고리 설정을 저장했습니다." });
}
