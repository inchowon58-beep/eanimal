import Link from "next/link";

function buildPageItems(current: number, total: number): (number | "…")[] {
  if (total <= 13) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const set = new Set<number>();
  set.add(1);
  set.add(total);
  for (let i = current - 2; i <= current + 2; i++) {
    if (i >= 1 && i <= total) set.add(i);
  }
  if (current <= 4) {
    for (let i = 1; i <= 7; i++) set.add(i);
  }
  if (current >= total - 3) {
    for (let i = total - 6; i <= total; i++) if (i >= 1) set.add(i);
  }

  const sorted = Array.from(set).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev && n - prev > 1) out.push("…");
    out.push(n);
    prev = n;
  }
  return out;
}

interface Props {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}

export default function ListPagination({
  page,
  totalPages,
  basePath,
  params = {},
}: Props) {
  if (totalPages <= 1) return null;
  const items = buildPageItems(page, totalPages);

  function href(p: number) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) qs.set(k, v);
    }
    qs.set("page", String(p));
    return `${basePath}?${qs.toString()}`;
  }

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
      aria-label="페이지"
    >
      {page > 1 && (
        <Link
          href={href(page - 1)}
          className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-sm text-muted-fg hover:text-foreground"
        >
          이전
        </Link>
      )}
      {items.map((item, idx) =>
        item === "…" ? (
          <span
            key={`e-${idx}`}
            className="inline-flex h-9 min-w-9 items-center justify-center text-sm text-muted-fg"
          >
            …
          </span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm ${
              item === page
                ? "bg-accent font-semibold text-accent-fg"
                : "border border-border bg-card text-muted-fg hover:text-foreground"
            }`}
          >
            {item}
          </Link>
        )
      )}
      {page < totalPages && (
        <Link
          href={href(page + 1)}
          className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-sm text-muted-fg hover:text-foreground"
        >
          다음
        </Link>
      )}
      <span className="ml-2 text-xs text-muted-fg">
        {page} / {totalPages.toLocaleString("ko-KR")} 페이지
      </span>
    </nav>
  );
}
