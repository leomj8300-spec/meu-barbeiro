"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { supabaseScoped } from "@/lib/supabase/scoped";

type ResultadoAuth = { ok: true; barbeariaId: string } | { ok: false; erro: string };

async function exigirDono(): Promise<ResultadoAuth> {
  const session = await auth();
  if (!session?.user) return { ok: false, erro: "Sessão expirada. Faça login novamente." };
  if (session.user.papel !== "dono") {
    return { ok: false, erro: "Apenas o dono pode gerenciar a equipe." };
  }
  return { ok: true, barbeariaId: session.user.barbeariaId };
}

const criarBarbeiroSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome."),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  senha: z.string().min(6, "A senha precisa ter ao menos 6 caracteres."),
  comissaoPadrao: z.number().min(0).max(100),
});

export async function criarBarbeiroAction(
  input: z.infer<typeof criarBarbeiroSchema>,
): Promise<{ error: string | null }> {
  const auth_ = await exigirDono();
  if (!auth_.ok) return { error: auth_.erro };

  const parsed = criarBarbeiroSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const senhaHash = await bcrypt.hash(parsed.data.senha, 10);
  const { error } = await (await supabaseScoped()).from("usuarios").insert({
    barbearia_id: auth_.barbeariaId,
    nome: parsed.data.nome,
    email: parsed.data.email,
    senha_hash: senhaHash,
    papel: "barbeiro",
    comissao_padrao: parsed.data.comissaoPadrao,
  });
  if (error) {
    if (error.code === "23505") return { error: "Já existe um usuário com esse e-mail." };
    return { error: "Não foi possível cadastrar o barbeiro." };
  }

  revalidatePath("/equipe");
  return { error: null };
}

const atualizarBarbeiroSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().trim().min(1, "Informe o nome."),
  comissaoPadrao: z.number().min(0).max(100),
});

export async function atualizarBarbeiroAction(
  input: z.infer<typeof atualizarBarbeiroSchema>,
): Promise<{ error: string | null }> {
  const auth_ = await exigirDono();
  if (!auth_.ok) return { error: auth_.erro };

  const parsed = atualizarBarbeiroSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { data, error } = await (await supabaseScoped())
    .from("usuarios")
    .update({ nome: parsed.data.nome, comissao_padrao: parsed.data.comissaoPadrao })
    .eq("id", parsed.data.id)
    .eq("barbearia_id", auth_.barbeariaId)
    .eq("papel", "barbeiro")
    .select("id");
  if (error) return { error: "Não foi possível salvar." };
  if (!data || data.length === 0) return { error: "Barbeiro não encontrado." };

  revalidatePath("/equipe");
  return { error: null };
}

export async function removerBarbeiroAction(id: string): Promise<{ error: string | null }> {
  const auth_ = await exigirDono();
  if (!auth_.ok) return { error: auth_.erro };

  const { data, error } = await (await supabaseScoped())
    .from("usuarios")
    .delete()
    .eq("id", id)
    .eq("barbearia_id", auth_.barbeariaId)
    .eq("papel", "barbeiro")
    .select("id");
  if (error) {
    if (error.code === "23503") {
      return { error: "Não é possível remover: este barbeiro já tem atendimentos registrados." };
    }
    return { error: "Não foi possível remover o barbeiro." };
  }
  if (!data || data.length === 0) return { error: "Barbeiro não encontrado." };

  revalidatePath("/equipe");
  return { error: null };
}
