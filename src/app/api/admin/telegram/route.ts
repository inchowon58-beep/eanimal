import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/admin-auth";
import { getRecentChats, sendTelegramMessage, telegramConfigured } from "@/lib/telegram/notify";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
}

/** 봇 설정 여부 + 최근 대화 목록(chat_id 확인용) */
export async function GET() {
  if (!(await isAdminLoggedIn())) return unauthorized();
  const configured = telegramConfigured();
  const chats = configured ? await getRecentChats() : [];
  return NextResponse.json({ ok: true, configured, chats });
}

/** 테스트 메시지 발송 */
export async function POST(req: Request) {
  if (!(await isAdminLoggedIn())) return unauthorized();
  const body = (await req.json().catch(() => null)) as { chatId?: string } | null;
  const chatId = body?.chatId?.trim();
  if (!chatId) {
    return NextResponse.json({ ok: false, error: "chat_id가 필요합니다." }, { status: 400 });
  }
  const r = await sendTelegramMessage(
    chatId,
    "✅ 반려문화위원회 알림 테스트입니다. 이 메시지가 보이면 정상 연결된 것입니다."
  );
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 502 });
  return NextResponse.json({ ok: true });
}
