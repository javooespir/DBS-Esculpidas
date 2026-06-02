import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionFromCookies } from "@/lib/auth";
import { normalizeArgPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await getSessionFromCookies())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 3) {
    return NextResponse.json({ clients: [] });
  }

  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select("client_name, client_phone, client_email, created_at")
    .ilike("client_name", `%${q}%`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Deduplicate by normalized phone (keep most recent = first due to order)
  const seen = new Set<string>();
  const clients: { client_name: string; client_phone: string; client_email: string }[] = [];

  for (const row of data ?? []) {
    const normalized = normalizeArgPhone(row.client_phone ?? "");
    const key = normalized || row.client_name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      clients.push({
        client_name: row.client_name,
        client_phone: row.client_phone,
        client_email: row.client_email,
      });
    }
    if (clients.length >= 5) break;
  }

  return NextResponse.json({ clients });
}
