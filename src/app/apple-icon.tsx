import { ImageResponse } from "next/og";
import { FaviconMark } from "@/lib/favicon-mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<FaviconMark size={180} />, {
    ...size,
  });
}
