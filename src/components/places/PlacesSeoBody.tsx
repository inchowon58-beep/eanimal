import { buildPlacesListSeoCopy } from "@/lib/places/seo-copy";
import type { PlaceCategory } from "@/lib/site";

interface Props {
  sido?: string;
  sigungu?: string;
  category?: PlaceCategory | "";
  total: number;
}

export default function PlacesSeoBody({
  sido,
  sigungu,
  category,
  total,
}: Props) {
  const text = buildPlacesListSeoCopy({ sido, sigungu, category, total });
  const paragraphs = text.split("\n\n").filter(Boolean);

  return (
    <section className="seo-body mt-12 rounded-xl border border-border bg-card p-5 sm:p-8">
      <h2 className="font-display text-lg font-semibold text-foreground">
        {sido || sigungu
          ? `${[sido, sigungu].filter(Boolean).join(" ")} 반려동물 인프라 안내`
          : "전국 반려동물 인프라 안내"}
      </h2>
      <div className="mt-4">
        {paragraphs.map((p) => (
          <p key={p.slice(0, 32)}>{p}</p>
        ))}
      </div>
    </section>
  );
}
