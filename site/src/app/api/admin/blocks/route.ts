import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionFromCookies } from "@/lib/auth";

export const dynamic = "force-dynamic";

const guard = async () => {
  const ok = await getSessionFromCookies();
  return ok ? null : NextResponse.json({ error: "No autorizado" }, { status: 401 });
};

export async function POST(req: Request) {
  const blocked = await guard();
  if (blocked) return blocked;
  const body = await req.json().catch(() => ({}));
  const start_at = body.start_at ? new Date(body.start_at).toISOString() : null;
  const end_at = body.end_at ? new Date(body.end_at).toISOString() : null;
  if (!start_at || !end_at) return NextResponse.json({ error: "Fechas requeridas" }, { status: 400 });
  if (end_at <= start_at) return NextResponse.json({ error: "Fin debe ser posterior" }, { status: 400 });

  const { error } = await supabaseAdmin.from("blocked_slots").insert({
    start_at,
    end_at,
    reason: body.reason ? String(body.reason).slice(0, 200) : null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const blocked = await guard();
  if (blocked) return blocked;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  const { error } = await supabaseAdmin.from("blocked_slots").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
