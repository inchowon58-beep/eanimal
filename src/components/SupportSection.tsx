import Image from "next/image";
import { getSiteConfig, phoneToTel } from "@/lib/site-config";
import { getImageUrl } from "@/lib/site-images";

export default async function SupportSection() {
  const site = await getSiteConfig();

  return (
    <section id="courses" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-dark mb-6 leading-tight">
              <span className="text-orange">{site.supportBase}</span> ·{" "}
              <span className="text-orange">{site.supportExtra}</span>
              <br />
              자격증 과정 안내
            </h2>
            <p className="text-xl font-bold text-dark mb-4">
              전국 <span className="text-orange text-2xl">{site.supportMax}</span> 정보 제공
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              기초 과정부터 국가자격 대비, 창업·취업 연계까지
              목표에 맞는 애견미용학원을 비교·추천해 드립니다.
            </p>
            <p className="text-sm text-gray-400">
              *지역·과정·수강 기간에 따라 학원 정보가 달라질 수 있습니다. 무료 상담을 권장합니다.
            </p>
            <div className="mt-8">
              <a
                href={`tel:${phoneToTel(site.phone)}`}
                className="inline-flex items-center gap-2 bg-orange text-white font-bold px-6 py-3 rounded-full hover:bg-orange-light transition"
              >
                과정·학원 상담
              </a>
            </div>
          </div>

          <div className="relative h-80 lg:h-96 rounded-2xl overflow-hidden shadow-xl">
            <Image
              src={getImageUrl(3, site)}
              alt="애견미용 자격증 과정 안내"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-500 mb-2">애견미용학원 정보 포털</p>
          <h3 className="text-2xl font-bold text-dark">
            믿을 수 있는 애견미용학원 정보{" "}
            <span className="text-orange">{site.brandName}</span>
          </h3>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            학원 선택 시 정보의 신뢰성이 가장 중요합니다.
            {site.brandName}는 전국 학원 정보를 비교·안내하며, 학원 등록 요청도 받고 있습니다.
          </p>
        </div>
      </div>
    </section>
  );
}
