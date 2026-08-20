"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { supabaseScoped } from "@/lib/supabase/scoped";

const configuracoesSchema = z
  .object({
    controleEstoqueHabilitado: z.boolean(),
    gestaoEquipeHabilitada: z.boolean(),
    comissaoHabilitada: z.boolean(),
    comissaoPadraoPct: z.number().min(0).max(100),
    fiadoHabilitado: z.boolean(),
    caixinhaHabilitada: z.boolean(),
    periodicidadeFechamento: z.enum(["semanal", "quinzenal", "mensal"]),
    diaInicioPeriodo: z.number().int().min(1).max(31),
  })
  .refine(
    (v) => v.periodicidadeFechamento === "mensal" || v.diaInicioPeriodo <= 7,
    { message: "Dia da semana inválido.", path: ["diaInicioPeriodo"] },
  );

export type ConfiguracoesInput = z.infer<typeof configuracoesSchema>;

export async function salvarConfiguracoesAction(
  input: ConfiguracoesInput,
): Promise<{ error: string | null }> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };
  if (session.user.papel !== "dono") {
    return { error: "Apenas o dono pode alterar as configurações." };
  }

  const parsed = configuracoesSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const c = parsed.data;

  const { error } = await (await supabaseScoped())
    .from("barbearia_configuracoes")
    .upsert(
      {
        barbearia_id: session.user.barbeariaId,
        controle_estoque_habilitado: c.controleEstoqueHabilitado,
        gestao_equipe_habilitada: c.gestaoEquipeHabilitada,
        comissao_habilitada: c.comissaoHabilitada,
        comissao_padrao_pct: c.comissaoPadraoPct,
        fiado_habilitado: c.fiadoHabilitado,
        caixinha_habilitada: c.caixinhaHabilitada,
        periodicidade_fechamento: c.periodicidadeFechamento,
        dia_inicio_periodo: c.diaInicioPeriodo,
      },
      { onConflict: "barbearia_id" },
    );

  if (error) {
    return { error: "Não foi possível salvar as configurações." };
  }

  revalidatePath("/atendimento");
  revalidatePath("/configuracoes");
  return { error: null };
}
