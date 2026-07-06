import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/sitemap-feed";
import { getSiteUrlAsync } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const baseUrl = await getSiteUrlAsync();
    return await getSitemapEntries(baseUrl);
  } catch (error) {
    console.error("sitemap error:", error);
    const baseUrl = await getSiteUrlAsync();
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
    ];
  }
}
