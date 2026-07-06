import Image from "next/image";
import { getSiteConfig, phoneToTel } from "@/lib/site-config";
import { getImageUrl } from "@/lib/site-images";

export default async function CtaSection() {
  const site = await getSiteConfig();

  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      <Image
        src={getImageUrl(5, site)}
        alt="애견미용학원 상담"
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-dark/80" />
      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center text-white">
        <h2 className="text-2xl lg:text-4xl font-bold mb-4">
          애견미용학원 상담 · 등록요청
          <br />
          지금 바로 문의하세요
        </h2>
        <p className="text-gray-300 mb-8">
          {site.supportBase} · {site.supportExtra} 과정 · 전국 {site.supportMax}
        </p>
        <a
          href={`tel:${phoneToTel(site.phone)}`}
          className="inline-flex items-center gap-2 bg-orange text-white font-bold px-8 py-4 rounded-full hover:bg-orange-light transition shadow-lg"
        >
          학원 상담 {site.phone}
        </a>
      </div>
    </section>
  );
}
