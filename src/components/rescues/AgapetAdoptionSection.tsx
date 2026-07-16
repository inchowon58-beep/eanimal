import RemoteImage from "@/components/media/RemoteImage";
import type { AgapetPet } from "@/lib/agapet/fetch";

export default function AgapetAdoptionSection({ pets }: { pets: AgapetPet[] }) {
  if (!pets.length) return null;

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            아가펫보호소 · 입양 가능
          </p>
          <h2 className="mt-1 font-display text-lg font-bold text-foreground sm:text-xl">
            가족을 기다리는 아이들
          </h2>
          <p className="mt-1 text-xs text-muted-fg sm:text-sm">
            입양 가능한 아이들 중 랜덤으로 소개합니다. 클릭하면 아가펫보호소에서 자세히 볼 수 있어요.
          </p>
        </div>
        <a
          href="https://www.agapetstory.co.kr/pets"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-semibold text-accent hover:underline"
        >
          전체 보기 →
        </a>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {pets.map((pet) => {
          const meta = [pet.species, pet.age, pet.gender].filter(Boolean).join(" · ");
          const trait = pet.traits[0] || "";
          return (
            <a
              key={pet.id}
              href={pet.href}
              target="_blank"
              rel="noopener noreferrer"
              className="overflow-hidden rounded-xl border border-border bg-background transition hover:border-accent/40"
            >
              <div className="relative aspect-[4/3] bg-muted">
                <RemoteImage src={pet.imageUrl} alt={pet.name} />
                <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
                  입양 가능
                </span>
              </div>
              <div className="p-3 sm:p-4">
                <h3 className="line-clamp-1 text-sm font-semibold text-foreground sm:text-base">
                  {pet.name}
                </h3>
                {meta && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-fg">{meta}</p>
                )}
                {trait && (
                  <p className="mt-1 line-clamp-1 text-[11px] text-muted-fg sm:text-xs">
                    {trait}
                  </p>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
