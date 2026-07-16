import RemoteImage from "@/components/media/RemoteImage";
import type { AgapetPet } from "@/lib/agapet/fetch";

export default function AgapetAdoptionSection({ pets }: { pets: AgapetPet[] }) {
  if (!pets.length) return null;

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            보호자의 개인사정으로 파양된 아이들
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-fg sm:text-sm">
            아래 아이들은 길에서 구조된 유기동물이 아닙니다. 보호자가 더 이상 키우기 어려운 사정으로
            파양·인도가 된 아이들입니다. 새로운 가족을 기다리고 있어요.
          </p>
        </div>
        <a
          href="https://www.agapetstory.co.kr/pets"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-semibold text-accent hover:underline"
        >
          아가펫보호소 전체 보기 →
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
              className="overflow-hidden rounded-xl border border-border bg-card transition hover:border-accent/40"
            >
              <div className="relative aspect-[4/3] bg-muted">
                <RemoteImage src={pet.imageUrl} alt={pet.name} />
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
