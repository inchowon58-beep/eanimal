import Image from "next/image";
import ExternalLink from "@/components/ExternalLink";
import { CONSTRUCTION_CASES } from "@/lib/cases";
import { getFeaturedPartners } from "@/lib/data";
import { getSiteConfig } from "@/lib/site-config";
import { getImageUrl } from "@/lib/site-images";
import { isGenericPlaceImage } from "@/lib/naver-place-resolve";

export default async function CasesGallery() {
  const site = await getSiteConfig();
  const featuredPartners = await getFeaturedPartners();

  const useFeatured = featuredPartners.length > 0;

  return (
    <section id="academies" className="py-16 lg:py-24 bg-gray-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-dark mb-3">
            {site.brandName} 학원 정보
          </h2>
          <p className="text-gray-600">
            {useFeatured
              ? "등록된 애견·펫 관련 업체 및 학원 정보"
              : "전국 애견미용학원 과정·특화 분야를 확인해 보세요"}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {useFeatured
            ? featuredPartners.map((partner) => (
                <article
                  key={partner.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition group"
                >
                  <ExternalLink href={partner.placeUrl} className="block">
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      {partner.imageUrl && !isGenericPlaceImage(partner.imageUrl) ? (
                        <Image
                          src={partner.imageUrl}
                          alt={partner.name}
                          fill
                          className="object-cover group-hover:scale-105 transition duration-300"
                          unoptimized
                        />
                      ) : (
                        <Image
                          src={getImageUrl(
                            Math.abs(partner.name.charCodeAt(0) % site.imageCount) + 1,
                            site
                          )}
                          alt={partner.name}
                          fill
                          className="object-cover group-hover:scale-105 transition duration-300"
                        />
                      )}
                      <span className="absolute top-3 left-3 bg-orange text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        {partner.type}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-dark text-sm leading-snug group-hover:text-orange transition">
                        {partner.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{partner.address}</p>
                    </div>
                  </ExternalLink>
                </article>
              ))
            : CONSTRUCTION_CASES.map((item) => (
                <article
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition group"
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={getImageUrl(item.imageIndex, site)}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-orange text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {item.type}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-dark text-sm leading-snug">{item.title}</h3>
                  </div>
                </article>
              ))}
        </div>
      </div>
    </section>
  );
}
