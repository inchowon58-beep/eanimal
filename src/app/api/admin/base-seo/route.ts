import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/admin-auth";
import {
  BaseSeoError,
  absoluteInfoUrl,
  createBaseSeoBatch,
  createBaseSeoFromKeyword,
  removeBaseSeo,
} from "@/lib/base-seo/service";
import { listBaseSeoPages } from "@/lib/base-seo/store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function unauthorized() {
  return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
}

function authorizeLocal(req: Request): boolean {
  const secret =
    process.env.BASE_SEO_PUBLISH_SECRET ||
    process.env.CRON_SECRET ||
    process.env.SYNC_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("secret") === secret;
}

export async function GET(req: Request) {
  const local = authorizeLocal(req);
  if (!local && !(await isAdminLoggedIn())) return unauthorized();
  const pages = await listBaseSeoPages();
  return NextResponse.json({
    ok: true,
    pages: pages.map((p) => ({
      ...p,
      path: `/info/${p.slug}`,
      url: absoluteInfoUrl(p.slug),
    })),
  });
}

export async function POST(req: Request) {
  const local = authorizeLocal(req);
  if (!local && !(await isAdminLoggedIn())) return unauthorized();

  const body = (await req.json().catch(() => null)) as {
    action?: string;
    keyword?: string;
    category?: string;
    keywords?: string[];
  } | null;

  const action = body?.action || "generate";
  const category = body?.category?.trim() || "shelter";

  try {
    if (action === "batch") {
      const keywords = (body?.keywords || [])
        .map((k) => String(k).trim())
        .filter(Boolean)
        .slice(0, 200);
      if (!keywords.length) {
        return NextResponse.json(
          { ok: false, error: "keywords 배열이 필요합니다." },
          { status: 400 }
        );
      }
      const result = await createBaseSeoBatch(keywords, category, {
        publishSource: local ? "local" : "web",
      });
      return NextResponse.json({
        ok: true,
        created: result.created.length,
        errors: result.errors,
        pages: result.created.map((p) => ({
          slug: p.slug,
          keyword: p.keyword,
          path: `/info/${p.slug}`,
          url: absoluteInfoUrl(p.slug),
        })),
      });
    }

    const keyword = body?.keyword?.trim();
    if (!keyword) {
      return NextResponse.json({ ok: false, error: "키워드를 입력해 주세요." }, { status: 400 });
    }
    const page = await createBaseSeoFromKeyword(keyword, category, {
      publishSource: local ? "local" : "web",
    });
    return NextResponse.json({
      ok: true,
      page: {
        ...page,
        path: `/info/${page.slug}`,
        url: absoluteInfoUrl(page.slug),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "발행 실패";
    const status = e instanceof BaseSeoError && e.code === "VALIDATION" ? 400 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

export async function DELETE(req: Request) {
  if (!(await isAdminLoggedIn())) return unauthorized();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "id가 필요합니다." }, { status: 400 });
  }
  try {
    await removeBaseSeo(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "삭제 실패" },
      { status: 500 }
    );
  }
}
