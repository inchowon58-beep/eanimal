export const SITE = {
  name: "반려문화위원회",
  shortName: "반려문화위원회",
  description:
    "강아지 파양·무료입양 안내와 유기동물 공고, 동물병원·약국·장묘·동반여행 정보를 한곳에서 제공하는 반려동물 생활 정보 포털입니다.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  tagline: "반려문화를 위한 생활 정보 포털",
} as const;

export const PLACE_CATEGORIES = [
  "동물병원",
  "동물약국",
  "동물장묘업",
] as const;

export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export const ADMIN_USER = process.env.ADMIN_USER || "infocs";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "infocs070207";
export const MASTER_PASSWORD = process.env.MASTER_PASSWORD || "ybijour80";
