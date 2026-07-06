import Image from "next/image";
import { getSiteConfig } from "@/lib/site-config";
import { getImageUrl } from "@/lib/site-images";
import { phoneToTel } from "@/lib/site-config";

export default async function HeroSection() {
  const site = await getSiteConfig();

  return (
    <section id="about" className="relative min-h-[85vh] flex items-center overflow-hidden">
      <Image
        src={getImageUrl(1, site)}
        alt={`${site.brandName} 애견미용학원 정보`}
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-r from-dark/90 via-dark/75 to-dark/50" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-center">
          <div className="max-w-2xl">
            <span className="inline-block bg-orange text-white text-sm font-bold px-4 py-1.5 rounded-full mb-6">
              {site.chairmanTitle}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-4">
              {site.tagline}
            </h1>
            <p className="text-lg sm:text-xl text-gray-200 mb-8 leading-relaxed">
              전국 애견미용학원 정보, 자격증 과정, 수강 후기까지
              <br />
              <strong className="text-orange">{site.brandName}</strong>에서 한 번에 확인하세요
            </p>

            <a
              href={`tel:${phoneToTel(site.phone)}`}
              className="inline-flex items-center gap-2 bg-orange text-white font-bold px-8 py-4 rounded-full hover:bg-orange-light transition shadow-lg text-lg"
            >
              무료 학원 상담
            </a>
          </div>

          <div className="hidden lg:flex flex-col items-center shrink-0">
            <div className="relative w-56 h-56 rounded-2xl overflow-hidden border-4 border-orange shadow-2xl bg-white">
              <Image
                src={site.chairmanPhoto}
                alt={site.chairmanTitle}
                fill
                className="object-cover object-top"
                priority
              />
            </div>
            <p className="mt-4 text-center text-white text-sm font-semibold max-w-[14rem] leading-snug">
              {site.chairmanTitle}
            </p>
            <p className="text-orange text-xs mt-1 font-medium">직접 검증 · 신뢰 정보 제공</p>
          </div>
        </div>
      </div>
    </section>
  );
}
