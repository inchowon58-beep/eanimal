import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import {
  kstDate,
  type QuotaStatus,
  type ServiceStatus,
  type SeoSettings,
} from "@/lib/seo-pages/types";

const DEFAULTS: SeoSettings = {
  daily_limit: 10,
  service_expires_at: null,
  quota_date: null,
  quota_count: 0,
};

export async function getSeoSettings(): Promise<SeoSettings> {
  const supabase = getSupabaseService() || getSupabaseServer();
  if (!supabase) return { ...DEFAULTS };

  const { data, error } = await supabase
    .from("seo_settings")
    .select("daily_limit, service_expires_at, quota_date, quota_count")
    .eq("id", "default")
    .maybeSingle();

  if (error || !data) return { ...DEFAULTS };
  return {
    daily_limit: data.daily_limit ?? DEFAULTS.daily_limit,
    service_expires_at: data.service_expires_at ?? null,
    quota_date: data.quota_date ?? null,
    quota_count: data.quota_count ?? 0,
  };
}

export async function saveSeoSettings(input: {
  daily_limit?: number;
  service_expires_at?: string | null;
}): Promise<{ error: string | null }> {
  const supabase = getSupabaseService();
  if (!supabase) return { error: "service role 키가 필요합니다." };

  const row: Record<string, unknown> = {
    id: "default",
    updated_at: new Date().toISOString(),
  };
  if (input.daily_limit !== undefined) {
    row.daily_limit = Math.max(0, Math.floor(input.daily_limit) || 0);
  }
  if (input.service_expires_at !== undefined) {
    row.service_expires_at = input.service_expires_at || null;
  }

  const { error } = await supabase
    .from("seo_settings")
    .upsert(row, { onConflict: "id" });
  return { error: error?.message ?? null };
}

export function computeService(expiresAt: string | null): ServiceStatus {
  if (!expiresAt) {
    // 만료일 미설정 → 무기한 사용 가능
    return { active: true, expired: false, expiresAt: null, daysRemaining: -1 };
  }
  const exp = new Date(expiresAt).getTime();
  const now = Date.now();
  const active = now < exp;
  const daysRemaining = active
    ? Math.ceil((exp - now) / (1000 * 60 * 60 * 24))
    : 0;
  return {
    active,
    expired: !active,
    expiresAt: expiresAt.slice(0, 10),
    daysRemaining,
  };
}

export async function getQuotaStatus(): Promise<QuotaStatus> {
  const settings = await getSeoSettings();
  const today = kstDate();
  const used = settings.quota_date === today ? settings.quota_count : 0;
  const limit = settings.daily_limit;
  return {
    limit,
    used,
    remaining: Math.max(0, limit - used),
    today,
    service: computeService(settings.service_expires_at),
  };
}

/** 발행 1건 소진 (KST 날짜 바뀌면 리셋) */
export async function consumeQuota(): Promise<void> {
  const supabase = getSupabaseService();
  if (!supabase) return;
  const settings = await getSeoSettings();
  const today = kstDate();
  const nextCount = settings.quota_date === today ? settings.quota_count + 1 : 1;
  await supabase
    .from("seo_settings")
    .upsert(
      {
        id: "default",
        quota_date: today,
        quota_count: nextCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
}
