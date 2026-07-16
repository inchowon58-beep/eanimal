import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";

const BUCKET = process.env.SEO_IMAGE_BUCKET || "seo-images";
const IMG_RE = /\.(png|jpe?g|webp|gif|avif)$/i;
/** URL용 확장자 매칭 (쿼리스트링 허용) */
const IMG_URL_RE = /\.(png|jpe?g|webp|gif|avif)(\?[^\s"']*)?$/i;

function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) || 1;
}

function makeRng(seed: string) {
  let h = strHash(seed);
  return () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 입력값에서 버킷/폴더 경로 해석.
 * - "shelter" → { bucket: 기본, prefix: "shelter" }
 * - 전체 public URL(.../object/public/<bucket>/<path>) → 그 버킷/경로
 * - "bucket:/folder" 또는 "bucket:folder" → 명시 버킷
 */
function parseFolderInput(input: string | null | undefined): { bucket: string; prefix: string } {
  const raw = (input || "").trim();
  if (!raw) return { bucket: BUCKET, prefix: "" };

  const marker = "/storage/v1/object/public/";
  const idx = raw.indexOf(marker);
  if (idx >= 0) {
    const rest = raw.slice(idx + marker.length).replace(/^\/+|\/+$/g, "");
    const [bucket, ...parts] = rest.split("/");
    return { bucket: bucket || BUCKET, prefix: parts.join("/") };
  }

  const colon = raw.indexOf(":");
  if (colon > 0 && !raw.startsWith("http")) {
    return {
      bucket: raw.slice(0, colon).trim(),
      prefix: raw.slice(colon + 1).replace(/^\/+|\/+$/g, ""),
    };
  }

  return { bucket: BUCKET, prefix: raw.replace(/^\/+|\/+$/g, "") };
}

function isSupabasePublicUrl(raw: string): boolean {
  return raw.includes("/storage/v1/object/public/");
}

function absolutize(base: string, ref: string): string {
  try {
    return new URL(ref, base).href;
  } catch {
    return "";
  }
}

async function fetchText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; eanimal-bot)" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** HTML(디렉터리 자동 인덱스)에서 이미지 링크 추출 */
function parseHtmlImages(html: string, base: string): string[] {
  const out: string[] = [];
  const re = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const ref = m[1];
    if (!IMG_URL_RE.test(ref)) continue;
    const abs = absolutize(base, ref);
    if (abs) out.push(abs);
  }
  return out;
}

/**
 * 사이트 루트의 /data/folders-index.json 매니페스트 방식.
 * (예: image.cattery.co.kr — 각 폴더가 01.webp, 02.webp ... 로 저장됨)
 * 매니페스트에서 folder/count/format/sample 을 읽어 zero-padding 파일명으로 URL을 구성한다.
 */
async function listManifestFolderImages(folderUrl: string): Promise<string[]> {
  let u: URL;
  try {
    u = new URL(folderUrl);
  } catch {
    return [];
  }
  const origin = u.origin;
  const folderName = u.pathname.replace(/^\/+|\/+$/g, "").split("/").pop() || "";
  if (!folderName) return [];

  const text = await fetchText(`${origin}/data/folders-index.json`);
  if (!text) return [];
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return [];
  }
  const folders = (data as { folders?: unknown })?.folders;
  if (!Array.isArray(folders)) return [];
  const entry = folders.find(
    (f) => f && typeof f === "object" && (f as { folder?: string }).folder === folderName,
  ) as { count?: number; format?: string; sample?: string } | undefined;
  if (!entry) return [];

  const count = Number(entry.count) || 0;
  if (count <= 0) return [];
  const format = typeof entry.format === "string" && entry.format ? entry.format : "webp";
  // sample(예: /dogboho/01.webp)에서 zero-padding 자릿수 추출
  let pad = 2;
  const m = typeof entry.sample === "string" ? entry.sample.match(/(\d+)\.[a-z0-9]+$/i) : null;
  if (m) pad = m[1].length;

  const urls: string[] = [];
  for (let i = 1; i <= count; i++) {
    urls.push(`${origin}/${folderName}/${String(i).padStart(pad, "0")}.${format}`);
  }
  return urls;
}

/**
 * 외부 사이트 폴더 URL에서 이미지 목록을 읽는다.
 * 우선순위: /data/folders-index.json 매니페스트 → index.json → list.txt → 디렉터리 자동 인덱스 HTML
 * 예) https://image.cattery.co.kr/dogboho
 */
