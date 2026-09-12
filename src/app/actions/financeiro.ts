"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { supabaseScoped } from "@/lib/supabase/scoped";

type ResultadoAuth = { ok: true; barbeariaId: string } | { ok: false; erro: string };

async function exigirDono(): Promise<ResultadoAuth> {
  const session = await auth();
  if (!session?.user) return { ok: false, erro: "Sessão expirada. Faça login novamente." };
  if (session.user.papel !== "dono") {
    return { ok: false, erro: "Apenas o dono pode mexer no financeiro." };
  }
  return { ok: true, barbeariaId: session.user.barbeariaId };
}

// ---------- Contas a pagar e receber ----------

const contaSchema = z.object({
  tipo: z.enum(["pagar", "receber"]),
  descricao: z.string().trim().min(1, "Informe a descrição."),
  valor: z.number().nonnegative("O valor não pode ser negativo."),
  vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de vencimento inválida."),
});

export async function criarContaAction(
  input: z.infer<typeof contaSchema>,
): Promise<{ error: string | null }> {
  const auth_ = await exigirDono();
  if (!auth_.ok) return { error: auth_.erro };

  const parsed = contaSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { error } = await (await supabaseScoped())
    .from("contas")
    .insert({ barbearia_id: auth_.barbeariaId, ...parsed.data });
  if (error) return { error: "Não foi possível lançar a conta." };

  revalidatePath("/financeiro");
  return { error: null };
}

export async function alternarContaPagaAction(
  id: string,
  pago: boolean,
): Promise<{ error: string | null }> {
  const auth_ = await exigirDono();
  if (!auth_.ok) return { error: auth_.erro };

  const { data, error } = await (await supabaseScoped())
    .from("contas")
    .update({ pago, pago_em: pago ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("barbearia_id", auth_.barbeariaId)
    .select("id");

  if (error) return { error: "Não foi possível atualizar a conta." };
  if (!data || data.length === 0) return { error: "Conta não encontrada." };

  revalidatePath("/financeiro");
  return { error: null };
}

export async function excluirContaAction(id: string): Promise<{ error: string | null }> {
  const auth_ = await exigirDono();
  if (!auth_.ok) return { error: auth_.erro };

  const { data, error } = await (await supabaseScoped())
    .from("contas")
    .delete()
    .eq("id", id)
    .eq("barbearia_id", auth_.barbeariaId)
    .select("id");

  if (error) return { error: "Não foi possível excluir a conta." };
  if (!data || data.length === 0) return { error: "Conta não encontrada." };

  revalidatePath("/financeiro");
  return { error: null };
}

// ---------- Formas de pagamento ----------

const formaSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome."),
  taxaPct: z
    .number()
    .min(0, "A taxa não pode ser negativa.")
    .max(100, "A taxa não pode passar de 100%."),
});

export async function criarFormaPagamentoAction(
  input: z.infer<typeof formaSchema>,
): Promise<{ error: string | null }> {
  const auth_ = await exigirDono();
  if (!auth_.ok) return { error: auth_.erro };

  const parsed = formaSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { error } = await (await supabaseScoped()).from("formas_pagamento").insert({
    barbearia_id: auth_.barbeariaId,
    nome: parsed.data.nome,
    taxa_pct: parsed.data.taxaPct,
  });
  if (error) return { error: "Não foi possível criar a forma de pagamento." };

  revalidatePath("/financeiro");
  revalidatePath("/atendimento");
  return { error: null };
}

export async function atualizarFormaPagamentoAction(
  input: z.infer<typeof formaSchema> & { id: string; ativa: boolean },
): Promise<{ error: string | null }> {
  const auth_ = await exigirDono();
  if (!auth_.ok) return { error: auth_.erro };

  const parsed = formaSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { data, error } = await (await supabaseScoped())
    .from("formas_pagamento")
    .update({ nome: parsed.data.nome, taxa_pct: parsed.data.taxaPct, ativa: input.ativa })
    .eq("id", input.id)
    .eq("barbearia_id", auth_.barbeariaId)
    .select("id");

  if (error) return { error: "Não foi possível salvar a forma de pagamento." };
  if (!data || data.length === 0) return { error: "Forma de pagamento não encontrada." };

  revalidatePath("/financeiro");
  revalidatePath("/atendimento");
  return { error: null };
}

// ---------- Vales / adiantamentos ----------

const valeSchema = z.object({
  barbeiroId: z.string().uuid(),
  valor: z.number().positive("O valor precisa ser maior que zero."),
  descricao: z.string().trim().max(120, "Descrição muito longa.").optional(),
});

export async function criarValeAction(
  input: z.infer<typeof valeSchema>,
): Promise<{ error: string | null }> {
  const auth_ = await exigirDono();
  if (!auth_.ok) return { error: auth_.erro };

  const parsed = valeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { error } = await (await supabaseScoped()).from("vales").insert({
    barbearia_id: auth_.barbeariaId,
    barbeiro_id: parsed.data.barbeiroId,
    valor: parsed.data.valor,
    descricao: parsed.data.descricao || null,
  });
  if (error) return { error: "Não foi possível lançar o vale." };

  revalidatePath("/financeiro");
  revalidatePath("/caixa");
  return { error: null };
}

export async function quitarValeAction(id: string): Promise<{ error: string | null }> {
  const auth_ = await exigirDono();
  if (!auth_.ok) return { error: auth_.erro };

  const { data, error } = await (await supabaseScoped())
    .from("vales")
    .update({ em_aberto: false })
    .eq("id", id)
    .eq("barbearia_id", auth_.barbeariaId)
    .select("id");

  if (error) return { error: "Não foi possível quitar o vale." };
  if (!data || data.length === 0) return { error: "Vale não encontrado." };

  revalidatePath("/financeiro");
  revalidatePath("/caixa");
  return { error: null };
}
