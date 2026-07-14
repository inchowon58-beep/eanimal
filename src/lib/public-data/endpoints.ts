import type { PlaceCategory } from "@/lib/site";

export const PUBLIC_DATA_BASE = "https://apis.data.go.kr/1741000";

export interface PublicDataEndpoint {
  category: PlaceCategory;
  path: string;
  localIdPrefix: string;
}

export const PUBLIC_DATA_ENDPOINTS: PublicDataEndpoint[] = [
  {
    category: "동물병원",
    path: "/animal_hospitals/info",
    localIdPrefix: "hosp",
  },
  {
    category: "동물약국",
    path: "/animal_pharmacies/info",
    localIdPrefix: "pharm",
  },
  {
    category: "동물장묘업",
    path: "/animal_cremation/info",
    localIdPrefix: "crem",
  },
];
