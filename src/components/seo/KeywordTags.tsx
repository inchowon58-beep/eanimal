interface Props {
  title?: string;
  tags: string[];
}

/** 지역·키워드 해시태그를 텍스트로 노출 (롱테일 검색 대응) */
export default function KeywordTags({ title = "관련 검색어", tags }: Props) {
  if (!tags.length) return null;
  return (
    <section className="mt-6 rounded-xl border border-border bg-muted/30 p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li
            key={tag}
            className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-fg"
          >
            #{tag}
          </li>
        ))}
      </ul>
    </section>
  );
}
