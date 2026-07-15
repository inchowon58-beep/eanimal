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
 * 외부 사이트 폴더 URL에서 이미지 목록을 읽는다.
 * 우선순위: index.json(문자열 배열) → list.txt(줄바꿈) → 디렉터리 자동 인덱스 HTML 파싱
 * 예) https://image.cattery.co.kr/dogboho
 */
export async function listExternalFolderImages(folderUrl: string): Promise<string[]> {
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

/** 폴더 이미지 중 7~12장(가용 범위 내)을 시드 기반으로 선택 */
export function pickImages(all: string[], seed: string): string[] {
  if (all.length === 0) return [];
  const rng = makeRng(`${seed}-pick`);
  const shuffled = shuffle(all, rng);
  const min = Math.min(7, shuffled.length);
  const max = Math.min(12, shuffled.length);
  const count = min + Math.floor(rng() * (max - min + 1));
  return shuffled.slice(0, count);
}

type Layout = "single" | "left" | "right" | "row2" | "row3" | "hero3" | "hero4";

function imgTag(url: string): string {
  const safe = url.replace(/"/g, "&quot;");
  return `<img src="${safe}" alt="" loading="lazy" />`;
}

function groupHtml(layout: Layout, imgs: string[]): string {
  switch (layout) {
    case "single":
      return `<figure class="seo-fig">${imgTag(imgs[0])}</figure>`;
    case "row2":
      return `<div class="seo-grid cols-2">${imgs
        .map((u) => `<figure>${imgTag(u)}</figure>`)
        .join("")}</div>`;
    case "row3":
      return `<div class="seo-grid cols-3">${imgs
        .map((u) => `<figure>${imgTag(u)}</figure>`)
        .join("")}</div>`;
    case "hero3":
    case "hero4": {
      const [big, ...rest] = imgs;
      const n = rest.length === 3 ? "n3" : "n2";
      return `<div class="seo-hero"><figure class="seo-hero-big">${imgTag(
        big
      )}</figure><div class="seo-hero-row ${n}">${rest
        .map((u) => `<figure>${imgTag(u)}</figure>`)
        .join("")}</div></div>`;
    }
    default:
      return `<figure class="seo-fig">${imgTag(imgs[0])}</figure>`;
  }
}

function sideHtml(url: string, paragraphHtml: string, side: "left" | "right"): string {
  return `<div class="seo-side ${side}"><figure class="seo-side-img">${imgTag(
    url
  )}</figure><div class="seo-side-text">${paragraphHtml}</div></div>`;
}

interface Group {
  layout: Layout;
  imgs: string[];
}

/** 이미지를 1~4장 단위 그룹으로 분할하고 레이아웃을 무작위 배정 */
function buildGroups(images: string[], rng: () => number): Group[] {
  const groups: Group[] = [];
  let i = 0;
  const n = images.length;
  while (i < n) {
    const remain = n - i;
    // 그룹 크기 후보 (남은 수에 맞춤)
    let size: number;
    const r = rng();
    if (remain >= 4 && r < 0.22) size = 4;
    else if (remain >= 3 && r < 0.5) size = 3;
    else if (remain >= 2 && r < 0.8) size = 2;
    else size = 1;
    const imgs = images.slice(i, i + size);
    i += size;

    let layout: Layout;
    if (size === 1) layout = (["single", "left", "right"] as Layout[])[Math.floor(rng() * 3)];
    else if (size === 2) layout = "row2";
    else if (size === 3) layout = rng() < 0.5 ? "row3" : "hero3";
    else layout = "hero4";
    groups.push({ layout, imgs });
  }
  return groups;
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
 * 생성된 본문 HTML에 이미지를 무작위 레이아웃으로 삽입한다.
 * - 한 줄 1/2/3장, 크게 1장+아래 작게 2~3장, 좌/우 이미지+글 등 랜덤
 * - 좌/우 배치는 인접 문단을 이미지 옆에 배치
 */
export function injectImages(html: string, images: string[], seed: string): string {
  if (!images.length) return html;
  const rng = makeRng(`${seed}-layout`);
  const groups = buildGroups(images, rng);
  const blocks = tokenize(html);
  const totalP = blocks.filter(isPara).length;
  const cadence = Math.max(1, Math.floor(totalP / (groups.length + 1)));

  const out: string[] = [];
  let pcount = 0;
  let gi = 0;

  for (const b of blocks) {
    if (isPara(b)) {
      pcount += 1;
      const timeToInsert = gi < groups.length && pcount % cadence === 0;
      if (timeToInsert) {
        const g = groups[gi];
        if (g.layout === "left" || g.layout === "right") {
          out.push(sideHtml(g.imgs[0], b, g.layout));
          gi += 1;
          continue; // 이 문단은 이미지 옆으로 이동 (중복 출력 방지)
        }
        out.push(b);
        out.push(groupHtml(g.layout, g.imgs));
        gi += 1;
        continue;
      }
    }
    out.push(b);
  }

  // 남은 그룹은 본문 끝에 추가
  while (gi < groups.length) {
    const g = groups[gi];
    if (g.layout === "left" || g.layout === "right") {
      out.push(groupHtml("single", g.imgs));
    } else {
      out.push(groupHtml(g.layout, g.imgs));
    }
    gi += 1;
  }

  return out.join("\n");
}
