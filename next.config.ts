import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    return [
      // 크롤러/robots 가 참조하는 표준 경로를 실제 인덱스 라우트로 연결
      { source: "/sitemap.xml", destination: "/sitemapindex" },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.animal.go.kr", pathname: "/**" },
      { protocol: "http", hostname: "www.animal.go.kr", pathname: "/**" },
      { protocol: "https", hostname: "animal.go.kr", pathname: "/**" },
      { protocol: "http", hostname: "animal.go.kr", pathname: "/**" },
      { protocol: "https", hostname: "openapi.animal.go.kr", pathname: "/**" },
      { protocol: "http", hostname: "openapi.animal.go.kr", pathname: "/**" },
      { protocol: "https", hostname: "**.animal.go.kr", pathname: "/**" },
      { protocol: "http", hostname: "**.animal.go.kr", pathname: "/**" },
      { protocol: "https", hostname: "tong.visitkorea.or.kr", pathname: "/**" },
      { protocol: "http", hostname: "tong.visitkorea.or.kr", pathname: "/**" },
      { protocol: "https", hostname: "cdn.visitkorea.or.kr", pathname: "/**" },
      { protocol: "http", hostname: "cdn.visitkorea.or.kr", pathname: "/**" },
      { protocol: "https", hostname: "**.visitkorea.or.kr", pathname: "/**" },
      { protocol: "http", hostname: "**.visitkorea.or.kr", pathname: "/**" },
      { protocol: "https", hostname: "cdn.sanity.io", pathname: "/**" },
      { protocol: "https", hostname: "www.agapetstory.co.kr", pathname: "/**" },
      { protocol: "https", hostname: "agapetstory.co.kr", pathname: "/**" },
    ],
  },
};

export default nextConfig;