export async function listExternalFolderImages(folderUrl: string): Promise<string[]> {
  // 0) 사이트 루트 매니페스트(image.cattery.co.kr 형태)
  const manifestUrls = await listManifestFolderImages(folderUrl);
  if (manifestUrls.length) return manifestUrls;

  const base = folderUrl.endsWith("/") ? folderUrl : `${folderUrl}/`;

  // 1) index.json 매니페스트
  const manifest = await fetchText(`${base}index.json`);
  if (manifest) {
    try {
      const arr = JSON.parse(manifest);
      if (Array.isArray(arr)) {
        const urls = arr
          .map((x) => (typeof x === "string" ? absolutize(base, x) : ""))
          .filter((u) => u && IMG_URL_RE.test(u));
        if (urls.length) return Array.from(new Set(urls));
      }
    } catch {
      /* not json */
    }
  }

  // 2) list.txt (한 줄에 파일명 또는 URL)
  const listTxt = await fetchText(`${base}list.txt`);
  if (listTxt && listTxt.trim()) {
    const urls = listTxt
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => absolutize(base, s))
      .filter((u) => u && IMG_URL_RE.test(u));
    if (urls.length) return Array.from(new Set(urls));
  }

  // 3) 디렉터리 자동 인덱스 HTML
  const html = await fetchText(base);
  if (html) {
    const urls = parseHtmlImages(html, base);
    if (urls.length) return Array.from(new Set(urls));
  }

  return [];
}

/**
 * 이미지 폴더에서 이미지 URL 목록을 반환한다.
 * - 외부 http(s) 폴더 URL → 그 폴더의 이미지 목록 (예: https://image.cattery.co.kr/dogboho)
 * - Supabase public URL / 폴더명 → Supabase Storage 버킷 조회
 */
export async function listFolderImages(folder: string | null | undefined): Promise<string[]> {
  const raw = (folder || "").trim();
  if (!raw) return [];

  // 외부 폴더 URL (Supabase 스토리지 URL이 아닌 일반 http URL)
  if (/^https?:\/\//i.test(raw) && !isSupabasePublicUrl(raw)) {
    return listExternalFolderImages(raw);
  }

  const { bucket, prefix } = parseFolderInput(raw);
  const supabase = getSupabaseService() || getSupabaseServer();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.storage.from(bucket).list(prefix || undefined, {
      limit: 300,
      sortBy: { column: "name", order: "asc" },
    });
    if (error || !data) return [];
    const urls: string[] = [];
    for (const item of data) {
      if (!item.name || !IMG_RE.test(item.name)) continue;
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      const pub = supabase.storage.from(bucket).getPublicUrl(path);
      if (pub.data.publicUrl) urls.push(pub.data.publicUrl);
    }
    return urls;
  } catch {
    return [];
  }
}

type Layout = "single" | "left" | "right" | "row2" | "row3" | "hero3" | "hero4";

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 120);
}

function imgTag(url: string, alt: string): string {
  const safe = url.replace(/"/g, "&quot;");
  return `<img src="${safe}" alt="${escapeAttr(alt)}" loading="lazy" />`;
}

function groupHtml(layout: Layout, imgs: string[], alt: string): string {
  switch (layout) {
    case "single":
      return `<figure class="seo-fig">${imgTag(imgs[0], alt)}</figure>`;
    case "row2":
      return `<div class="seo-grid cols-2">${imgs
        .map((u) => `<figure>${imgTag(u, alt)}</figure>`)
        .join("")}</div>`;
    case "row3":
      return `<div class="seo-grid cols-3">${imgs
        .map((u) => `<figure>${imgTag(u, alt)}</figure>`)
        .join("")}</div>`;
    case "hero3":
    case "hero4": {
      const [big, ...rest] = imgs;
      const n = rest.length === 3 ? "n3" : "n2";
      return `<div class="seo-hero"><figure class="seo-hero-big">${imgTag(
        big,
        alt
      )}</figure><div class="seo-hero-row ${n}">${rest
        .map((u) => `<figure>${imgTag(u, alt)}</figure>`)
        .join("")}</div></div>`;
    }
    default:
      return `<figure class="seo-fig">${imgTag(imgs[0], alt)}</figure>`;
  }
}

function sideHtml(
  url: string,
  paragraphHtml: string,
  side: "left" | "right",
  alt: string
): string {
  return `<div class="seo-side ${side}"><figure class="seo-side-img">${imgTag(
    url,
    alt
  )}</figure><div class="seo-side-text">${paragraphHtml}</div></div>`;
}

/** 블록(h2/h3/p/ul) 단위로 분리 */
function tokenize(html: string): string[] {
  const blocks: string[] = [];
  const re = /<(h2|h3|p|ul)\b[^>]*>[\s\S]*?<\/\1>/gi;
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = re.exec(html))) {
    if (m.index > last) {
      const gap = html.slice(last, m.index).trim();
      if (gap) blocks.push(gap);
    }
    blocks.push(m[0]);
    last = re.lastIndex;
  }
  const tail = html.slice(last).trim();
  if (tail) blocks.push(tail);
  return blocks;
}

