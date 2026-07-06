import Image from "next/image";
import ExternalLink from "@/components/ExternalLink";
import type { LocalPartner } from "@/lib/data";

interface Props {
  region: string;
  partners: LocalPartner[];
  brandName: string;
}

export default function LocalPartnersSection({ region, partners, brandName }: Props) {
  if (partners.length === 0) return null;

  return (
    <section className="mt-10 bg-white rounded-2xl p-6 lg:p-8 shadow-sm">
      <h2 className="text-xl font-bold text-dark mb-2">
        {region} 애견·펫 관련 업체
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        {region} 지역 강아지분양·애견카페·애견호텔·애견유치원·애견훈련소·애견미용·강아지장례식장
        중 랜덤 4개 업종 정보입니다. {brandName} 학원 상담 시 참고하실 수 있습니다. (출처: 네이버
        지도)
      </p>
      <ul className="grid sm:grid-cols-2 gap-4">
        {partners.map((partner) => (
          <li
            key={`${partner.type}-${partner.name}`}
            className="rounded-xl border border-gray-100 overflow-hidden hover:border-orange/30 transition"
          >
            <div className="flex gap-0 sm:flex-col">
              {partner.imageUrl && (
                <div className="relative w-24 sm:w-full h-24 sm:h-36 shrink-0 bg-gray-100">
                  <Image
                    src={partner.imageUrl}
                    alt={partner.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div className="p-4 flex flex-col flex-1 min-w-0">
                <span className="inline-block text-xs font-bold text-orange bg-orange/10 px-2.5 py-1 rounded-full mb-2 w-fit">
                  {partner.type}
                </span>
                <h3 className="font-bold text-dark text-base mb-1">
                  <ExternalLink
                    href={partner.placeUrl}
                    className="hover:text-orange transition underline-offset-2 hover:underline"
                  >
                    {partner.name}
                  </ExternalLink>
                </h3>
                <p className="text-sm text-gray-600 flex-1">📍 {partner.address}</p>
                <ExternalLink
                  href={partner.placeUrl}
                  className="mt-3 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-orange border border-orange rounded-lg hover:bg-orange hover:text-white transition w-fit"
                >
                  네이버 플레이스
                </ExternalLink>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
