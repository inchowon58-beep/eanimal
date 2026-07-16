/**
 * 아가펫보호소(agapetstory.co.kr) 입양 가능 아이 조회
 * - Sanity 공개 쿼리 API 사용 (status === "waiting")
 */

export interface AgapetPet {
  id: string;
  name: string;
  age: string | null;
  gender: string | null;
  species: string | null;
  traits: string[];
  imageUrl: string | null;
  href: string;
}

const SANITY_URL =
  "https://58cgd16k.api.sanity.io/v2021-10-21/data/query/production";
const PETS_BASE = "https://www.agapetstory.co.kr/pets";

const QUERY = `*[_type == "pet" && status == "waiting"]{
  _id,
  name,
  age,
  gender,
  species,
  traits,
  "imageUrl": photo.asset->url
}`;

function genderLabel(g: string | null | undefined): string | null {
  if (!g) return null;
  if (g === "male" || g === "남" || g === "남아") return "남";
  if (g === "female" || g === "여" || g === "여아") return "여";
  return g;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 입양 가능(waiting) 아이들 중 랜덤 n마리 */
export async function fetchAgapetAvailable(
  limit = 6
): Promise<AgapetPet[]> {
  try {
    const url = `${SANITY_URL}?query=${encodeURIComponent(QUERY)}`;
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      result?: Array<{
        _id?: string;
        name?: string;
        age?: string | null;
        gender?: string | null;
        species?: string | null;
        traits?: string[] | null;
        imageUrl?: string | null;
      }>;
    };
    const list = (data.result || [])
      .filter((p) => p._id && p.name)
      .map((p) => ({
        id: p._id!,
        name: p.name!,
        age: p.age || null,
        gender: genderLabel(p.gender),
        species: p.species || null,
        traits: Array.isArray(p.traits) ? p.traits.filter(Boolean) : [],
        imageUrl: p.imageUrl || null,
        href: `${PETS_BASE}/${p._id}`,
      }));
    return shuffle(list).slice(0, limit);
  } catch (e) {
    console.error("[agapet]", (e as Error).message);
    return [];
  }
}
