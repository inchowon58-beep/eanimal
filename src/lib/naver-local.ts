export interface NaverLocalItem {
  title: string;
  link: string;
  category: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
}

interface NaverLocalResponse {
  items?: NaverLocalItem[];
}

export function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "").trim();
}

export function buildPlaceUrl(item: NaverLocalItem, region: string): string {
  const name = stripHtml(item.title);
  const address = item.roadAddress || item.address;

  if (item.link && /map\.naver\.com|place\.naver\.com/i.test(item.link)) {
    return item.link;
  }

  const query = address ? `${name} ${address}` : `${region} ${name}`;
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}

export async function searchNaverLocal(
  query: string,
  clientId: string,
  clientSecret: string
): Promise<NaverLocalItem[]> {
  const url = `https://openapi.naver.com/v1/search/local.json?${new URLSearchParams({
    query,
    display: "5",
    start: "1",
    sort: "random",
  })}`;

  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as NaverLocalResponse;
  return data.items || [];
}

export function pickBestMatch(
  items: NaverLocalItem[],
  region: string
): NaverLocalItem | null {
  if (items.length === 0) return null;

  const regionMatch = items.find((item) => {
    const name = stripHtml(item.title);
    const addr = item.roadAddress || item.address;
    return (
      name.includes(region) ||
      addr.includes(region) ||
      item.category.includes(region)
    );
  });

  return regionMatch || items[0];
}
