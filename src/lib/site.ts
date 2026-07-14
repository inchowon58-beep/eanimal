export const SITE = {
  name: "반려문화증진위원회",
  shortName: "반려문화증진위원회",
  description:
    "전국 동물병원·동물약국·동물위탁관리업 인허가 정보를 지역별로 안내하는 반려동물 인프라 정보 포털입니다.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  tagline: "전국 반려동물 인프라 정보",
} as const;

export const PLACE_CATEGORIES = [
  "동물병원",
  "동물약국",
  "위탁관리업",
] as const;

export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];
