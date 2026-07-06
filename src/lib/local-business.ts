import { extractRegionFromKeyword } from "./region-parse";
import {
  buildPlaceUrl,
  pickBestMatch,
  searchNaverLocal,
  stripHtml,
} from "./naver-local";
import { inferTypeFromCategory } from "./naver-place-lookup";
import { pickRandomPetPartnerTypes } from "./pet-partner-types";
import { resolvePlaceByQuery } from "./naver-place-resolve";

import type { LocalPartner } from "./data";

interface FetchOptions {
  region: string;
  naverClientId: string;
  naverClientSecret: string;
  seed?: string;
}

export async function fetchLocalPartners({
  region,
  naverClientId,
  naverClientSecret,
  seed = region,
}: FetchOptions): Promise<LocalPartner[]> {
  const selectedTypes = pickRandomPetPartnerTypes(seed, 4);
  const partners: LocalPartner[] = [];

  for (const { type, searchTerm } of selectedTypes) {
    const query = `${region} ${searchTerm}`;
    try {
      const graphql = await resolvePlaceByQuery(query);
      if (graphql) {
        partners.push({
          type,
          name: graphql.name,
          address: graphql.roadAddress || graphql.address,
          placeUrl: graphql.placeUrl,
          imageUrl: graphql.imageUrl || undefined,
        });
        continue;
      }

      if (!naverClientId || !naverClientSecret) continue;

      const items = await searchNaverLocal(query, naverClientId, naverClientSecret);
      const best = pickBestMatch(items, region);
      if (!best) continue;

      const address = best.roadAddress || best.address;
      if (!address) continue;

      const resolved = await resolvePlaceByQuery(`${region} ${stripHtml(best.title)}`);

      partners.push({
        type: inferTypeFromCategory(best.category, type),
        name: stripHtml(best.title),
        address,
        placeUrl: resolved?.placeUrl || buildPlaceUrl(best, region),
        imageUrl: resolved?.imageUrl || undefined,
      });
    } catch {
      continue;
    }
  }

  return partners;
}

export async function resolveLocalPartnersForKeyword(
  keyword: string,
  credentials: { naverClientId: string; naverClientSecret: string }
): Promise<{ region: string | null; partners: LocalPartner[] }> {
  const region = extractRegionFromKeyword(keyword);
  if (!region) return { region: null, partners: [] };

  const partners = await fetchLocalPartners({
    region,
    naverClientId: credentials.naverClientId,
    naverClientSecret: credentials.naverClientSecret,
    seed: keyword,
  });

  return { region, partners };
}
