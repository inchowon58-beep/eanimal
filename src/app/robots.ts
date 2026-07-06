import type { MetadataRoute } from "next";
import { getSiteUrlAsync } from "@/lib/site-url";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = await getSiteUrlAsync();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/admin/master", "/api/"] },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
