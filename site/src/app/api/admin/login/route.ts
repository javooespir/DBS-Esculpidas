import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyPassword, makeSessionToken, ADMIN_COOKIE, ADMIN_COOKIE_OPTIONS } from "@/lib/auth";

// pequeño rate limit en memoria (best-effort, se reinicia en serverless)
const attempts = new Map<string, { count: number; until: number }>();
const MAX = 5;
const WINDOW_MS = 5 * 60 * 1000;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const now = Date.now();
  const rec = attempts.get(ip);
  if (rec && rec.until > now && rec.count >= MAX) {
    return NextResponse.json({ error: "Demasiados intentos. Esperá 5 minutos." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const password = String(body.password ?? "");

  if (!verifyPassword(password)) {
    const r = rec && rec.until > now ? rec : { count: 0, until: now + WINDOW_MS };
    r.count += 1;
    attempts.set(ip, r);
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  attempts.delete(ip);
  const token = await makeSessionToken();
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, ADMIN_COOKIE_OPTIONS);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  return NextResponse.json({ ok: true });
}
