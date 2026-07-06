import { ImageResponse } from "next/og";
import { getSiteConfig } from "@/lib/site-config";
import { OgBrandedLayout, OG_SIZE } from "@/lib/og-template";

export const alt = "1977 한국애견미용학원정보";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const config = await getSiteConfig();

  return new ImageResponse(
    (
      <OgBrandedLayout
        brandName={config.brandName}
        title="애견미용학원 · 자격증 과정 안내"
        subtitle={config.description.slice(0, 80)}
        badge="무료 학원 상담"
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
