import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionFromCookies } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  if (!(await getSessionFromCookies())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  if (typeof body.name === "string") update.name = body.name.slice(0, 100);
  if (typeof body.description === "string") update.description = body.description.slice(0, 500);
  if (typeof body.price_ars === "number" && body.price_ars >= 0) update.price_ars = Math.floor(body.price_ars);
  if (typeof body.duration_minutes === "number" && body.duration_minutes > 0) update.duration_minutes = Math.floor(body.duration_minutes);
  if (typeof body.deposit_ars === "number" && body.deposit_ars >= 0) update.deposit_ars = Math.floor(body.deposit_ars);
  if (typeof body.active === "boolean") update.active = body.active;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("services").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
