import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  addFeaturedPartner,
  deleteFeaturedPartner,
  getFeaturedPartners,
  updateFeaturedPartner,
  type FeaturedPartner,
} from "@/lib/data";
import { getSiteConfig } from "@/lib/site-config";
import { lookupPlaceByName } from "@/lib/naver-place-lookup";
import { isGenericPlaceImage } from "@/lib/naver-place-resolve";

function getCredentials(config: Awaited<ReturnType<typeof getSiteConfig>>) {
  return {
    naverClientId: config.naverClientId || process.env.NAVER_CLIENT_ID || "",
    naverClientSecret:
      config.naverClientSecret || process.env.NAVER_CLIENT_SECRET || "",
  };
}

export async function GET() {
  const partners = await getFeaturedPartners();
  return NextResponse.json(partners);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const name = String(body.name || "").trim();
  const region = String(body.region || "").trim();
  const type = String(body.type || "").trim();

  if (!name) {
    return NextResponse.json({ error: "업체명을 입력해 주세요." }, { status: 400 });
  }

  const config = await getSiteConfig();
  const lookup = await lookupPlaceByName(name, getCredentials(config), {
    region: region || undefined,
    type: type || undefined,
  });

  if (!lookup) {
    return NextResponse.json(
      { error: `"${name}" 업체를 네이버에서 찾을 수 없습니다.` },
      { status: 404 }
    );
  }

  const now = new Date().toISOString();
  const partner: FeaturedPartner = {
    id: `fp-${Date.now()}`,
    name: lookup.name,
    type: lookup.type,
    address: lookup.address,
    placeUrl: lookup.placeUrl,
    imageUrl: lookup.imageUrl,
    createdAt: now,
    updatedAt: now,
  };

  await addFeaturedPartner(partner);
  return NextResponse.json(partner);
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const id = String(body.id || "").trim();
  if (!id) {
    return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  }

  await deleteFeaturedPartner(id);
  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const name = String(body.name || "").trim();
  const region = String(body.region || "").trim();
  const type = String(body.type || "").trim();

  if (!name) {
    return NextResponse.json({ error: "업체명을 입력해 주세요." }, { status: 400 });
  }

  const config = await getSiteConfig();
  const lookup = await lookupPlaceByName(
    name,
    getCredentials(config),
    { region: region || undefined, type: type || undefined }
  );

  if (!lookup) {
    return NextResponse.json({ error: "업체를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(lookup);
}

/** 기존 등록 업체 이미지·플레이스 URL 새로고침 */
export async function PATCH(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const id = String(body.id || "").trim();
  if (!id) {
    return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  }

  const partners = await getFeaturedPartners();
  const existing = partners.find((p) => p.id === id);
  if (!existing) {
    return NextResponse.json({ error: "업체를 찾을 수 없습니다." }, { status: 404 });
  }

  const config = await getSiteConfig();
  const lookup = await lookupPlaceByName(existing.name, getCredentials(config), {
    type: existing.type,
  });

  if (!lookup) {
    return NextResponse.json({ error: "플레이스 정보를 다시 가져올 수 없습니다." }, { status: 404 });
  }

  const updated = await updateFeaturedPartner(id, {
    name: lookup.name,
    address: lookup.address,
    placeUrl: lookup.placeUrl,
    imageUrl: lookup.imageUrl,
    type: lookup.type,
  });

  return NextResponse.json(updated);
}
