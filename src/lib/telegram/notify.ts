/**
 * 텔레그램 봇 알림
 * - 봇 토큰은 환경변수 TELEGRAM_BOT_TOKEN 에 저장 (Vercel).
 * - 카테고리별 수신 대상(chat_id)은 seo_settings.category_telegram 에 저장.
 * - 전역 공통 수신 대상은 환경변수 TELEGRAM_CHAT_ID (쉼표 구분) 로도 지정 가능.
 *
 * chat_id 는 개인/그룹 모두 가능 — 여러 명이 봐야 하면 텔레그램 그룹을 만들어
 * 봇을 초대하고 그 그룹 chat_id 하나만 등록하거나, 각자의 chat_id 를 여러 개 등록하면 됩니다.
 */
import { getCategoryTelegram } from "@/lib/seo-pages/settings";

const API = "https://api.telegram.org";

export function telegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN이 설정되지 않았습니다." };
  try {
    const res = await fetch(`${API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const d = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    if (!res.ok || !d.ok) return { ok: false, error: d.description || `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** 최근 봇에 말을 건 채팅 목록 (chat_id 확인용) */
export async function getRecentChats(): Promise<
  { id: string; name: string; type: string }[]
> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return [];
  try {
    const res = await fetch(`${API}/bot${token}/getUpdates?limit=100`, { cache: "no-store" });
    type TgChat = {
      id: number;
      type: string;
      title?: string;
      first_name?: string;
      username?: string;
    };
    const d = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      result?: Array<{ message?: { chat?: TgChat }; my_chat_member?: { chat?: TgChat } }>;
    };
    if (!d.ok || !Array.isArray(d.result)) return [];
    const seen = new Map<string, { id: string; name: string; type: string }>();
    for (const u of d.result) {
      const chat = u.message?.chat || u.my_chat_member?.chat;
      if (!chat) continue;
      const id = String(chat.id);
      const name =
        chat.title ||
        [chat.first_name, chat.username ? `@${chat.username}` : ""].filter(Boolean).join(" ") ||
        id;
      seen.set(id, { id, name, type: chat.type });
    }
    return Array.from(seen.values());
  } catch {
    return [];
  }
}

function globalChatIds(): string[] {
  return (process.env.TELEGRAM_CHAT_ID || "")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function resolveRecipients(categoryId: string | null | undefined): Promise<string[]> {
  const map = await getCategoryTelegram();
  const ids = new Set<string>();
  if (categoryId && map[categoryId]) map[categoryId].forEach((id) => ids.add(id));
  globalChatIds().forEach((id) => ids.add(id));
  return Array.from(ids);
}

export interface ConsultNotice {
  categoryId: string | null;
  categoryLabel: string;
  name: string;
  phone: string;
  answers: Record<string, string>;
  keyword?: string;
  pageUrl?: string;
}

function formatMessage(p: ConsultNotice): string {
  const lines: string[] = [];
  lines.push(`🐾 <b>[${escapeHtml(p.categoryLabel)}] 새 상담 신청</b>`);
  lines.push("");
  lines.push(`👤 <b>이름</b> : ${escapeHtml(p.name)}`);
  lines.push(`📞 <b>연락처</b> : ${escapeHtml(p.phone)}`);
  for (const [k, v] of Object.entries(p.answers)) {
    lines.push(`• <b>${escapeHtml(k)}</b> : ${escapeHtml(v)}`);
  }
  if (p.keyword) lines.push(`🔑 <b>키워드</b> : ${escapeHtml(p.keyword)}`);
  if (p.pageUrl) lines.push(`🔗 ${escapeHtml(p.pageUrl)}`);
  lines.push("");
  lines.push(`🕒 ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`);
  return lines.join("\n");
}

/** 상담 신청 알림을 카테고리 수신 대상에게 전송 (실패해도 예외를 던지지 않음) */
export async function notifyConsultation(p: ConsultNotice): Promise<void> {
  if (!telegramConfigured()) return;
  const recipients = await resolveRecipients(p.categoryId);
  if (recipients.length === 0) return;
  const text = formatMessage(p);
  const results = await Promise.allSettled(recipients.map((id) => sendTelegramMessage(id, text)));
  results.forEach((r) => {
    if (r.status === "fulfilled" && !r.value.ok) {
      console.error("[telegram] send fail:", r.value.error);
    }
  });
}
