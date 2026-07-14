import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { ADMIN_PASSWORD, ADMIN_USER } from "@/lib/site";

const COOKIE = "eanimal_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7d

function secret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.CRON_SECRET ||
    "eanimal-admin-dev-secret"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function verifyCredentials(user: string, password: string): boolean {
  const uOk = user === ADMIN_USER;
  const pOk = password === ADMIN_PASSWORD;
  return uOk && pOk;
}

export function createSessionToken(): string {
  const exp = Date.now() + MAX_AGE * 1000;
  const body = `admin:${exp}`;
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  const expected = sign(body);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  const exp = Number(body.split(":")[1]);
  return Number.isFinite(exp) && Date.now() < exp;
}

export async function isAdminLoggedIn(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(COOKIE)?.value);
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  };
}

export function clearSessionCookieOptions() {
  return {
    name: COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}
