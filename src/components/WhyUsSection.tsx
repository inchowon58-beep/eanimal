"use client";

import { WHY_US } from "@/lib/cases";
import { useSiteConfig } from "@/components/SiteConfigProvider";

export default function WhyUsSection() {
  const site = useSiteConfig();

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-dark mb-3">
            {site.brandName}가 합리적인 견적을
            <br />
            <span className="text-orange">제안할 수 있는 이유</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {WHY_US.map((item) => (
            <div
              key={item.num}
              className="text-center p-8 rounded-2xl bg-gray-bg border border-gray-100"
            >
              <span className="inline-block text-4xl font-black text-orange/30 mb-4">
                {item.num}
              </span>
              <h3 className="text-lg font-bold text-dark mb-2">{item.title}</h3>
              <p className="text-2xl font-black text-orange">{item.highlight}</p>
              <p className="text-sm text-gray-500 mt-1">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
