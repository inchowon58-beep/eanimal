import { headers } from "next/headers";
import type { SiteConfig } from "./site-config-types";
import { DEFAULT_SITE_CONFIG } from "./site-config-types";

function fromEnv(): string | null {
  const value =
    process.env.SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return value ? value.replace(/\/$/, "") : null;
}

export function getSiteUrlFromRequest(request: Request): string {
  const envUrl = fromEnv();
  if (envUrl) return envUrl;

  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";

  if (host) {
    const cleanHost = host.split(",")[0].trim();
    return `${proto}://${cleanHost}`.replace(/\/$/, "");
  }

  return DEFAULT_SITE_CONFIG.url.replace(/\/$/, "");
}

export async function getSiteUrlAsync(config?: Pick<SiteConfig, "url">): Promise<string> {
  const envUrl = fromEnv();
  if (envUrl) return envUrl;

  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host");
    const proto = h.get("x-forwarded-proto") || "https";
    if (host) {
      const cleanHost = host.split(",")[0].trim();
      return `${proto}://${cleanHost}`.replace(/\/$/, "");
    }
  } catch {
    // headers() unavailable outside request
  }

  return (config?.url || DEFAULT_SITE_CONFIG.url).replace(/\/$/, "");
}

export function getSiteUrl(config?: Pick<SiteConfig, "url">): string {
  return fromEnv() || (config?.url || DEFAULT_SITE_CONFIG.url).replace(/\/$/, "");
}

export function escapeXml(value: string | undefined | null): string {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function toCdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

export function stripHtml(value: string | undefined | null): string {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function toRfc822(date: string | Date | undefined | null): string {
  const parsed = date ? new Date(date) : new Date();
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toUTCString();
  }
  return parsed.toUTCString();
}
