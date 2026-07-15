/**
 * VM 워커 인증 — 기존 폼스키 VM 토큰과 호환.
 * Authorization: Bearer <CRON_SECRET | SYNC_SECRET | COLLECTION_WORKER_SECRET>
 * 또는 ?secret=
 */
export function verifyWorkerRequest(req: Request): boolean {
  const secrets = [
    process.env.CRON_SECRET,
    process.env.SYNC_SECRET,
    process.env.COLLECTION_WORKER_SECRET,
  ].filter((s): s is string => Boolean(s && s.trim()));

  if (secrets.length === 0) {
    return (
      process.env.NODE_ENV === "development" && process.env.ALLOW_DEV_SYNC === "1"
    );
  }

  const auth = req.headers.get("authorization");
  const querySecret = new URL(req.url).searchParams.get("secret");
  return secrets.some(
    (secret) => auth === `Bearer ${secret}` || querySecret === secret
  );
}
