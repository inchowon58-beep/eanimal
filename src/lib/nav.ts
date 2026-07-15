/** 상단 네비 · 홈 퀵 아이콘 공통 */
export const PRIMARY_NAV = [
  {
    label: "동물병원",
    href: "/places?category=%EB%8F%99%EB%AC%BC%EB%B3%91%EC%9B%90",
  },
  {
    label: "동물약국",
    href: "/places?category=%EB%8F%99%EB%AC%BC%EC%95%BD%EA%B5%AD",
  },
  {
    label: "강아지장례업체",
    href: "/places?category=%EB%8F%99%EB%AC%BC%EC%9E%A5%EB%AC%98%EC%97%85",
  },
  {
    label: "반려동물동반여행",
    href: "/travel",
  },
  {
    label: "유기동물보호센터 공고",
    href: "/rescues",
  },
] as const;

export type QuickServiceId =
  | "hospital"
  | "pharmacy"
  | "funeral"
  | "travel"
  | "rescue"
  | "regions"
  | "grooming"
  | "cafe"
  | "shop";

export const QUICK_SERVICES: Array<{
  id: QuickServiceId;
  label: string;
  href: string;
  tone: string;
  soon?: boolean;
}> = [
  {
    id: "hospital",
    label: "동물병원",
    href: "/places?category=%EB%8F%99%EB%AC%BC%EB%B3%91%EC%9B%90",
    tone: "bg-teal-50 text-teal-800",
  },
  {
    id: "pharmacy",
    label: "동물약국",
    href: "/places?category=%EB%8F%99%EB%AC%BC%EC%95%BD%EA%B5%AD",
    tone: "bg-emerald-50 text-emerald-800",
  },
  {
    id: "funeral",
    label: "장묘·장례",
    href: "/places?category=%EB%8F%99%EB%AC%BC%EC%9E%A5%EB%AC%98%EC%97%85",
    tone: "bg-slate-100 text-slate-800",
  },
  {
    id: "travel",
    label: "동반여행",
    href: "/travel",
    tone: "bg-cyan-50 text-cyan-900",
  },
  {
    id: "rescue",
    label: "구조공고",
    href: "/rescues",
    tone: "bg-amber-50 text-amber-900",
  },
  {
    id: "grooming",
    label: "미용학원",
    href: "#",
    tone: "bg-rose-50 text-rose-800",
    soon: true,
  },
  {
    id: "cafe",
    label: "애견카페",
    href: "#",
    tone: "bg-orange-50 text-orange-800",
    soon: true,
  },
  {
    id: "shop",
    label: "애견샵",
    href: "#",
    tone: "bg-violet-50 text-violet-800",
    soon: true,
  },
  {
    id: "regions",
    label: "지역별",
    href: "/regions",
    tone: "bg-stone-100 text-stone-800",
  },
];
