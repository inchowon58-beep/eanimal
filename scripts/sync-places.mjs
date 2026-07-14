/**
 * 로컬/CI에서 공공데이터 → Supabase UPSERT
 * 사용: npm run sync:places
 * 옵션: MAX_PAGES=1 CATEGORY=동물병원 npm run sync:places
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// .env.local 간단 로드
for (const file of [".env.local", ".env"]) {
  const p = resolve(process.cwd(), file);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m || process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const BASE = "https://apis.data.go.kr/1741000";

const ENDPOINTS = [
  { category: "동물병원", path: "/animal_hospitals/info", prefix: "hosp" },
  { category: "동물약국", path: "/animal_pharmacies/info", prefix: "pharm" },
  { category: "동물장묘업", path: "/animal_cremation/info", prefix: "crem" },
];

function env(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} 필요`);
  return v;
}

function encodeKey(key) {
  return /%[0-9A-Fa-f]{2}/.test(key) ? key : encodeURIComponent(key);
}

function pick(row, keys) {
  const norm = new Map(
    Object.entries(row).map(([k, v]) => [k.toLowerCase().replace(/_/g, ""), v])
  );
  for (const key of keys) {
    if (row[key] != null && String(row[key]).trim()) return String(row[key]).trim();
    const v = norm.get(key.toLowerCase().replace(/_/g, ""));
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return null;
}

function parseRegion(address) {
  if (!address) return { sido: null, sigungu: null };
  const parts = address.trim().split(/\s+/);
  const sido = parts[0] || null;
  let sigungu = null;
  if (parts[1] && /(시|군|구)$/.test(parts[1])) {
    sigungu = parts[1];
    if (parts[2] && /구$/.test(parts[2]) && /시$/.test(parts[1])) {
      sigungu = `${parts[1]} ${parts[2]}`;
    }
  }
  return { sido, sigungu };
}

function mapRow(row, category, prefix) {
  const title = pick(row, ["BPLC_NM", "bplcNm"]);
  if (!title) return null;
  const mgt = pick(row, ["MGT_NO", "MGTNO", "mgtNo"]);
  const road = pick(row, ["ROAD_NM_ADDR", "rdnWhlAddr", "RDN_WHL_ADDR"]);
  const jibun = pick(row, ["LOTNO_ADDR", "siteWhlAddr", "SITE_WHL_ADDR"]);
  const region = parseRegion(road || jibun);
  return {
    local_id: `${prefix}:${mgt || `gen_${title}`}`,
    category,
    title,
    status: pick(row, ["SALS_STTS_NM", "trdStateNm", "TRD_STATE_NM"]) || "정보없음",
    address_road: road,
    address_jibun: jibun,
    phone: pick(row, ["TELNO", "siteTel", "SITE_TEL"]),
    sido: pick(row, ["CTPV_NM", "ctpvNm"]) || region.sido,
    sigungu: pick(row, ["SIGNGU_NM", "signguNm"]) || region.sigungu,
    updated_at: new Date().toISOString(),
  };
}

async function fetchPage(path, pageNo, pageSize, serviceKey) {
  const url = `${BASE}${path}?serviceKey=${encodeKey(serviceKey)}&pageNo=${pageNo}&numOfRows=${pageSize}&returnType=json`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  const json = JSON.parse(text);
  const body = json?.response?.body ?? json?.body ?? json;
  const items = body?.items?.item ?? body?.items ?? body?.item ?? [];
  const rows = Array.isArray(items) ? items : items ? [items] : [];
  return { rows, totalCount: Number(body?.totalCount || 0) };
}

async function main() {
  const serviceKey = env("PUBLIC_DATA_API_KEY");
  const supabase = createClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
  );

  const maxPages = Number(process.env.MAX_PAGES || 0) || Infinity;
  const pageSize = Math.min(Number(process.env.PAGE_SIZE || 100), 100);
  const startPage = Math.max(Number(process.env.START_PAGE || 1), 1);
  const only = process.env.CATEGORY;
  const targets = ENDPOINTS.filter((e) => !only || e.category === only);

  let upserted = 0;
  for (const ep of targets) {
    console.log(`== ${ep.category}`);
    let fetched = (startPage - 1) * pageSize;
    let pagesDone = 0;
    for (let page = startPage; pagesDone < maxPages; page++, pagesDone++) {
      const { rows, totalCount } = await fetchPage(ep.path, page, pageSize, serviceKey);
      if (!rows.length) break;
      const mapped = rows
        .map((r) => mapRow(r, ep.category, ep.prefix))
        .filter(Boolean);
      for (let i = 0; i < mapped.length; i += 200) {
        const chunk = mapped.slice(i, i + 200);
        const { error } = await supabase.from("places").upsert(chunk, {
          onConflict: "local_id",
        });
        if (error) throw error;
        upserted += chunk.length;
      }
      fetched += rows.length;
      console.log(
        `  page ${page}: +${mapped.length} (${fetched}/${totalCount || "?"})`
      );
      if (totalCount && fetched >= totalCount) break;
      if (!totalCount && rows.length < pageSize) break;
    }
  }
  console.log(`done. upserted=${upserted}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
