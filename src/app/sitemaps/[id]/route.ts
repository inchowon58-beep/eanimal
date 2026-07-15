import {
  getChunkUrls,
  getSitemapPlan,
  renderUrlset,
  sitemapBaseUrl,
} from "@/lib/seo/sitemap-plan";

export const dynamic = "force-dynamic";

/** 개별 사이트맵: /sitemaps/<index>.xml */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const index = Number(id.replace(/\.xml$/i, ""));

  const plan = await getSitemapPlan();
  const chunk = Number.isInteger(index) ? plan[index] : undefined;
  if (!chunk) {
    return new Response("Not found", { status: 404 });
  }

  const base = sitemapBaseUrl();
  const urls = await getChunkUrls(chunk, base);
  const xml = renderUrlset(urls);

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
