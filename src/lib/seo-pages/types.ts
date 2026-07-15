export interface SeoFaq {
  question: string;
  answer: string;
}

export interface SeoPage {
  id: string;
  slug: string;
  keyword: string;
  region_name: string | null;
  title: string;
  description: string | null;
  content: string;
  faqs: SeoFaq[];
  image_url: string | null;
  hidden: boolean;
  created_at: string;
  updated_at: string;
}

export type SeoJobStatus = "pending" | "processing" | "completed" | "failed";

export interface SeoJob {
  id: string;
  keyword: string;
  normalized_keyword: string;
  status: SeoJobStatus;
  error: string | null;
  page_id: string | null;
  slug: string | null;
  requested_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface SeoSettings {
  daily_limit: number;
  service_expires_at: string | null;
  quota_date: string | null;
  quota_count: number;
}

export interface ServiceStatus {
  active: boolean;
  expired: boolean;
  expiresAt: string | null;
  daysRemaining: number;
}

export interface QuotaStatus {
  limit: number;
  used: number;
  remaining: number;
  today: string;
  service: ServiceStatus;
}

/** KST 기준 오늘 (YYYY-MM-DD) */
export function kstDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}
