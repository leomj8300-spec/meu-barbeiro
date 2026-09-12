import { supabaseScoped } from "@/lib/supabase/scoped";

/**
 * Encontra a ficha do cliente pelo nome digitado, ou cria uma na hora.
 *
 * O barbeiro não vai parar no meio do atendimento pra cadastrar ninguém —
 * ele digita o nome e pronto. Então a ficha nasce sozinha do uso normal, e
 * a carteira de clientes se forma sem trabalho extra. Comparação ignora
 * maiúsculas e espaços pra "joão" e "João " não virarem duas pessoas.
 *
 * Nunca derruba o fluxo: se falhar, devolve null e o atendimento é
 * registrado do mesmo jeito, só sem vínculo.
 */
export async function resolverClienteId(
  barbeariaId: string,
  nome: string,
): Promise<string | null> {
  const limpo = nome.trim();
  if (!limpo) return null;

  try {
    const db = await supabaseScoped();

    const { data: existentes } = await db
      .from("clientes")
      .select("id, nome")
      .eq("barbearia_id", barbeariaId)
      .ilike("nome", limpo);

    const igual = existentes?.find(
      (c) => c.nome.trim().toLowerCase() === limpo.toLowerCase(),
    );
    if (igual) return igual.id;

    const { data: criado } = await db
      .from("clientes")
      .insert({ barbearia_id: barbeariaId, nome: limpo })
      .select("id")
      .single();

    return criado?.id ?? null;
  } catch {
    return null;
  }
}
