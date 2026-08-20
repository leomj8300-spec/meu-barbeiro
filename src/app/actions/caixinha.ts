"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { supabaseScoped } from "@/lib/supabase/scoped";

const valorSchema = z.number().positive();

export async function registrarCaixinhaAction(valor: number): Promise<{ error: string | null }> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };

  const parsed = valorSchema.safeParse(valor);
  if (!parsed.success) return { error: "Informe um valor válido." };

  const { error } = await (await supabaseScoped()).from("caixinhas").insert({
    barbearia_id: session.user.barbeariaId,
    barbeiro_id: session.user.id,
    valor: parsed.data,
  });
  if (error) return { error: "Não foi possível registrar a caixinha." };

  revalidatePath("/caixinha");
  return { error: null };
}

export async function zerarMinhaCaixinhaAction(): Promise<{ error: string | null }> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };

  const { error } = await (await supabaseScoped())
    .from("caixinhas")
    .delete()
    .eq("barbearia_id", session.user.barbeariaId)
    .eq("barbeiro_id", session.user.id);
  if (error) return { error: "Não foi possível zerar a caixinha." };

  revalidatePath("/caixinha");
  return { error: null };
}

export async function zerarCaixinhaTudoAction(): Promise<{ error: string | null }> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };
  if (session.user.papel !== "dono") return { error: "Apenas o dono pode zerar a caixinha de todos." };

  const { error } = await (await supabaseScoped())
    .from("caixinhas")
    .delete()
    .eq("barbearia_id", session.user.barbeariaId);
  if (error) return { error: "Não foi possível zerar a caixinha." };

  revalidatePath("/caixinha");
  return { error: null };
}
