import type { LocalPartner } from "./data";
import type { NaverLocalItem } from "./naver-local";
import {
  buildPlaceUrl,
  pickBestMatch,
  searchNaverLocal,
  stripHtml,
} from "./naver-local";
import { fetchPlaceMedia } from "./naver-place-image";
import { PET_PARTNER_TYPES } from "./pet-partner-types";
import { resolvePlaceByQuery } from "./naver-place-resolve";

interface Credentials {
  naverClientId: string;
  naverClientSecret: string;
}

export function inferTypeFromCategory(category: string, fallback: string): string {
  for (const { type } of PET_PARTNER_TYPES) {
    if (category.includes(type)) return type;
  }
  return fallback;
}

function itemToPartner(
  item: NaverLocalItem,
  type: string,
  region: string
): Omit<LocalPartner, "imageUrl"> {
  const address = item.roadAddress || item.address;
  const resolvedType = type || inferTypeFromCategory(item.category, "애견·펫");
  return {
    type: resolvedType,
    name: stripHtml(item.title),
    address,
    placeUrl: buildPlaceUrl(item, region),
  };
}

/** 업체명으로 네이버 플레이스 GraphQL + 지역검색 → 실제 사진·주소 */
export async function lookupPlaceByName(
  businessName: string,
  credentials: Credentials,
  options?: { region?: string; type?: string }
): Promise<(LocalPartner & { imageUrl?: string }) | null> {
  const name = businessName.trim();
  if (!name) return null;

  const region = options?.region?.trim() || "";
  const type = options?.type?.trim() || "";

  const graphql = await resolvePlaceByQuery(region ? `${region} ${name}` : name);
  if (graphql) {
    const fullAddress = graphql.roadAddress || graphql.address;

    return {
      type: type || inferTypeFromCategory(graphql.category, "애견·펫"),
      name: graphql.name,
      address: fullAddress,
      placeUrl: graphql.placeUrl,
      imageUrl: graphql.imageUrl || undefined,
    };
  }

  if (!credentials.naverClientId || !credentials.naverClientSecret) return null;

  const queries = region ? [`${region} ${name}`, name] : [name, `${name} 애견`];
  let best: NaverLocalItem | null = null;

  for (const query of queries) {
    const items = await searchNaverLocal(
      query,
      credentials.naverClientId,
      credentials.naverClientSecret
    );
    const match = pickBestMatch(items, region || name) || items[0];
    if (match) {
      best = match;
      break;
    }
  }

  if (!best) return null;

  const partner = itemToPartner(best, type, region || name);
  const blogUrl = best.link?.includes("blog.naver.com") ? best.link : undefined;
  const media = await fetchPlaceMedia(partner.name, region, blogUrl);

  return {
    ...partner,
    placeUrl: media.placeUrl || partner.placeUrl,
    imageUrl: media.imageUrl || undefined,
  };
}
