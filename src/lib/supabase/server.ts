import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const secretKey = process.env.SUPABASE_SECRET_KEY!;

let adminClient: SupabaseClient | null = null;

/**
 * Server-only client using the secret key — bypasses RLS.
 * Never import this from a Client Component.
 */
export function supabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}
