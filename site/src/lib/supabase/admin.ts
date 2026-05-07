/**
 * Cliente Supabase con service_role.
 * USAR SOLO EN SERVER (API routes). Bypassa Row Level Security.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Missing Supabase env vars (URL / SERVICE_ROLE_KEY)");
}

export const supabaseAdmin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
