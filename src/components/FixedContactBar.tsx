"use client";

import { useSiteConfig } from "@/components/SiteConfigProvider";

export default function FixedContactBar() {
  const site = useSiteConfig();

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 flex justify-center px-4 pb-4 sm:pb-5 safe-area-pb pointer-events-none bg-transparent">
      <a
        href={`tel:${site.phoneTel}`}
        className="pointer-events-auto inline-flex flex-col items-center justify-center gap-0.5 bg-orange text-white py-3.5 px-6 sm:px-8 rounded-full shadow-lg hover:bg-orange-light transition-all duration-200 active:scale-[0.98] max-w-[calc(100%-2rem)]"
      >
        <span className="flex items-center gap-1.5 text-[11px] sm:text-xs text-white/90">
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          학원 상담 · 전화연결
        </span>
        <span className="font-bold text-sm sm:text-base tracking-wide">{site.phone}</span>
      </a>
    </div>
  );
}
