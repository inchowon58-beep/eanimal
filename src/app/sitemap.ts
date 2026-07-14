import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { listDistinctSido, regionPath, SIDO_LIST } from "@/lib/regions";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url.replace(/\/$/, "");
  const sidos = await listDistinctSido();
  const sidoList = sidos.length ? sidos : [...SIDO_LIST];

  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/places`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/rescues`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/travel`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/regions`, changeFrequency: "daily", priority: 0.9 },
  ];

  for (const sido of sidoList) {
    entries.push({
      url: `${base}${regionPath(sido)}`,
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  return entries;
}
