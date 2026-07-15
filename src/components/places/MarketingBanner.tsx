import { getActiveBanners } from "@/lib/banners/queries";
import type { Banner } from "@/lib/banners/types";

function normalizePhoneHref(phone: string): string {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}

function BannerButtons({ banner, light }: { banner: Banner; light?: boolean }) {
  if (!banner.link_url && !banner.phone) return null;
  const primary = light
    ? "bg-white text-accent hover:bg-white/90"
    : "bg-accent text-accent-fg hover:opacity-90";
  const secondary = light
    ? "border border-white/70 text-white hover:bg-white/10"
    : "border border-accent/40 text-accent hover:bg-accent/5";
  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      {banner.link_url && (
        <a
          href={banner.link_url}
          target="_blank"
          rel="noreferrer nofollow"
          className={`inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-xs font-semibold transition ${primary}`}
        >
          홈페이지 바로가기
        </a>
      )}
      {banner.phone && (
        <a
          href={normalizePhoneHref(banner.phone)}
          className={`inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-xs font-semibold transition ${secondary}`}
        >
          즉시 전화문의
        </a>
      )}
    </div>
  );
}

function BannerCard({ banner }: { banner: Banner }) {
  const hasText = Boolean(banner.title || banner.description);

  // 텍스트가 없고 이미지만 있으면 → 이미지만 노출 (링크 있으면 클릭 가능)
  if (!hasText && banner.image_url) {
    const img = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={banner.image_url}
        alt="배너"
        className="block h-auto w-full rounded-xl border border-border object-contain"
        loading="lazy"
      />
    );
    return banner.link_url ? (
      <a href={banner.link_url} target="_blank" rel="noreferrer nofollow" className="block">
        {img}
      </a>
    ) : (
      img
    );
  }

  // 이미지 배경 + 텍스트
  if (banner.image_url) {
    return (
      <aside
        className="relative overflow-hidden rounded-xl border border-border"
        aria-label={banner.title || "안내 배너"}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${banner.image_url}")` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/20" aria-hidden />
        <div className="relative flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="text-white">
            {banner.title && (
              <p className="text-base font-bold sm:text-lg">{banner.title}</p>
            )}
            {banner.description && (
              <p className="mt-1 text-sm text-white/90 whitespace-pre-line">
                {banner.description}
              </p>
            )}
          </div>
          <BannerButtons banner={banner} light />
        </div>
      </aside>
    );
  }

  // 이미지 없이 텍스트만
  return (
    <aside
      className="rounded-xl border border-accent/25 bg-accent/5 px-4 py-4 sm:px-6 sm:py-5"
      aria-label={banner.title || "안내 배너"}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {banner.title && (
            <p className="text-base font-bold text-foreground sm:text-lg">{banner.title}</p>
          )}
          {banner.description && (
            <p className="mt-1 text-sm text-muted-fg whitespace-pre-line">
              {banner.description}
            </p>
          )}
        </div>
        <BannerButtons banner={banner} />
      </div>
    </aside>
  );
}

/** 관리자 등록 배너 슬롯 — 노출영역(placement)에 맞는 활성 배너를 렌더링.
 *  여러 개면 매 요청마다 무작위로 하나를 노출(로테이션)한다. */
export default async function MarketingBanner({ placement }: { placement: string }) {
  const banners = await getActiveBanners(placement);
  if (banners.length === 0) return null;

  const banner =
    banners.length === 1
      ? banners[0]
      : banners[Math.floor(Math.random() * banners.length)];

  return (
    <div className="space-y-3">
      <BannerCard banner={banner} />
    </div>
  );
}
