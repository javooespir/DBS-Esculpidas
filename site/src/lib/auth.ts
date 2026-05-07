/**
 * Auth simple para el admin.
 * Implementación 100% Web Crypto → funciona en Node y en Edge Runtime (middleware).
 *
 *  - Password en env var (ADMIN_PASSWORD)
 *  - Cookie httpOnly + sameSite strict + signed (HMAC-SHA256)
 *  - Comparación timing-safe
 */
import { cookies } from "next/headers";

const SECRET = process.env.ADMIN_SESSION_SECRET ?? "dev-only-secret";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "";
const COOKIE_NAME = "dbs_admin_session";
const SESSION_DAYS = 7;

const enc = new TextEncoder();

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const fromHex = (hex: string) => {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
};

let keyPromise: Promise<CryptoKey> | null = null;
const getKey = () => {
  if (!keyPromise) {
    keyPromise = crypto.subtle.importKey(
      "raw",
      enc.encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
  }
  return keyPromise;
};

const sign = async (payload: string): Promise<string> => {
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return toHex(sig);
};

/** Timing-safe constant-time string compare */
const safeEq = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

export function verifyPassword(input: string): boolean {
  if (!PASSWORD || !input) return false;
  return safeEq(input, PASSWORD);
}

export async function makeSessionToken(): Promise<string> {
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const payload = `${Date.now()}.${toHex(nonceBytes.buffer)}`;
  const sig = await sign(payload);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [ts, nonce, sig] = parts;
  const expected = await sign(`${ts}.${nonce}`);
  if (!safeEq(sig, expected)) return false;
  const ageMs = Date.now() - Number(ts);
  if (Number.isNaN(ageMs) || ageMs > SESSION_DAYS * 86400 * 1000) return false;
  return true;
}

/** Helper para usar en server components y API routes */
export async function getSessionFromCookies(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

export const ADMIN_COOKIE = COOKIE_NAME;
export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true as const,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_DAYS * 86400,
};
