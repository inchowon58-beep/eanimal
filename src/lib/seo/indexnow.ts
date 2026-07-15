import { SITE } from "@/lib/site";

const NAVER_ENDPOINT = "https://searchadvisor.naver.com/indexnow";
const MAX_URLS_PER_REQUEST = 10000;

/**
 * IndexNow 소유확인 키.
 * public/<KEY>.txt 파일이 사이트 루트에 함께 배포되므로 기본값만으로 동작한다.
 * (INDEXNOW_KEY 환경변수로 교체 시, 반드시 동일한 이름의 키 파일도 루트에 올려야 함)
 */
const DEFAULT_KEY = "2b7f1e9a4c8d40e3a1f65b0c9d2e7a83";

export interface IndexNowResult {
  ok: boolean;
  submitted: number;
  status?: number;
  skipped?: string;
}

function toAbsolute(base: string, url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * 네이버 IndexNow 로 URL 갱신을 통보한다. (한 요청 최대 10,000개)
 * 로컬/미설정 도메인에서는 조용히 skip 하여 배포에 영향을 주지 않는다.
 */
export async function submitToIndexNow(urls: string[]): Promise<IndexNowResult> {
  const key = process.env.INDEXNOW_KEY || DEFAULT_KEY;

  const base = SITE.url.replace(/\/$/, "");
  let host: string;
  try {
    host = new URL(base).host;
  } catch {
    return { ok: false, submitted: 0, skipped: "SITE.url 이 올바르지 않음" };
  }
  if (!host || host.includes("localhost")) {
    return { ok: false, submitted: 0, skipped: "운영 도메인이 아님" };
  }

  const urlList = Array.from(
    new Set(urls.map((u) => toAbsolute(base, u)).filter(Boolean))
  ).slice(0, MAX_URLS_PER_REQUEST);
  if (!urlList.length) return { ok: true, submitted: 0 };

  const body = {
    host,
    key,
    keyLocation: `${base}/${key}.txt`,
    urlList,
  };

  try {
    const res = await fetch(NAVER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    return { ok: res.ok, submitted: urlList.length, status: res.status };
  } catch (e) {
    return {
      ok: false,
      submitted: 0,
      skipped: e instanceof Error ? e.message : String(e),
    };
  }
}
