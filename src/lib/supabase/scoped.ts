import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { auth } from "@/auth";

const supabaseUrl = process.env.SUPABASE_URL!;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY!;

/**
 * Cliente Supabase escopado à sessão atual: usa a chave publicável + o JWT
 * assinado pelo Auth.js (barbearia_id/papel como claims) em vez da chave
 * secreta. Com isso o RLS passa a valer de verdade, como segunda camada de
 * isolamento independente do filtro .eq("barbearia_id", ...) que cada query
 * já aplica no código.
 *
 * Não usar no login (authorize() em src/auth.ts) — ali ainda não existe
 * sessão/JWT, e por isso aquele caminho continua em supabaseAdmin().
 */
export async function supabaseScoped(): Promise<SupabaseClient> {
  const session = await auth();
  if (!session?.supabaseAccessToken) {
    throw new Error("Sessão sem token Supabase — faça login novamente.");
  }
  return createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: `Bearer ${session.supabaseAccessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
