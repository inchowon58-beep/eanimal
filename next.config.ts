import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.animal.go.kr", pathname: "/**" },
      { protocol: "http", hostname: "www.animal.go.kr", pathname: "/**" },
      { protocol: "https", hostname: "animal.go.kr", pathname: "/**" },
      { protocol: "http", hostname: "animal.go.kr", pathname: "/**" },
      { protocol: "https", hostname: "**.animal.go.kr", pathname: "/**" },
      { protocol: "http", hostname: "**.animal.go.kr", pathname: "/**" },
      { protocol: "https", hostname: "tong.visitkorea.or.kr", pathname: "/**" },
      { protocol: "http", hostname: "tong.visitkorea.or.kr", pathname: "/**" },
      { protocol: "https", hostname: "cdn.visitkorea.or.kr", pathname: "/**" },
      { protocol: "http", hostname: "cdn.visitkorea.or.kr", pathname: "/**" },
      { protocol: "https", hostname: "**.visitkorea.or.kr", pathname: "/**" },
      { protocol: "http", hostname: "**.visitkorea.or.kr", pathname: "/**" },
    ],
  },
};

export default nextConfig;
