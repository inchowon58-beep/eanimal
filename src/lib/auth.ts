import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { ADMIN_PASSWORD, ADMIN_USERNAME, MASTER_PASSWORD } from "./constants";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "123-demolition-secret-key-2026"
);

const COOKIE_NAME = "demolition_admin_session";
const MASTER_COOKIE_NAME = "demolition_master_session_v2";

export async function createSession(): Promise<string> {
  return new SignJWT({ role: "admin", user: ADMIN_USERNAME })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export function validateCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySession(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function validateMasterPassword(password: string): boolean {
  return password === MASTER_PASSWORD;
}

export async function createMasterSession(): Promise<string> {
  return new SignJWT({ role: "master" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(SECRET);
}

export async function verifyMasterSession(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.role === "master";
  } catch {
    return false;
  }
}

export async function isMasterAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(MASTER_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyMasterSession(token);
}

export async function setMasterSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(MASTER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
}

export async function clearMasterSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(MASTER_COOKIE_NAME);
}

export { COOKIE_NAME, MASTER_COOKIE_NAME };
