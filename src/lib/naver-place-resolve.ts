export interface ResolvedNaverPlace {
  placeId: string;
  name: string;
  category: string;
  address: string;
  roadAddress: string;
  imageUrl: string | null;
  imageCount: number;
  placeUrl: string;
}

const GRAPHQL_URL = "https://pcmap-api.place.naver.com/place/graphql";

const GRAPHQL_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://pcmap.place.naver.com/",
  Origin: "https://pcmap.place.naver.com",
};

const PLACES_QUERY = `query getPlacesList($input: PlacesInput) {
  places(input: $input) {
    total
    items {
      id
      name
      imageUrl
      imageCount
      roadAddress
      address
      category
    }
  }
}`;

interface GraphqlPlaceItem {
  id: string;
  name: string;
  imageUrl?: string;
  imageCount?: number;
  roadAddress?: string;
  address?: string;
  category?: string;
}

export function isGenericPlaceImage(url: string | undefined | null): boolean {
  if (!url) return true;
  return (
    /og-map|static\/maps\/assets|favicon|logo\.png/i.test(url) ||
    (!url.includes("pstatic.net") && /map\.naver\.com/i.test(url))
  );
}

export function buildPcmapPlaceUrl(placeId: string): string {
  return `https://pcmap.place.naver.com/place/${placeId}/home`;
}

function pickBestPlaceItem(
  items: GraphqlPlaceItem[],
  query: string
): GraphqlPlaceItem | null {
  if (items.length === 0) return null;

  const normalizedQuery = query.replace(/\s+/g, "").toLowerCase();
  const exact = items.find(
    (item) => item.name.replace(/\s+/g, "").toLowerCase() === normalizedQuery
  );
  if (exact) return exact;

  const partial = items.find((item) => {
    const name = item.name.replace(/\s+/g, "").toLowerCase();
    return (
      normalizedQuery.includes(name) ||
      name.includes(normalizedQuery) ||
      normalizedQuery.includes(name.slice(0, 4))
    );
  });

  return partial || items[0];
}

/** 네이버 플레이스 GraphQL — 업체명/지역 검색으로 실제 사진·placeId 조회 */
export async function resolvePlaceByQuery(query: string): Promise<ResolvedNaverPlace | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  try {
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: GRAPHQL_HEADERS,
      body: JSON.stringify({
        operationName: "getPlacesList",
        variables: {
          input: {
            query: trimmed,
            start: 1,
            display: 5,
            adult: false,
            spq: false,
            queryRank: "",
          },
        },
        query: PLACES_QUERY,
      }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;

    const json = (await res.json()) as {
      data?: { places?: { items?: GraphqlPlaceItem[] } };
    };

    const items = json.data?.places?.items || [];
    const best = pickBestPlaceItem(items, trimmed);
    if (!best?.id) return null;

    const imageUrl =
      best.imageUrl && !isGenericPlaceImage(best.imageUrl) ? best.imageUrl : null;

    return {
      placeId: best.id,
      name: best.name,
      category: best.category || "",
      address: best.address || "",
      roadAddress: best.roadAddress || "",
      imageUrl,
      imageCount: best.imageCount || 0,
      placeUrl: buildPcmapPlaceUrl(best.id),
    };
  } catch {
    return null;
  }
}

/** 여러 검색어 후보로 플레이스 조회 */
export async function resolvePlaceByName(
  businessName: string,
  region?: string
): Promise<ResolvedNaverPlace | null> {
  const name = businessName.trim();
  if (!name) return null;

  const candidates = region
    ? [`${region} ${name}`, name, `${name} ${region}`]
    : [name];

  for (const query of candidates) {
    const resolved = await resolvePlaceByQuery(query);
    if (resolved) return resolved;
  }

  return null;
}
