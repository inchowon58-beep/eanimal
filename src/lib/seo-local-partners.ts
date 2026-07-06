import { getPageByKey, savePage, type SeoPage, type LocalPartner } from "@/lib/data";
import { resolveLocalPartnersForKeyword } from "@/lib/local-business";
import { PET_PARTNER_TYPES } from "@/lib/pet-partner-types";
import type { SiteConfig } from "@/lib/site-config-types";

function isPetPartner(partner: LocalPartner): boolean {
  return PET_PARTNER_TYPES.some((t) => t.type === partner.type);
}

function hasValidCachedPartners(partners: LocalPartner[] | undefined): partners is LocalPartner[] {
  return (
    !!partners &&
    partners.length > 0 &&
    partners.length <= 4 &&
    partners.every(isPetPartner)
  );
}

function getNaverCredentials(config: SiteConfig) {
  return {
    naverClientId:
      config.naverClientId || process.env.NAVER_CLIENT_ID || "",
    naverClientSecret:
      config.naverClientSecret || process.env.NAVER_CLIENT_SECRET || "",
  };
}

export async function ensureLocalPartners(
  page: SeoPage,
  config: SiteConfig
): Promise<{ region: string | null; partners: LocalPartner[] }> {
  if (hasValidCachedPartners(page.localPartners)) {
    return {
      region: page.regionName || null,
      partners: page.localPartners,
    };
  }

  const { region, partners } = await resolveLocalPartnersForKeyword(
    page.keyword,
    getNaverCredentials(config)
  );

  if (partners.length > 0) {
    await savePage({
      ...page,
      regionName: region || undefined,
      localPartners: partners,
      updatedAt: new Date().toISOString(),
    });
  }

  return { region, partners };
}

export async function enrichPageWithLocalPartners(
  slug: string,
  config: SiteConfig
): Promise<{ region: string | null; partners: LocalPartner[] }> {
  const page = await getPageByKey(slug);
  if (!page) return { region: null, partners: [] };
  return ensureLocalPartners(page, config);
}
