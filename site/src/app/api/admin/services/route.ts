import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionFromCookies } from "@/lib/auth";

export const dynamic = "force-dynamic";

const guard = async () => {
  const ok = await getSessionFromCookies();
  return ok ? null : NextResponse.json({ error: "No autorizado" }, { status: 401 });
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export async function POST(req: Request) {
  const blocked = await guard();
  if (blocked) return blocked;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim().slice(0, 100);
  const description = body.description ? String(body.description).slice(0, 500) : null;
  const price_ars = Math.max(0, Math.floor(Number(body.price_ars ?? 0)));
  const duration_minutes = Math.max(15, Math.floor(Number(body.duration_minutes ?? 60)));
  const deposit_ars = Math.max(0, Math.floor(Number(body.deposit_ars ?? 10000)));
  if (!name) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const baseSlug = slugify(name) || `serv-${Date.now()}`;
  let slug = baseSlug;
  // Si ya existe, agregar sufijo numérico
  for (let i = 2; i < 100; i++) {
    const { data: existing } = await supabaseAdmin.from("services").select("id").eq("slug", slug).maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${i}`;
  }

  const { data: maxOrder } = await supabaseAdmin
    .from("services")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabaseAdmin.from("services").insert({
    slug,
    name,
    description,
    price_ars,
    duration_minutes,
    deposit_ars,
    display_order: (maxOrder?.display_order ?? 0) + 1,
    active: true,
  });
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

export async function DELETE(req: Request) {
  const blocked = await guard();
  if (blocked) return blocked;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  // Soft delete: marcar inactivo (no romper turnos históricos que referencian este servicio)
  const { error } = await supabaseAdmin.from("services").update({ active: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
