export const BANNER_PLACEMENTS = [
  { value: "main_top", label: "메인 상단" },
  { value: "places", label: "시설 목록(전체)" },
  { value: "hospital", label: "동물병원" },
  { value: "pharmacy", label: "동물약국" },
  { value: "funeral", label: "동물장묘업" },
  { value: "rescue", label: "유기동물 공고" },
  { value: "travel", label: "반려동물 동반여행" },
  { value: "regions", label: "지역별" },
] as const;

export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number]["value"];

export const BANNER_PLACEMENT_LABELS: Record<string, string> = Object.fromEntries(
  BANNER_PLACEMENTS.map((p) => [p.value, p.label])
);

export interface Banner {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  phone: string | null;
  placements: string[];
  enabled: boolean;
  start_at: string | null;
  end_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BannerInput {
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  phone?: string | null;
  placements?: string[];
  enabled?: boolean;
  start_at?: string | null;
  end_at?: string | null;
  sort_order?: number;
}

/** 시설 카테고리 → 배너 노출영역 키 */
export function categoryToPlacement(category: string): BannerPlacement {
  switch (category) {
    case "동물병원":
      return "hospital";
    case "동물약국":
      return "pharmacy";
    case "동물장묘업":
      return "funeral";
    default:
      return "places";
  }
}
