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
  const client_name = String(body.client_name ?? "").slice(0, 80);
  const text = String(body.text ?? "").slice(0, 500);
  const rating = Math.min(5, Math.max(1, Number(body.rating ?? 5)));
  if (!client_name || !text) return NextResponse.json({ error: "Datos requeridos" }, { status: 400 });
  const { error } = await supabaseAdmin.from("testimonials").insert({ client_name, text, rating });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const blocked = await guard();
  if (blocked) return blocked;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  if (typeof body.visible === "boolean") update.visible = body.visible;
  if (typeof body.client_name === "string") update.client_name = body.client_name.slice(0, 80);
  if (typeof body.text === "string") update.text = body.text.slice(0, 500);
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  const { error } = await supabaseAdmin.from("testimonials").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const blocked = await guard();
  if (blocked) return blocked;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  const { error } = await supabaseAdmin.from("testimonials").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
