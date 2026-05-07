/**
 * Cliente Supabase con anon key.
 * Seguro para usar en browser y server (respeta RLS).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabasePublic = createClient(url, key, {
  auth: { persistSession: false },
});
