import { ImageResponse } from "next/og";
import { FaviconMark } from "@/lib/favicon-mark";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<FaviconMark size={32} />, {
    ...size,
  });
}
