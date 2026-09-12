"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { supabaseScoped } from "@/lib/supabase/scoped";

const clienteSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do cliente."),
  telefone: z.string().trim().max(20, "Telefone muito longo.").optional(),
  /** "1990-03-25" — vazio quando o cliente não quis dizer. */
  aniversario: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de aniversário inválida.")
    .optional(),
  observacao: z.string().trim().max(300, "Observação muito longa.").optional(),
});

export type ClienteInput = z.infer<typeof clienteSchema>;

function colunas(d: ClienteInput) {
  return {
    nome: d.nome,
    telefone: d.telefone || null,
    aniversario: d.aniversario || null,
    observacao: d.observacao || null,
  };
}

export async function criarClienteAction(
  input: ClienteInput,
): Promise<{ error: string | null; id?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };

  const parsed = clienteSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { data, error } = await (await supabaseScoped())
    .from("clientes")
    .insert({ barbearia_id: session.user.barbeariaId, ...colunas(parsed.data) })
    .select("id")
    .single();

  if (error || !data) return { error: "Não foi possível cadastrar o cliente." };

  revalidatePath("/clientes");
  return { error: null, id: data.id };
}

export async function atualizarClienteAction(
  input: ClienteInput & { id: string },
): Promise<{ error: string | null }> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };

  const parsed = clienteSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { data, error } = await (await supabaseScoped())
    .from("clientes")
    .update(colunas(parsed.data))
    .eq("id", input.id)
    .eq("barbearia_id", session.user.barbeariaId)
    .select("id");

  if (error) return { error: "Não foi possível salvar o cliente." };
  if (!data || data.length === 0) return { error: "Cliente não encontrado." };

  revalidatePath("/clientes");
  return { error: null };
}

export async function excluirClienteAction(id: string): Promise<{ error: string | null }> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };
  if (session.user.papel !== "dono") {
    return { error: "Apenas o dono pode excluir clientes." };
  }

  const { data, error } = await (await supabaseScoped())
    .from("clientes")
    .delete()
    .eq("id", id)
    .eq("barbearia_id", session.user.barbeariaId)
    .select("id");

  if (error) return { error: "Não foi possível excluir o cliente." };
  if (!data || data.length === 0) return { error: "Cliente não encontrado." };

  revalidatePath("/clientes");
  return { error: null };
}
