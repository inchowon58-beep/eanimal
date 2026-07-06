import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import SupportSection from "@/components/SupportSection";
import CasesGallery from "@/components/CasesGallery";
import WhyUsSection from "@/components/WhyUsSection";
import ProcessSection from "@/components/ProcessSection";
import ReviewsSection from "@/components/ReviewsSection";
import PartnerSection from "@/components/PartnerSection";
import CtaSection from "@/components/CtaSection";
import { getSiteConfig } from "@/lib/site-config";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  return buildPageMetadata(config, {
    title: `${config.brandName} | 애견미용학원 정보 · 자격증 과정 안내`,
    description: config.description,
    path: "/",
    ogPath: "/opengraph-image",
  });
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <SupportSection />
      <CasesGallery />
      <WhyUsSection />
      <ProcessSection />
      <ReviewsSection />
      <PartnerSection />
      <CtaSection />
    </>
  );
}
