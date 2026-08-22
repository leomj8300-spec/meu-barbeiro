import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Leituras entre tenants pro super-admin e pro login por caminho
 * (/b/[subdominio]/login, antes de existir sessão). Usa supabaseAdmin()
 * (chave de serviço) de propósito — src/lib/queries.ts é só leitura escopada
 * por tenant via supabaseScoped(), misturar quebraria essa garantia.
 */

export async function getBarbeariaPorSubdominio(
  subdominio: string,
): Promise<{ id: string; nome: string } | null> {
  const { data, error } = await supabaseAdmin()
    .from("barbearias")
    .select("id, nome")
    .eq("subdominio", subdominio)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export interface BarbeariaResumo {
  id: string;
  nome: string;
  subdominio: string;
  criadoEm: string;
  donoNome: string | null;
  donoEmail: string | null;
}

export async function listarBarbearias(): Promise<BarbeariaResumo[]> {
  const { data, error } = await supabaseAdmin()
    .from("barbearias")
    .select("id, nome, subdominio, criado_em, usuarios(nome, email, papel)")
    .order("criado_em", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((b) => {
    const usuarios = (b.usuarios ?? []) as { nome: string; email: string; papel: string }[];
    const dono = usuarios.find((u) => u.papel === "dono");
    return {
      id: b.id,
      nome: b.nome,
      subdominio: b.subdominio,
      criadoEm: b.criado_em,
      donoNome: dono?.nome ?? null,
      donoEmail: dono?.email ?? null,
    };
  });
}
