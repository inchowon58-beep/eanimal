"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type SearchTarget = "places" | "rescues" | "travel";

const TARGETS: { value: SearchTarget; label: string }[] = [
  { value: "places", label: "시설" },
  { value: "rescues", label: "구조공고" },
  { value: "travel", label: "동반여행" },
];

export default function PortalSearch({
  large = false,
  defaultTarget = "places",
}: {
  large?: boolean;
  defaultTarget?: SearchTarget;
}) {
  const router = useRouter();
  const [target, setTarget] = useState<SearchTarget>(defaultTarget);
  const [q, setQ] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    const qs = query ? `?q=${encodeURIComponent(query)}` : "";
    if (target === "rescues") router.push(`/rescues${qs}`);
    else if (target === "travel") router.push(`/travel${qs}`);
    else router.push(`/places${qs}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`flex w-full items-stretch overflow-hidden rounded-full border border-border bg-card shadow-sm focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/20 ${
        large ? "h-12 sm:h-14" : "h-10"
      }`}
    >
      <label className="sr-only" htmlFor="portal-search-target">
        검색 대상
      </label>
      <select
        id="portal-search-target"
        value={target}
        onChange={(e) => setTarget(e.target.value as SearchTarget)}
        className={`shrink-0 border-0 border-r border-border bg-muted/60 pl-3 pr-1 text-xs font-medium text-foreground outline-none sm:text-sm ${
          large ? "sm:pl-4" : ""
        }`}
      >
        {TARGETS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="시설명·품종·지역·장소명 검색"
        className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-fg"
        autoComplete="off"
      />
      <button
        type="submit"
        className={`shrink-0 bg-accent font-semibold text-accent-fg transition hover:opacity-90 ${
          large ? "px-5 text-sm sm:px-6" : "px-4 text-xs"
        }`}
      >
        검색
      </button>
    </form>
  );
}
