export interface PetTravelPlace {
  id: string;
  content_id: string;
  content_type_id: string | null;
  title: string;
  image_url: string | null;
  has_image?: boolean;
  address: string | null;
  address_detail: string | null;
  tel: string | null;
  area_code: string | null;
  sigungu_code: string | null;
  sido: string | null;
  sigungu: string | null;
  overview: string | null;
  pet_info: string | null;
  pet_rule: string | null;
  mapx: string | null;
  mapy: string | null;
  updated_at: string;
}
