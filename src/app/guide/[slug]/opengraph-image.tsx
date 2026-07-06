import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getPageByKey } from "@/lib/data";
import { getSiteConfig, resolveSeoPage } from "@/lib/site-config";
import { OgBrandedLayout, OG_SIZE } from "@/lib/og-template";

export const alt = "1977 한국애견미용학원정보 SEO";
export const size = OG_SIZE;
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function GuideOpenGraphImage({ params }: Props) {
  const { slug } = await params;
  const [page, config] = await Promise.all([getPageByKey(slug), getSiteConfig()]);
  if (!page) notFound();

  const resolved = resolveSeoPage(page, config);
  const title =
    resolved.title.length > 48 ? `${resolved.title.slice(0, 48)}…` : resolved.title;

  return new ImageResponse(
    (
      <OgBrandedLayout
        brandName={config.brandName}
        title={title}
        subtitle={resolved.description.slice(0, 90)}
        badge={page.keyword}
      />
    ),
    {
      ...OG_SIZE,
      headers: {
        "Cache-Control": "public, max-age=3600, must-revalidate",
      },
    }
  );
}
