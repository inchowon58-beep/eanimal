import { getSettings, saveSettings, type Settings } from "./data";
import { DEFAULT_SITE_CONFIG } from "./site-config-types";

export interface SeoQuotaStatus {
  limit: number;
  used: number;
  remaining: number;
  today: string;
}

function todayKst(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

/** settings.json + 기본값에서 일일 SEO 한도 숫자로 해석 */
export function resolveDailySeoLimit(settings: Settings): number {
  const merged = { ...DEFAULT_SITE_CONFIG, ...settings };
  const parsed = Number.parseInt(String(merged.dailySeoLimit), 10);
  if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  return DEFAULT_SITE_CONFIG.dailySeoLimit;
}

export async function getSeoQuotaStatus(): Promise<SeoQuotaStatus> {
  const settings = await getSettings();
  const today = todayKst();
  const limit = resolveDailySeoLimit(settings);
  const used =
    settings.seoQuotaDate === today ? Math.max(0, settings.seoQuotaCount ?? 0) : 0;

  return {
    limit,
    used,
    remaining: Math.max(0, limit - used),
    today,
  };
}

export async function consumeSeoQuota(): Promise<boolean> {
  const status = await getSeoQuotaStatus();
  if (status.remaining <= 0) return false;

  const settings = await getSettings();
  const today = todayKst();
  const used =
    settings.seoQuotaDate === today ? Math.max(0, settings.seoQuotaCount ?? 0) : 0;

  await saveSettings({
    ...settings,
    dailySeoLimit: resolveDailySeoLimit(settings),
    seoQuotaDate: today,
    seoQuotaCount: used + 1,
  });
  return true;
}
