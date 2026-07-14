import type { PlaceCategory } from "@/lib/site";

export const PUBLIC_DATA_BASE = "https://apis.data.go.kr/1741000";

export interface PublicDataEndpoint {
  category: PlaceCategory;
  path: string;
  /** 카테고리 구분용 local_id 접두사 */
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
    category: "위탁관리업",
    path: "/animal_boarding/info",
    localIdPrefix: "board",
  },
];
