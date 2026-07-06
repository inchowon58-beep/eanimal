const USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15";

/** 네이버 블로그 프로필/대표 이미지 (플레이스 사진 fallback) */
export async function fetchPlaceImageFromBlog(blogUrl: string): Promise<string | null> {
  if (!blogUrl?.includes("blog.naver.com")) return null;

  const mobileUrl = blogUrl.replace("://blog.naver.com", "://m.blog.naver.com");

  try {
    const res = await fetch(mobileUrl, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      redirect: "follow",
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const html = await res.text();
    const og =
      html.match(/property="og:image"[^>]+content="([^"]+)"/i) ||
      html.match(/content="([^"]+)"[^>]+property="og:image"/i);

    const url = og?.[1]?.replace(/&amp;/g, "&");
    if (url && url.includes("pstatic.net")) return url;
    return null;
  } catch {
    return null;
  }
}
