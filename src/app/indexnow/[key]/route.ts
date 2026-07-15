import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** IndexNow 소유확인용 키 파일: /indexnow/<KEY>.txt 로 KEY 문자열을 반환 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return new NextResponse("Not found", { status: 404 });

  const { key: requested } = await params;
  const normalized = requested.replace(/\.txt$/i, "");
  if (normalized !== key) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(key, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
