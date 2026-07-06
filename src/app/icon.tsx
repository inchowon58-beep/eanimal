import { ImageResponse } from "next/og";
import { FaviconLayout } from "@/lib/og-template";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<FaviconLayout size={32} />, {
    ...size,
    headers: {
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
