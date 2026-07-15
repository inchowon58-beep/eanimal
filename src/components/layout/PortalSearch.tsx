"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type SearchTarget = "places" | "rescues" | "travel";

export default function PortalSearch({
  large = false,
  defaultTarget = "places",
}: {
  large?: boolean;
  defaultTarget?: SearchTarget;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    const qs = query ? `?q=${encodeURIComponent(query)}` : "";
    if (defaultTarget === "rescues") router.push(`/rescues${qs}`);
    else if (defaultTarget === "travel") router.push(`/travel${qs}`);
    else router.push(`/places${qs}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{ borderColor: "var(--accent)" }}
      className={`flex w-full items-center gap-2 rounded-full border-2 bg-card pl-5 shadow-sm focus-within:ring-2 focus-within:ring-accent/25 ${
        large ? "h-12 pr-1.5 sm:h-14" : "h-11 pr-1"
      }`}
    >
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="검색어를 입력하세요!"
        className={`min-w-0 flex-1 border-0 bg-transparent text-foreground outline-none placeholder:text-muted-fg ${
          large ? "text-base" : "text-sm"
        }`}
        autoComplete="off"
      />
      <button
        type="submit"
        aria-label="검색"
        className={`flex shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg transition hover:opacity-90 ${
          large ? "h-10 w-10 sm:h-11 sm:w-11" : "h-8 w-8"
        }`}
      >
        <svg
          className={large ? "h-5 w-5" : "h-4 w-4"}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path
            d="m20 20-3.2-3.2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </form>
  );
}
