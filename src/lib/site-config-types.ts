export interface SiteConfig {
  brandName: string;
  companyName: string;
  tagline: string;
  description: string;
  url: string;
  phone: string;
  email: string;
  address: string;
  businessNumber: string;
  representative: string;
  imageCdn: string;
  imageCount: number;
  supportBase: string;
  supportExtra: string;
  supportMax: string;
  geminiApiKey: string;
  naverClientId: string;
  naverClientSecret: string;
  dailySeoLimit: number;
  naverExposureId: string;
  naverExposurePassword: string;
  serviceAvailableDays: number;
  serviceExpiresAt: string;
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  brandName: "1977 한국애견미용학원정보",
  companyName: "1977 한국애견미용학원정보",
  tagline: "믿을 수 있는 한국 애견미용학원 정보 포털",
  description:
    "전국 애견미용학원 정보를 한곳에서 비교·안내합니다. 자격증 과정, 수강료, 실습 환경, 수강 후기까지 확인하세요.",
  url: "https://dogschool1977.yourdogzone.co.kr",
  phone: "010-9906-4068",
  email: "info@1977dogschool.co.kr",
  address: "전국 애견미용학원 정보 제공",
  businessNumber: "",
  representative: "",
  imageCdn: "https://image.cattery.co.kr/dogboho",
  imageCount: 20,
  supportBase: "애견미용사",
  supportExtra: "애견미용관리사",
  supportMax: "전국 500+ 학원",
  geminiApiKey: "",
  naverClientId: "",
  naverClientSecret: "",
  dailySeoLimit: 10,
  naverExposureId: "",
  naverExposurePassword: "",
  serviceAvailableDays: 30,
  serviceExpiresAt: "",
};

export function phoneToTel(phone: string): string {
  return phone.replace(/\D/g, "");
}

export type PublicSiteConfig = Omit<SiteConfig, "geminiApiKey"> & {
  phoneTel: string;
};

export function toPublicConfig(config: SiteConfig): PublicSiteConfig {
  const { geminiApiKey: _, ...rest } = config;
  return { ...rest, phoneTel: phoneToTel(rest.phone) };
}
