"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { supabaseScoped } from "@/lib/supabase/scoped";

type ResultadoAuth =
  | { ok: true; barbeariaId: string }
  | { ok: false; erro: string };

async function exigirDono(): Promise<ResultadoAuth> {
  const session = await auth();
  if (!session?.user) return { ok: false, erro: "Sessão expirada. Faça login novamente." };
  if (session.user.papel !== "dono") {
    return { ok: false, erro: "Apenas o dono pode alterar serviços e consumos." };
  }
  return { ok: true, barbeariaId: session.user.barbeariaId };
}

function ehViolacaoDeReferencia(error: { code?: string }) {
  return error.code === "23503";
}

// ---------- Serviços ----------

const servicoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do serviço."),
  preco: z.number().nonnegative(),
  comissionavel: z.boolean(),
  duracaoMin: z
    .number()
    .int()
    .min(5, "A duração mínima é 5 minutos.")
    .max(480, "A duração máxima é 8 horas."),
});

function colunasServico(d: z.infer<typeof servicoSchema>) {
  return {
    nome: d.nome,
    preco: d.preco,
    comissionavel: d.comissionavel,
    duracao_min: d.duracaoMin,
  };
}

export async function criarServicoAction(
  input: z.infer<typeof servicoSchema>,
): Promise<{ error: string | null }> {
  const auth_ = await exigirDono();
  if (!auth_.ok) return { error: auth_.erro };

  const parsed = servicoSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { error } = await (await supabaseScoped())
    .from("servicos")
    .insert({ barbearia_id: auth_.barbeariaId, ...colunasServico(parsed.data) });
  if (error) return { error: "Não foi possível criar o serviço." };

  revalidatePath("/servicos-consumos");
  revalidatePath("/atendimento");
  return { error: null };
}

export async function atualizarServicoAction(
  input: z.infer<typeof servicoSchema> & { id: string },
): Promise<{ error: string | null }> {
  const auth_ = await exigirDono();
  if (!auth_.ok) return { error: auth_.erro };

  const parsed = servicoSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { data, error } = await (await supabaseScoped())
    .from("servicos")
    .update(colunasServico(parsed.data))
    .eq("id", input.id)
    .eq("barbearia_id", auth_.barbeariaId)
    .select("id");
  if (error) return { error: "Não foi possível salvar o serviço." };
  if (!data || data.length === 0) return { error: "Serviço não encontrado." };

  revalidatePath("/servicos-consumos");
  revalidatePath("/atendimento");
  return { error: null };
}

export async function excluirServicoAction(id: string): Promise<{ error: string | null }> {
  const auth_ = await exigirDono();
  if (!auth_.ok) return { error: auth_.erro };

  const { data, error } = await (await supabaseScoped())
    .from("servicos")
    .delete()
    .eq("id", id)
    .eq("barbearia_id", auth_.barbeariaId)
    .select("id");
  if (error) {
    if (ehViolacaoDeReferencia(error)) {
      return { error: "Não é possível excluir: este serviço já foi usado em atendimentos." };
    }
    return { error: "Não foi possível excluir o serviço." };
  }
  if (!data || data.length === 0) return { error: "Serviço não encontrado." };

  revalidatePath("/servicos-consumos");
  revalidatePath("/atendimento");
  return { error: null };
}

// ---------- Consumos ----------

const consumoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do consumo."),
  preco: z.number().nonnegative(),
});

export async function criarConsumoAction(
  input: z.infer<typeof consumoSchema> & { estoqueInicial: number },
): Promise<{ error: string | null }> {
  const auth_ = await exigirDono();
  if (!auth_.ok) return { error: auth_.erro };

  const parsed = consumoSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const estoqueInicial = Math.max(0, Math.trunc(input.estoqueInicial || 0));

  const { error } = await (await supabaseScoped())
    .from("consumos")
    .insert({ barbearia_id: auth_.barbeariaId, ...parsed.data, estoque: estoqueInicial });
  if (error) return { error: "Não foi possível criar o consumo." };

  revalidatePath("/servicos-consumos");
  revalidatePath("/atendimento");
  return { error: null };
}

export async function atualizarConsumoAction(
  input: z.infer<typeof consumoSchema> & { id: string },
): Promise<{ error: string | null }> {
  const auth_ = await exigirDono();
  if (!auth_.ok) return { error: auth_.erro };

  const parsed = consumoSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  // Só nome/preço — estoque nunca é sobrescrito aqui, só via ajustarEstoqueAction.
  const { data, error } = await (await supabaseScoped())
    .from("consumos")
    .update(parsed.data)
    .eq("id", input.id)
    .eq("barbearia_id", auth_.barbeariaId)
    .select("id");
  if (error) return { error: "Não foi possível salvar o consumo." };
  if (!data || data.length === 0) return { error: "Consumo não encontrado." };

  revalidatePath("/servicos-consumos");
  revalidatePath("/atendimento");
  return { error: null };
}

/**
 * Ajusta o estoque por delta (reposição = positivo, baixa manual = negativo).
 * Nunca sobrescreve o número direto.
 */
export async function ajustarEstoqueAction(
  id: string,
  delta: number,
): Promise<{ error: string | null }> {
  const auth_ = await exigirDono();
  if (!auth_.ok) return { error: auth_.erro };

  const deltaInt = Math.trunc(delta);
  if (!Number.isFinite(deltaInt) || deltaInt === 0) return { error: "Ajuste inválido." };

  const { error } = await (await supabaseScoped()).rpc("ajustar_estoque_consumo", {
    p_consumo_id: id,
    p_barbearia_id: auth_.barbeariaId,
    p_delta: deltaInt,
  });
  if (error) {
    if (error.message.startsWith("estoque-insuficiente")) {
      return { error: "Estoque insuficiente para essa baixa." };
    }
    return { error: "Não foi possível ajustar o estoque." };
  }

  revalidatePath("/servicos-consumos");
  revalidatePath("/atendimento");
  return { error: null };
}

export async function excluirConsumoAction(id: string): Promise<{ error: string | null }> {
  const auth_ = await exigirDono();
  if (!auth_.ok) return { error: auth_.erro };

  const { data, error } = await (await supabaseScoped())
    .from("consumos")
    .delete()
    .eq("id", id)
    .eq("barbearia_id", auth_.barbeariaId)
    .select("id");
  if (error) {
    if (ehViolacaoDeReferencia(error)) {
      return { error: "Não é possível excluir: este consumo já foi usado em atendimentos." };
    }
    return { error: "Não foi possível excluir o consumo." };
  }
  if (!data || data.length === 0) return { error: "Consumo não encontrado." };

  revalidatePath("/servicos-consumos");
  revalidatePath("/atendimento");
  return { error: null };
}