const isPara = (b: string) => /^<p\b/i.test(b);

/**
 * 생성된 본문 HTML에 이미지를 삽입한다.
 * - 모든 문단(<p>)에 최소 1장 이상의 이미지를 배치한다.
 * - 이미지가 문단 수보다 많으면 일부 문단은 2~4장(한 줄 2·3장, 큰 사진+작은 사진)으로 묶는다.
 * - 단독 1장은 전체폭/좌/우(글 옆 배치) 중 랜덤.
 * - seed(키워드)를 이미지 alt에 사용한다.
 * - 반환: 삽입된 HTML과 대표(OG) 이미지 URL
 */
export function injectImages(
  html: string,
  pool: string[],
  seed: string
): { html: string; ogImage: string | null } {
  if (!pool.length) return { html, ogImage: null };

  const alt = (seed || "반려동물").trim().slice(0, 80) || "반려동물";
  const rng = makeRng(`${seed}-layout`);
  const shuffled = shuffle(pool, rng);
  const avail = shuffled.length;

  const blocks = tokenize(html);
  const P = blocks.filter(isPara).length;

  if (P === 0) {
    const imgs = shuffled.slice(0, Math.min(3, avail));
    const layout: Layout = imgs.length >= 3 ? "row3" : imgs.length === 2 ? "row2" : "single";
    return { html: `${groupHtml(layout, imgs, alt)}\n${html}`, ogImage: shuffled[0] ?? null };
  }

  // 문단별 이미지 장수: 기본 1장씩(이미지 부족 시 앞 문단부터) + 남는 이미지 일부 분배
  const counts = new Array<number>(P).fill(0);
  let used = 0;
  for (let i = 0; i < P && used < avail; i++) {
    counts[i] = 1;
    used += 1;
  }
  const maxTotal = Math.min(avail, P + 6, 16);
  let extra = Math.max(0, maxTotal - used);
  while (extra > 0) {
    let idx = Math.floor(rng() * P);
    let tries = 0;
    while (counts[idx] >= 4 && tries < P) {
      idx = (idx + 1) % P;
      tries += 1;
    }
    if (counts[idx] >= 4) break;
    counts[idx] += 1;
    used += 1;
    extra -= 1;
  }

  let cursor = 0;
  const groupFor = (n: number): { layout: Layout; imgs: string[] } => {
    const imgs = shuffled.slice(cursor, cursor + n);
    cursor += n;
    let layout: Layout;
    if (n <= 1) layout = (["single", "left", "right"] as Layout[])[Math.floor(rng() * 3)];
    else if (n === 2) layout = "row2";
    else if (n === 3) layout = rng() < 0.5 ? "row3" : "hero3";
    else layout = "hero4";
    return { layout, imgs };
  };

  const out: string[] = [];
  let p = 0;
  for (const b of blocks) {
    if (isPara(b)) {
      const c = counts[p];
      p += 1;
      if (c <= 0) {
        out.push(b);
        continue;
      }
      const g = groupFor(c);
      if (c === 1 && (g.layout === "left" || g.layout === "right")) {
        out.push(sideHtml(g.imgs[0], b, g.layout, alt));
      } else {
        out.push(b);
        out.push(groupHtml(g.layout, g.imgs, alt));
      }
      continue;
    }
    out.push(b);
  }

  return { html: out.join("\n"), ogImage: shuffled[0] ?? null };
}
