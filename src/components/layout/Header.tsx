import SiteLogo from "@/components/brand/SiteLogo";
import HeaderNav from "@/components/layout/HeaderNav";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md">
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
