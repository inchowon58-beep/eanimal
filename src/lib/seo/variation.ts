/**
 * 페이지별로 본문 문장을 다르게 조합하기 위한 결정론적(seed 기반) 헬퍼.
 * 같은 항목은 항상 같은 결과를, 다른 항목은 서로 다른 문장을 선택하게 하여
 * 검색엔진의 "유사문서" 판정을 완화한다.
 */

export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** seed 값으로 배열에서 하나를 고정 선택 */
export function seededPick<T>(arr: readonly T[], seed: number): T {
  if (arr.length === 0) throw new Error("seededPick: empty array");
  return arr[seed % arr.length];
}

/** seed 값으로 배열 순서를 섞어 반환 (원본 불변) */
export function seededShuffle<T>(arr: readonly T[], seed: number): T[] {
  const out = [...arr];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
