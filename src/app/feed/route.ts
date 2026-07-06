import { getFeedEntries, buildRssXml } from "@/lib/sitemap-feed";
import { getSiteUrlFromRequest } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const baseUrl = getSiteUrlFromRequest(request);
  const entries = await getFeedEntries(baseUrl);
  const xml = await buildRssXml(entries, baseUrl);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
