import RemoteImage from "@/components/media/RemoteImage";
import type { AgapetPet } from "@/lib/agapet/fetch";

/** 유기동물 공고 상세 상단용 — PC 3마리 / 모바일 2마리 */
export default function AgapetMiniStrip({ pets }: { pets: AgapetPet[] }) {
  const list = pets.slice(0, 3);
  if (!list.length) return null;

  return (
    <section className="mt-4 mb-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
          파양견입양공고
        </h2>
        <a
          href="https://www.agapetstory.co.kr/pets"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-semibold text-accent hover:underline"
        >
          공고더보기 →
        </a>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {list.map((pet, i) => {
          const meta = [pet.species, pet.age, pet.gender].filter(Boolean).join(" · ");
          return (
            <a
              key={pet.id}
              href={pet.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`overflow-hidden rounded-xl border border-border bg-card transition hover:border-accent/40 ${
                i === 2 ? "hidden sm:block" : ""
              }`}
            >
              <div className="relative aspect-[4/3] bg-muted">
                <RemoteImage src={pet.imageUrl} alt={pet.name} />
              </div>
              <div className="p-2.5 sm:p-3">
                <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
                  {pet.name}
                </h3>
                {meta && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-fg">{meta}</p>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
