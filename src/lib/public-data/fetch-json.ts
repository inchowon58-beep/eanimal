import { PublicDataApiError } from "@/lib/public-data/client";

export function getEncodedServiceKey(): string {
  const key =
    process.env.PUBLIC_DATA_API_KEY || process.env.DATA_GO_KR_API_KEY || "";
  if (!key) {
    throw new PublicDataApiError("PUBLIC_DATA_API_KEY 환경변수가 없습니다.");
  }
  return /%[0-9A-Fa-f]{2}/.test(key) ? key : encodeURIComponent(key);
}

export function deepGet(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

export function extractItemRows(json: unknown): {
  rows: Record<string, unknown>[];
  totalCount: number;
} {
  const root = json as Record<string, unknown>;
  const resultCode =
    deepGet(root, ["response", "header", "resultCode"]) ??
    deepGet(root, ["header", "resultCode"]);
  const resultMsg =
    deepGet(root, ["response", "header", "resultMsg"]) ??
    deepGet(root, ["header", "resultMsg"]) ??
    "";

  if (
    resultCode &&
    String(resultCode) !== "00" &&
    String(resultCode) !== "0" &&
    String(resultCode) !== "0000"
  ) {
    throw new PublicDataApiError(
      `공공데이터 API 오류: ${resultCode} ${resultMsg}`,
      undefined,
      JSON.stringify(root).slice(0, 500)
    );
  }

  const body =
    (deepGet(root, ["response", "body"]) as Record<string, unknown>) ||
    (deepGet(root, ["body"]) as Record<string, unknown>) ||
    root;

  const totalCount = Number(
    deepGet(body, ["totalCount"]) ?? deepGet(body, ["total_count"]) ?? 0
  );

  const itemsRaw =
    deepGet(body, ["items", "item"]) ??
    deepGet(body, ["items"]) ??
    deepGet(body, ["item"]) ??
    [];

  const rows = Array.isArray(itemsRaw)
    ? (itemsRaw as Record<string, unknown>[])
    : itemsRaw && typeof itemsRaw === "object"
      ? [itemsRaw as Record<string, unknown>]
      : [];

  return { rows, totalCount };
}

export async function fetchDataGoKrJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    const preview = text.replace(/\s+/g, " ").slice(0, 180);
    throw new PublicDataApiError(
      `HTTP ${res.status}${preview ? `: ${preview}` : ""}`,
      res.status,
      text.slice(0, 500)
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new PublicDataApiError("JSON 파싱 실패", res.status, text.slice(0, 500));
  }
}

export function pickStr(
  row: Record<string, unknown>,
  keys: string[]
): string | null {
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
