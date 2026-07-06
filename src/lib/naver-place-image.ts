import { fetchPlaceImageFromBlog } from "./naver-place-blog-image";
import {
  isGenericPlaceImage,
  resolvePlaceByName,
  resolvePlaceByQuery,
  type ResolvedNaverPlace,
} from "./naver-place-resolve";

export { isGenericPlaceImage, resolvePlaceByName, resolvePlaceByQuery };
export type { ResolvedNaverPlace };

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function extractOgImage(html: string): string | null {
  const ogMatch = html.match(
    /<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/i
  );
  if (ogMatch?.[1] && !isGenericPlaceImage(ogMatch[1])) return ogMatch[1];

  const reverseMatch = html.match(
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["']/i
  );
  if (reverseMatch?.[1] && !isGenericPlaceImage(reverseMatch[1])) return reverseMatch[1];

  const ldb = html.match(/https:\/\/ldb-phinf\.pstatic\.net[^"'\\<>]+/i);
  return ldb?.[0] || null;
}

async function fetchPlaceImageFromHtml(placeUrl: string): Promise<string | null> {
  if (!placeUrl?.startsWith("http")) return null;

  try {
    const res = await fetch(placeUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      redirect: "follow",
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;

    const html = await res.text();
    const image = extractOgImage(html);
    return image?.replace(/&amp;/g, "&") || null;
  } catch {
    return null;
  }
}

/** 플레이스 대표 이미지 — GraphQL 우선, HTML·블로그 순 fallback */
export async function fetchPlaceImageUrl(
  placeUrl: string,
  options?: { businessName?: string; region?: string; blogUrl?: string }
): Promise<string | null> {
  if (options?.businessName) {
    const resolved = await resolvePlaceByName(options.businessName, options.region);
    if (resolved?.imageUrl) return resolved.imageUrl;
  }

  if (options?.blogUrl) {
    const blogImage = await fetchPlaceImageFromBlog(options.blogUrl);
    if (blogImage) return blogImage;
  }

  const htmlImage = await fetchPlaceImageFromHtml(placeUrl);
  if (htmlImage) return htmlImage;

  return null;
}

/** 업체명 기준 이미지 + 플레이스 URL 일괄 조회 */
export async function fetchPlaceMedia(
  businessName: string,
  region?: string,
  blogUrl?: string
): Promise<{ imageUrl: string | null; placeUrl: string | null; resolved: ResolvedNaverPlace | null }> {
  const resolved = await resolvePlaceByName(businessName, region);
  if (resolved?.imageUrl) {
    return {
      imageUrl: resolved.imageUrl,
      placeUrl: resolved.placeUrl,
      resolved,
    };
  }

  if (blogUrl) {
    const blogImage = await fetchPlaceImageFromBlog(blogUrl);
    if (blogImage) {
      return {
        imageUrl: blogImage,
        placeUrl: resolved?.placeUrl || null,
        resolved,
      };
    }
  }

  return {
    imageUrl: resolved?.imageUrl || null,
    placeUrl: resolved?.placeUrl || null,
    resolved,
  };
}
