import {
  PUBLIC_DATA_BASE,
  type PublicDataEndpoint,
} from "@/lib/public-data/endpoints";

export class PublicDataApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public body?: string
  ) {
    super(message);
    this.name = "PublicDataApiError";
  }
}

function getServiceKey(): string {
  const key =
    process.env.PUBLIC_DATA_API_KEY ||
    process.env.DATA_GO_KR_API_KEY ||
    "";
  if (!key) {
    throw new PublicDataApiError(
      "PUBLIC_DATA_API_KEY 환경변수가 없습니다. 공공데이터포털에서 발급하세요."
    );
  }
  return key;
}

/** data.go.kr 키가 이미 인코딩된 경우와 아닌 경우 모두 대응 */
function encodeServiceKey(key: string): string {
  if (/%[0-9A-Fa-f]{2}/.test(key)) return key;
  return encodeURIComponent(key);
}

export interface PublicDataPageResult {
  rows: Record<string, unknown>[];
  totalCount: number;
  pageNo: number;
  numOfRows: number;
}

export async function fetchPublicDataPage(
  endpoint: PublicDataEndpoint,
  pageNo: number,
  numOfRows = 1000
): Promise<PublicDataPageResult> {
  const serviceKey = encodeServiceKey(getServiceKey());
  const qs = [
    `serviceKey=${serviceKey}`,
    `pageNo=${pageNo}`,
    `numOfRows=${numOfRows}`,
    `returnType=json`,
  ].join("&");
  const requestUrl = `${PUBLIC_DATA_BASE}${endpoint.path}?${qs}`;

  const res = await fetch(requestUrl, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    throw new PublicDataApiError(
      `공공데이터 API HTTP ${res.status}`,
      res.status,
      text.slice(0, 500)
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new PublicDataApiError(
      "공공데이터 API 응답이 JSON이 아닙니다.",
      res.status,
      text.slice(0, 500)
    );
  }

  return normalizeResponse(json, pageNo, numOfRows);
}

function normalizeResponse(
  json: unknown,
  pageNo: number,
  numOfRows: number
): PublicDataPageResult {
  const root = json as Record<string, unknown>;

  const resultCode =
    deepGet(root, ["response", "header", "resultCode"]) ??
    deepGet(root, ["header", "resultCode"]) ??
    deepGet(root, ["resultCode"]);
  const resultMsg =
    deepGet(root, ["response", "header", "resultMsg"]) ??
    deepGet(root, ["header", "resultMsg"]) ??
    "";
  if (resultCode && String(resultCode) !== "00" && String(resultCode) !== "0") {
    throw new PublicDataApiError(
      `공공데이터 API 오류: ${resultCode} ${resultMsg}`,
      undefined,
      JSON.stringify(root).slice(0, 500)
    );
  }

  const body =
    (deepGet(root, ["response", "body"]) as Record<string, unknown> | undefined) ??
    (deepGet(root, ["body"]) as Record<string, unknown> | undefined) ??
    root;

  const totalCount = Number(
    deepGet(body, ["totalCount"]) ?? deepGet(body, ["total_count"]) ?? 0
  );

  const itemsRaw =
    deepGet(body, ["items", "item"]) ??
    deepGet(body, ["items"]) ??
    deepGet(body, ["item"]) ??
    deepGet(root, ["data"]) ??
    [];

  const rows = Array.isArray(itemsRaw)
    ? (itemsRaw as Record<string, unknown>[])
    : itemsRaw && typeof itemsRaw === "object"
      ? [itemsRaw as Record<string, unknown>]
      : [];

  return { rows, totalCount, pageNo, numOfRows };
}

function deepGet(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}
