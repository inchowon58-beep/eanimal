import Link from "next/link";
import { listPlaces } from "@/lib/places/queries";
import { listRescues } from "@/lib/rescues/queries";
import { listTravel } from "@/lib/travel/queries";
import { formatHappenDt } from "@/lib/rescues/types";

interface RelatedLink {
  href: string;
  label: string;
  sub?: string;
}

interface Group {
  title: string;
  moreHref: string;
  items: RelatedLink[];
}

interface Props {
  sido: string | null | undefined;
  sigungu?: string | null;
  exclude?: { rescue?: string; travel?: string; place?: string };
}

const PER_GROUP = 5;

/** 같은 지역의 병원·약국·장묘·구조공고·동반여행을 묶어 노출 (내부 링크 강화) */
export default async function RegionalRelated({ sido, sigungu, exclude }: Props) {
  if (!sido) return null;

  const [hospitals, pharmacies, funerals, rescues, travel] = await Promise.all([
    listPlaces({ sido, category: "동물병원", page: 1, pageSize: PER_GROUP }),
    listPlaces({ sido, category: "동물약국", page: 1, pageSize: PER_GROUP }),
    listPlaces({ sido, category: "동물장묘업", page: 1, pageSize: PER_GROUP }),
    listRescues({ sido, page: 1 }),
    listTravel({ sido, page: 1 }),
  ]);

  const regionLabel = [sido, sigungu].filter(Boolean).join(" ");

  const groups: Group[] = [];

  const placeGroup = (title: string, category: string, items: typeof hospitals.items) => {
    const links = items
      .filter((p) => p.id !== exclude?.place)
      .slice(0, PER_GROUP)
      .map((p) => ({
        href: `/places/${p.id}`,
        label: p.title,
        sub: [p.sigungu, p.status].filter(Boolean).join(" · "),
      }));
    if (links.length) {
      groups.push({
        title,
        moreHref: `/places?category=${encodeURIComponent(category)}&sido=${encodeURIComponent(sido)}`,
        items: links,
      });
    }
  };

  placeGroup("동물병원", "동물병원", hospitals.items);
  placeGroup("동물약국", "동물약국", pharmacies.items);
  placeGroup("동물장묘업", "동물장묘업", funerals.items);

  const rescueLinks = rescues.items
    .filter((a) => a.desertion_no !== exclude?.rescue)
    .slice(0, PER_GROUP)
    .map((a) => ({
      href: `/rescues/${encodeURIComponent(a.desertion_no)}`,
      label: a.kind_cd || "구조동물",
      sub: [a.happen_place, formatHappenDt(a.happen_dt)].filter(Boolean).join(" · "),
    }));
  if (rescueLinks.length) {
    groups.push({
      title: "유기동물 공고",
      moreHref: `/rescues?sido=${encodeURIComponent(sido)}`,
      items: rescueLinks,
    });
  }

  const travelLinks = travel.items
    .filter((t) => t.content_id !== exclude?.travel)
    .slice(0, PER_GROUP)
    .map((t) => ({
      href: `/travel/${encodeURIComponent(t.content_id)}`,
      label: t.title,
      sub: [t.sigungu, t.address].filter(Boolean).join(" · ") || undefined,
    }));
  if (travelLinks.length) {
    groups.push({
      title: "반려동물 동반여행",
      moreHref: `/travel?sido=${encodeURIComponent(sido)}`,
      items: travelLinks,
    });
  }

  if (!groups.length) return null;

  return (
    <section className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-8">
      <h2 className="font-display text-lg font-semibold text-foreground">
        {regionLabel} 반려동물 관련 정보
      </h2>
      <p className="mt-1 text-xs text-muted-fg">
        같은 지역의 동물병원·약국·장묘업체와 구조공고, 동반여행 장소를 함께 확인해 보세요.
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <div key={group.title} className="rounded-lg border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
              <Link href={group.moreHref} className="text-xs text-accent hover:underline">
                더보기
              </Link>
            </div>
            <ul className="mt-3 space-y-2">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="block hover:text-accent">
                    <span className="line-clamp-1 text-sm text-foreground">{item.label}</span>
                    {item.sub && (
                      <span className="line-clamp-1 text-xs text-muted-fg">{item.sub}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
