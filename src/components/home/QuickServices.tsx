import Link from "next/link";
import { QUICK_SERVICES, type QuickServiceId } from "@/lib/nav";

function ServiceGlyph({ id }: { id: QuickServiceId }) {
  const common = "h-6 w-6";
  switch (id) {
    case "hospital":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "pharmacy":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M8 4h8l2 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8l2-4Z"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <path d="M9 4v4h6V4" stroke="currentColor" strokeWidth="1.75" />
          <path d="M12 12v5M9.5 14.5h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "funeral":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 20h16M6 20V10l6-5 6 5v10"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path d="M10 20v-5h4v5" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
    case "travel":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
          <path d="M4 12h16M12 4c2.5 2.8 3.8 5.5 3.8 8S14.5 17.2 12 20c-2.5-2.8-3.8-5.5-3.8-8S9.5 6.8 12 4Z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "rescue":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 4c-1.5 0-2.8.9-3.4 2.2C7.4 5 5.8 5.3 4.9 6.6 3.7 8.3 4.1 10.7 6 12.2L12 20l6-7.8c1.9-1.5 2.3-3.9 1.1-5.6-.9-1.3-2.5-1.6-3.7-.4C14.8 4.9 13.5 4 12 4Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "regions":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
    case "grooming":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="6" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="6" cy="17" r="2.5" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="m8 8.5 11 8.5M8 15.5 19 7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "cafe":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 8h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M16 9h2.5a2 2 0 0 1 0 4H16" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 3.5v2M11 3.5v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M4 20h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "shop":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 8h12l-1 12H7L6 8Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M9 8a3 3 0 0 1 6 0"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

export default function QuickServices({ className = "" }: { className?: string }) {
  return (
    <ul
      className={`grid grid-cols-3 gap-3 sm:grid-cols-9 sm:gap-2 ${className}`}
    >
      {QUICK_SERVICES.map((s) => {
        const icon = (
          <>
            <span className="relative">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${s.tone} sm:h-14 sm:w-14`}
              >
                <ServiceGlyph id={s.id} />
              </span>
              {s.soon && (
                <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-semibold leading-none text-accent-fg">
                  준비중
                </span>
              )}
            </span>
            <span className="text-[11px] font-medium leading-tight text-foreground sm:text-xs">
              {s.label}
            </span>
          </>
        );

        return (
          <li key={s.id}>
            {s.soon ? (
              <span
                aria-disabled
                className="flex cursor-default flex-col items-center gap-2 rounded-xl px-1 py-2 text-center opacity-70"
              >
                {icon}
              </span>
            ) : (
              <Link
                href={s.href}
                className="flex flex-col items-center gap-2 rounded-xl px-1 py-2 text-center transition hover:bg-muted/70"
              >
                {icon}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
