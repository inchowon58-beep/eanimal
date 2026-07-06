"use client";

import { useSiteConfig } from "@/components/SiteConfigProvider";

export default function PartnerSection() {
  const site = useSiteConfig();

  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-2xl lg:text-3xl font-bold text-dark mb-4">
          학원정보 등록요청 · 제휴문의
          <br />
          <span className="text-orange">{site.brandName}</span>와 함께하세요
        </h2>
        <p className="text-gray-600 mb-2">
          애견미용학원 정보 등록 및 제휴 상담을 받고 있습니다.
        </p>
        <p className="text-lg font-bold text-dark mb-8">{site.phone}</p>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <a
            href={`tel:${site.phoneTel}`}
            className="px-8 py-3 bg-dark text-white font-bold rounded-full hover:bg-dark-light transition"
          >
            학원정보 등록요청
          </a>
          <a
            href={`tel:${site.phoneTel}`}
            className="px-8 py-3 border-2 border-dark text-dark font-bold rounded-full hover:bg-gray-50 transition"
          >
            제휴문의
          </a>
        </div>
      </div>
    </section>
  );
}
