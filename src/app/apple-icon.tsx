import { ImageResponse } from "next/og";
import { FaviconLayout } from "@/lib/og-template";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<FaviconLayout size={180} />, {
    ...size,
    headers: {
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
