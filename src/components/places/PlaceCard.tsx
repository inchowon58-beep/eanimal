import Link from "next/link";
import type { Place } from "@/lib/places/types";

function isOpen(status: string) {
  return status.includes("영업") && !status.includes("폐업") && !status.includes("휴업");
}

export default function PlaceCard({ place }: { place: Place }) {
  const open = isOpen(place.status);
  const address = place.address_road || place.address_jibun || "주소 미등록";

  return (
    <Link
      href={`/places/${place.id}`}
      className="group flex flex-col rounded-xl border border-border bg-card p-4 transition hover:border-accent/40 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-fg">
          {place.category}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-fg">
          <span
            className={`h-1.5 w-1.5 rounded-full ${open ? "bg-success" : "bg-danger"}`}
            aria-hidden
          />
          {place.status}
        </span>
      </div>
      <h2 className="mt-3 text-base font-semibold tracking-tight text-foreground group-hover:text-accent">
        {place.title}
      </h2>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-fg">{address}</p>
      <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-fg">
        <span>
          {[place.sido, place.sigungu].filter(Boolean).join(" ") || "지역 미상"}
        </span>
        <span>{place.phone || "전화 없음"}</span>
      </div>
    </Link>
  );
}
