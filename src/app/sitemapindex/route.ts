import {
  getSitemapPlan,
  renderSitemapIndex,
  sitemapBaseUrl,
} from "@/lib/seo/sitemap-plan";

export const dynamic = "force-dynamic";

/** 사이트맵 인덱스 (rewrite 를 통해 /sitemap.xml 로 노출) */
export async function GET() {
  const base = sitemapBaseUrl();
  const plan = await getSitemapPlan();
  const sitemapUrls = plan.map((_, i) => `${base}/sitemaps/${i}.xml`);
  const xml = renderSitemapIndex(sitemapUrls, new Date().toISOString());

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
