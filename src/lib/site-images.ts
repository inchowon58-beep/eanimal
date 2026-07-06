import type { SiteConfig } from "./site-config-types";

export function getImageUrl(index: number, config: SiteConfig): string {
  const max = Math.max(1, config.imageCount);
  const num = ((index - 1) % max) + 1;
  const base = config.imageCdn.replace(/\/$/, "");
  return `${base}/${String(num).padStart(2, "0")}.webp`;
}

export function getImageIndexFromSeed(seed: string, config: SiteConfig): number {
  const max = Math.max(1, config.imageCount);
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % max) + 1;
}
