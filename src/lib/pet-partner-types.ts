export const PET_PARTNER_TYPES = [
  { type: "강아지분양", searchTerm: "강아지분양" },
  { type: "애견카페", searchTerm: "애견카페" },
  { type: "애견호텔", searchTerm: "애견호텔" },
  { type: "애견유치원", searchTerm: "애견유치원" },
  { type: "애견훈련소", searchTerm: "애견훈련소" },
  { type: "애견미용", searchTerm: "애견미용" },
  { type: "강아지장례식장", searchTerm: "강아지장례식장" },
] as const;

export type PetPartnerType = (typeof PET_PARTNER_TYPES)[number]["type"];

function hashSeed(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** 키워드 기준으로 7종 중 랜덤 4개 선택 (페이지마다 고정) */
export function pickRandomPetPartnerTypes(seed: string, count = 4) {
  const sorted = [...PET_PARTNER_TYPES].sort(
    (a, b) => hashSeed(`${seed}-${a.type}`) - hashSeed(`${seed}-${b.type}`)
  );
  return sorted.slice(0, Math.min(count, sorted.length));
}
