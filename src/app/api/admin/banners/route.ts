import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/admin-auth";
import {
  createBanner,
  deleteBanner,
  listAllBanners,
  updateBanner,
} from "@/lib/banners/queries";
import type { BannerInput } from "@/lib/banners/types";

export const dynamic = "force-dynamic";

async function guard() {
  return isAdminLoggedIn();
}

function unauthorized() {
  return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
}

export async function GET() {
  if (!(await guard())) return unauthorized();
  const banners = await listAllBanners();
  return NextResponse.json({ ok: true, banners });
}

export async function POST(req: Request) {
  if (!(await guard())) return unauthorized();
  const body = (await req.json().catch(() => null)) as BannerInput | null;
  if (!body) return NextResponse.json({ ok: false, error: "잘못된 요청" }, { status: 400 });

  const { error } = await createBanner(body);
  if (error) return NextResponse.json({ ok: false, error }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request) {
  if (!(await guard())) return unauthorized();
  const body = (await req.json().catch(() => null)) as (BannerInput & { id?: string }) | null;
  if (!body?.id)
    return NextResponse.json({ ok: false, error: "id가 필요합니다." }, { status: 400 });

  const { id, ...input } = body;
  const { error } = await updateBanner(id, input);
  if (error) return NextResponse.json({ ok: false, error }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await guard())) return unauthorized();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "id가 필요합니다." }, { status: 400 });

  const { error } = await deleteBanner(id);
  if (error) return NextResponse.json({ ok: false, error }, { status: 500 });
  return NextResponse.json({ ok: true });
}
