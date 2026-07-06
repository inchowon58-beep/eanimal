import {
  BlobAccessError,
  BlobError,
  BlobNotFoundError,
  get,
  put,
} from "@vercel/blob";

const PREFIX = process.env.BLOB_PREFIX || "1977demol";

type BlobAccess = "private" | "public";

const ACCESS_MODES: BlobAccess[] =
  process.env.BLOB_ACCESS === "public"
    ? ["public"]
    : process.env.BLOB_ACCESS === "private"
      ? ["private"]
      : ["private", "public"];

/** Vercel OIDC(BLOB_STORE_ID) 또는 구형 BLOB_READ_WRITE_TOKEN */
export function isBlobConfigured(): boolean {
  return !!(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
    process.env.BLOB_STORE_ID?.trim()
  );
}

function blobPath(filename: string): string {
  return `${PREFIX}/data/${filename}`;
}

function putOptions(access: BlobAccess) {
  return {
    access,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  } as const;
}

export async function readBlobText(filename: string): Promise<string | null> {
  if (!isBlobConfigured()) return null;

  const pathname = blobPath(filename);

  for (const access of ACCESS_MODES) {
    try {
      const result = await get(pathname, { access });
      if (result && result.statusCode === 200 && result.stream) {
        return await new Response(result.stream).text();
      }
    } catch (error) {
      if (error instanceof BlobNotFoundError) return null;
      if (error instanceof BlobAccessError) continue;
      throw error;
    }
  }

  return null;
}

export async function writeBlobText(filename: string, content: string): Promise<void> {
  if (!isBlobConfigured()) {
    throw new Error("BLOB_NOT_CONFIGURED");
  }

  const pathname = blobPath(filename);
  let lastError: unknown;

  for (const access of ACCESS_MODES) {
    try {
      await put(pathname, content, putOptions(access));
      return;
    } catch (error) {
      lastError = error;
      if (error instanceof BlobAccessError) continue;
      break;
    }
  }

  if (lastError instanceof BlobError) {
    const message = lastError.message;
    if (message.includes("OIDC is enabled") && message.includes("environment")) {
      throw new Error(
        "Blob OIDC가 이 배포 환경(Production/Preview)에 연결되지 않았습니다. Vercel → Storage → Blob → Projects에서 해당 환경을 체크하세요."
      );
    }
    throw new Error(`Blob 저장 실패: ${message}`);
  }

  throw lastError instanceof Error ? lastError : new Error("Blob 저장 실패");
}
