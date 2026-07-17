import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";

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

type Layout = "single" | "left" | "right" | "row2";

const MIN_IMAGES = 5;
const MAX_IMAGES = 7;

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 120);
}

/** 키워드 기반 alt 변형 — 동일 문구 반복 최소화 */
function altVariants(seed: string): string[] {
  const k = (seed || "반려동물").trim().slice(0, 60) || "반려동물";
  return [
    k,
    `${k} 안내`,
    `${k} 정보`,
    `${k} 관련 사진`,
    `${k} 살펴보기`,
    `${SITE.name} ${k}`.trim(),
    `${k} 확인 포인트`,
  ];
}
function imgTag(
  url: string,
  alt: string,
  opts?: { eager?: boolean; index?: number }
): string {
  const safe = url.replace(/"/g, "&quot;");
  const a = escapeAttr(alt);
  const eager = Boolean(opts?.eager);
  const loading = eager ? "eager" : "lazy";
  const fetchPriority = eager ? ' fetchpriority="high"' : "";
  const widthHint = ' width="1200" height="800"';
  return `<img src="${safe}" alt="${a}" title="${a}" loading="${loading}" decoding="async"${fetchPriority}${widthHint} />`;
}

function groupHtml(
  layout: Layout,
  imgs: string[],
  alts: string[],
  eagerFirst: boolean
): string {
  switch (layout) {
    case "row2":
      return `<div class="seo-grid cols-2">${imgs
        .map((u, i) => `<figure>${imgTag(u, alts[i] || alts[0], { eager: eagerFirst && i === 0 })}</figure>`)
        .join("")}</div>`;
    case "single":
    default:
      return `<figure class="seo-fig">${imgTag(imgs[0], alts[0], { eager: eagerFirst })}</figure>`;
  }
}

function sideHtml(
  url: string,
  paragraphHtml: string,
  side: "left" | "right",
  alt: string,
  eager: boolean
): string {
  return `<div class="seo-side ${side}"><figure class="seo-side-img">${imgTag(
    url,
    alt,
    { eager }
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
 * 생성된 본문 HTML에 이미지를 5~7장만 삽입한다.
 * - 키워드 기반 alt/title, 첫 장은 eager(LCP), 나머지는 lazy
 * - 문단 사이·좌우 배치로 자연스럽게 분산 (문단마다 도배하지 않음)
 * - 반환 ogImage: 본문 대표 이미지(없으면 null → 페이지 메타에서 로고 폴백)
 */
export function injectImages(
  html: string,
  pool: string[],
  seed: string
): { html: string; ogImage: string | null } {
  if (!pool.length) return { html, ogImage: null };

  const rng = makeRng(`${seed}-layout`);
  const shuffled = shuffle(pool, rng);
  const want =
    shuffled.length <= MIN_IMAGES
      ? shuffled.length
      : MIN_IMAGES + Math.floor(rng() * (MAX_IMAGES - MIN_IMAGES + 1));
  const selected = shuffled.slice(0, Math.min(want, MAX_IMAGES, shuffled.length));
  if (!selected.length) return { html, ogImage: null };

  const variants = altVariants(seed);
  const alts = selected.map((_, i) => variants[i % variants.length]);

  const blocks = tokenize(html);
  const paraIdxs: number[] = [];
  blocks.forEach((b, i) => {
    if (isPara(b)) paraIdxs.push(i);
  });

  // 배치 계획: 남은 장수로 싱글/2열을 섞어 문단에 붙임
  type Plan = { blockIndex: number; layout: Layout; urls: string[]; alts: string[] };
  const plans: Plan[] = [];
  let imgCursor = 0;
  const remaining = () => selected.length - imgCursor;

  const pickParaSlots = (need: number): number[] => {
    if (!paraIdxs.length) return [];
    const slots: number[] = [];
    const step = Math.max(1, Math.floor(paraIdxs.length / need));
    let start = Math.min(1, paraIdxs.length - 1); // 첫 문단 직후부터 선호
    for (let n = 0; n < need && slots.length < need; n++) {
      const idx = paraIdxs[Math.min(start + n * step, paraIdxs.length - 1)];
      if (!slots.includes(idx)) slots.push(idx);
    }
    // 부족하면 앞에서부터 채움
    for (const idx of paraIdxs) {
      if (slots.length >= need) break;
      if (!slots.includes(idx)) slots.push(idx);
    }
    return slots.slice(0, need);
  };

  // 대략 배치 횟수 추정 (2열은 2장 소모)
  const approxPlacements = Math.max(
    1,
    Math.ceil(selected.length * (0.65 + rng() * 0.2))
  );
  const slots = pickParaSlots(Math.min(approxPlacements, Math.max(paraIdxs.length, 1)));

  if (!slots.length) {
    // 문단 없으면 상단에 묶어서 배치
    while (remaining() > 0) {
      const n = remaining() >= 2 && rng() < 0.35 ? 2 : 1;
      const urls = selected.slice(imgCursor, imgCursor + n);
      const a = alts.slice(imgCursor, imgCursor + n);
      imgCursor += n;
      const layout: Layout = n === 2 ? "row2" : "single";
      plans.push({ blockIndex: -1, layout, urls, alts: a });
    }
    const prepend = plans
      .map((p, i) =>
        groupHtml(p.layout, p.urls, p.alts, i === 0)
      )
      .join("\n");
    return { html: `${prepend}\n${html}`, ogImage: selected[0] };
  }

  let slotPos = 0;
  let firstPlaced = false;
  while (remaining() > 0 && slotPos < slots.length) {
    const left = remaining();
    const canPair =
      left >= 2 &&
      slotPos < slots.length - 1 &&
      rng() < 0.4;
    const n = canPair ? 2 : 1;
    const urls = selected.slice(imgCursor, imgCursor + n);
    const a = alts.slice(imgCursor, imgCursor + n);
    imgCursor += n;

    let layout: Layout;
    if (n === 2) layout = "row2";
    else layout = (["single", "left", "right"] as Layout[])[Math.floor(rng() * 3)];

    plans.push({
      blockIndex: slots[slotPos],
      layout,
      urls,
      alts: a,
    });
    slotPos += 1;
    firstPlaced = true;
  }

  // 남은 이미지(슬롯 부족)는 마지막 문단 뒤에 싱글/row2로
  while (remaining() > 0) {
    const n = remaining() >= 2 && rng() < 0.5 ? 2 : 1;
    const urls = selected.slice(imgCursor, imgCursor + n);
    const a = alts.slice(imgCursor, imgCursor + n);
    imgCursor += n;
    const lastPara = paraIdxs[paraIdxs.length - 1] ?? blocks.length - 1;
    plans.push({
      blockIndex: lastPara,
      layout: n === 2 ? "row2" : "single",
      urls,
      alts: a,
    });
  }

  const byBlock = new Map<number, Plan[]>();
  for (const p of plans) {
    const list = byBlock.get(p.blockIndex) || [];
    list.push(p);
    byBlock.set(p.blockIndex, list);
  }

  let eagerUsed = false;
  const out: string[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const plansHere = byBlock.get(i) || [];
    if (!plansHere.length) {
      out.push(b);
      continue;
    }

    // side 레이아웃은 문단과 합침 (첫 plan만 side 가능)
    let paraEmitted = false;
    for (const plan of plansHere) {
      const eager = !eagerUsed;
      if (
        plan.layout === "left" ||
        plan.layout === "right"
      ) {
        if (!paraEmitted && isPara(b)) {
          out.push(
            sideHtml(plan.urls[0], b, plan.layout, plan.alts[0], eager)
          );
          paraEmitted = true;
          eagerUsed = true;
        } else {
          out.push(groupHtml("single", plan.urls, plan.alts, eager));
          eagerUsed = true;
        }
      } else {
        if (!paraEmitted) {
          out.push(b);
          paraEmitted = true;
        }
        out.push(groupHtml(plan.layout, plan.urls, plan.alts, eager));
        eagerUsed = true;
      }
    }
    if (!paraEmitted) out.push(b);
  }

  // prepend plans with blockIndex -1
  const prependPlans = byBlock.get(-1) || [];
  if (prependPlans.length) {
    const head = prependPlans
      .map((p) => {
        const eager = !eagerUsed;
        eagerUsed = true;
        return groupHtml(p.layout === "left" || p.layout === "right" ? "single" : p.layout, p.urls, p.alts, eager);
      })
      .join("\n");
    return { html: `${head}\n${out.join("\n")}`, ogImage: selected[0] };
  }

  void firstPlaced;
  return { html: out.join("\n"), ogImage: selected[0] };
}
