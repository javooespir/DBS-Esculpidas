import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionFromCookies } from "@/lib/auth";

export const dynamic = "force-dynamic";

const guard = async () => {
  const ok = await getSessionFromCookies();
  return ok ? null : NextResponse.json({ error: "No autorizado" }, { status: 401 });
};

/** GET /api/admin/settings — devuelve todas las settings como { key: value } */
export async function GET() {
  const blocked = await guard();
  if (blocked) return blocked;

  const { data, error } = await supabaseAdmin.from("settings").select("key, value");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result: Record<string, unknown> = {};
  for (const row of data ?? []) {
    result[row.key] = typeof row.value === "string" ? row.value : row.value;
  }
  return NextResponse.json(result);
}

/** PATCH /api/admin/settings — upsert { key, value } */
export async function PATCH(req: Request) {
  const blocked = await guard();
  if (blocked) return blocked;

  const body = await req.json().catch(() => ({}));
  const key = String(body.key ?? "").trim();
  const value = body.value;

  if (!key) return NextResponse.json({ error: "key requerido" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
