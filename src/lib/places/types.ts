import type { PlaceCategory } from "@/lib/site";

export type { PlaceCategory };

export interface Place {
  id: string;
  local_id: string;
  category: PlaceCategory;
  title: string;
  status: string;
  address_road: string | null;
  address_jibun: string | null;
  phone: string | null;
  sido: string | null;
  sigungu: string | null;
  updated_at: string;
}

export interface PlacesFilter {
  sido?: string;
  sigungu?: string;
  category?: PlaceCategory | "";
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface PlacesListResult {
  items: Place[];
  total: number;
  page: number;
  pageSize: number;
  sidoOptions: string[];
  sigunguOptions: string[];
}
