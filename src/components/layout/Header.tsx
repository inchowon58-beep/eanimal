import SiteLogo from "@/components/brand/SiteLogo";
import HeaderNav from "@/components/layout/HeaderNav";
import { SITE } from "@/lib/site";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md">
      {/* 상단 안내 바 */}
      <div className="bg-[#12776d] text-[#f5f0e6]">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-1.5 px-4 py-2 text-center text-xs leading-snug sm:px-6 sm:text-sm">
          <svg
            className="h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M4 9v6h3l5 4V5L7 9H4Z"
              fill="currentColor"
              opacity="0.9"
            />
            <path
              d="M16 8.5a4 4 0 0 1 0 7"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <span>
            {SITE.name}는 공공데이터, 관련 기관 공개자료 및 자체 검증 정보를
            바탕으로 올바른 반려문화 확산을 위해 노력합니다.
          </span>
        </div>
      </div>

      {/* 로고 + 메뉴 */}
      <div className="relative border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:gap-5 sm:px-6 sm:py-3">
          <SiteLogo />
          <HeaderNav />
        </div>
      </div>
    </header>
  );
}
