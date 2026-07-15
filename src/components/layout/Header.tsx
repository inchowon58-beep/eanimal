import SiteLogo from "@/components/brand/SiteLogo";
import HeaderNav from "@/components/layout/HeaderNav";
import { SITE } from "@/lib/site";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md">
      {/* 상단 안내 바 */}
      <div className="bg-[#0b3d3a] text-[#f5f0e6]">
        <div className="mx-auto max-w-6xl px-4 py-1.5 text-center text-[11px] leading-snug sm:px-6 sm:text-xs">
          {SITE.name}는 공공데이터, 관련 기관 공개자료 및 자체 검증 정보를 바탕으로
          올바른 반려문화 확산을 위해 노력합니다.
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
