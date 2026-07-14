export interface RescuedAnimal {
  id: string;
  desertion_no: string;
  image_url: string | null;
  has_image?: boolean;
  happen_dt: string | null;
  happen_place: string | null;
  kind_cd: string | null;
  color_cd: string | null;
  age: string | null;
  weight: string | null;
  sex_cd: string | null;
  neuter_yn: string | null;
  special_mark: string | null;
  notice_no: string | null;
  notice_sdt: string | null;
  notice_edt: string | null;
  process_state: string | null;
  care_nm: string | null;
  care_tel: string | null;
  care_addr: string | null;
  org_nm: string | null;
  sido: string | null;
  sigungu: string | null;
  updated_at: string;
}

export function sexLabel(code: string | null | undefined): string {
  if (code === "M") return "수컷";
  if (code === "F") return "암컷";
  return "미상";
}

export function neuterLabel(code: string | null | undefined): string {
  if (code === "Y") return "중성화함";
  if (code === "N") return "중성화 안 함";
  return "중성화 여부 미상";
}

export function formatHappenDt(dt: string | null | undefined): string {
  if (!dt || dt.length < 8) return dt || "날짜 미상";
  return `${dt.slice(0, 4)}.${dt.slice(4, 6)}.${dt.slice(6, 8)}`;
}
