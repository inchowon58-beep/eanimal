import { PLACE_CATEGORIES } from "@/lib/site";
import type { PlacesFilter } from "@/lib/places/types";

interface Props {
  filter: PlacesFilter;
  sidoOptions: string[];
  sigunguOptions: string[];
}

/** GET form → SSR (클라이언트 API 호출 없음) */
export default function PlacesFilterBar({
  filter,
  sidoOptions,
  sigunguOptions,
}: Props) {
  return (
    <form
      method="get"
      action="/places"
      className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-fg">
        시 / 도
        <select
          name="sido"
          defaultValue={filter.sido ?? ""}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring"
        >
          <option value="">전체</option>
          {sidoOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-fg">
        시 / 군 / 구
        <select
          name="sigungu"
          defaultValue={filter.sigungu ?? ""}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring"
        >
          <option value="">전체</option>
          {sigunguOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-fg">
        카테고리
        <select
          name="category"
          defaultValue={filter.category ?? ""}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring"
        >
          <option value="">전체</option>
          {PLACE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-fg sm:col-span-2 lg:col-span-1">
        업체명 검색
        <input
          type="search"
          name="q"
          defaultValue={filter.q ?? ""}
          placeholder="상호 입력"
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring"
        />
      </label>

      <div className="flex items-end sm:col-span-2 lg:col-span-1">
        <button
          type="submit"
          className="h-10 w-full rounded-lg bg-accent text-sm font-semibold text-accent-fg transition hover:opacity-90"
        >
          필터 적용
        </button>
      </div>
    </form>
  );
}
