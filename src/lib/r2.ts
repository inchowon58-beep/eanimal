import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const PREFIX = process.env.R2_PREFIX || "123demolition";
const R2_HOST_PATTERN = /([a-f0-9]{32})\.r2\.cloudflarestorage\.com/i;

function trimEnv(value: string | undefined): string {
  return value?.trim() ?? "";
}

function resolveEndpoint(): string {
  const raw =
    trimEnv(process.env.R2_ENDPOINT) || trimEnv(process.env.R2_ACCOUNT_ID);

  if (!raw) return "";

  let value = raw.replace(/^r2_endpoint\s*=\s*/i, "");

  const hostMatch = value.match(R2_HOST_PATTERN);
  if (hostMatch) {
    return `https://${hostMatch[1].toLowerCase()}.r2.cloudflarestorage.com`;
  }

  const accountOnly = value.match(/^([a-f0-9]{32})$/i);
  if (accountOnly) {
    return `https://${accountOnly[1].toLowerCase()}.r2.cloudflarestorage.com`;
  }

  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    value = `https://${value}`;
  }

  try {
    const url = new URL(value);
    const bucket = trimEnv(process.env.R2_BUCKET_NAME);
    if (bucket && url.hostname.startsWith(`${bucket}.`)) {
      url.hostname = url.hostname.slice(bucket.length + 1);
    }
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length > 0 && segments[segments.length - 1] === bucket) {
      segments.pop();
      url.pathname = segments.length ? `/${segments.join("/")}` : "";
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return value.replace(/\/$/, "");
  }
}

export function isR2Configured(): boolean {
  return !!(
    resolveEndpoint() &&
    trimEnv(process.env.R2_ACCESS_KEY_ID) &&
    trimEnv(process.env.R2_SECRET_ACCESS_KEY) &&
    trimEnv(process.env.R2_BUCKET_NAME) &&
    trimEnv(process.env.R2_PUBLIC_URL)
  );
}

function getClient(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: resolveEndpoint(),
    credentials: {
      accessKeyId: trimEnv(process.env.R2_ACCESS_KEY_ID),
      secretAccessKey: trimEnv(process.env.R2_SECRET_ACCESS_KEY),
    },
  });
}

export function r2Key(...parts: string[]): string {
  return [PREFIX, ...parts].filter(Boolean).join("/");
}

export async function readR2Text(key: string): Promise<string | null> {
  try {
    const res = await getClient().send(
      new GetObjectCommand({
        Bucket: trimEnv(process.env.R2_BUCKET_NAME),
        Key: key,
      })
    );
    return (await res.Body?.transformToString()) ?? null;
  } catch {
    return null;
  }
}

export async function writeR2Text(key: string, content: string): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: trimEnv(process.env.R2_BUCKET_NAME),
      Key: key,
      Body: Buffer.from(content, "utf-8"),
      ContentType: "application/json",
    })
  );
}
