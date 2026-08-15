import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_NAME = "반려문화위원회";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.eanimal.kr";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: "사이트 리뉴얼 작업 중입니다.",
  metadataBase: new URL(SITE_URL),
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0f1a17",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
