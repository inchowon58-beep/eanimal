import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    guardianName?: string;
    phone?: string;
    sido?: string;
    sigungu?: string;
    petType?: string;
    petAge?: string;
    petVaccination?: string;
    reason?: string;
    sourceSlug?: string;
    sourceKeyword?: string;
  } | null;

  const guardianName = body?.guardianName?.trim() || "";
  const phone = body?.phone?.trim() || "";
  const sido = body?.sido?.trim() || "";
  const sigungu = body?.sigungu?.trim() || "";
  const petType = body?.petType?.trim() || "";
  const petAge = body?.petAge?.trim() || "";
  const petVaccination = body?.petVaccination?.trim() || "";
  const reason = body?.reason?.trim() || "";
  const sourceSlug = body?.sourceSlug?.trim() || "";
  const sourceKeyword = body?.sourceKeyword?.trim() || "";

  if (!guardianName || !phone || !sido || !petType || !reason) {
    return NextResponse.json(
      { ok: false, error: "필수 항목(성함·연락처·거주지역·반려동물 종류·사유)을 입력해 주세요." },
      { status: 400 }
    );
  }
  if (guardianName.length > 100 || phone.length > 40 || reason.length > 500) {
    return NextResponse.json({ ok: false, error: "입력 길이가 너무 깁니다." }, { status: 400 });
  }

  const supabase = getSupabaseService() || getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "DB 연결이 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  const { error } = await supabase.from("consultation_requests").insert({
    guardian_name: guardianName,
    phone,
    region_sido: sido,
    region_sigungu: sigungu,
    pet_type: petType,
    pet_age: petAge,
    pet_vaccination: petVaccination,
    reason,
    source_slug: sourceSlug,
    source_keyword: sourceKeyword,
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
