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
    comissaoPadraoPct: z
      .number()
      .min(0, "A comissão não pode ser negativa.")
      .max(100, "A comissão não pode passar de 100%."),
    fiadoHabilitado: z.boolean(),
    caixinhaHabilitada: z.boolean(),
    periodicidadeFechamento: z.enum(["semanal", "quinzenal", "mensal"]),
    diaInicioPeriodo: z
      .number()
      .int()
      .min(1, "Dia inválido.")
      .max(31, "Dia inválido."),
    modoAtendimento: z.enum(["ordem_chegada", "agendamento"]),
    horaAbertura: z.string().regex(/^\d{2}:\d{2}$/, "Horário de abertura inválido."),
    horaFechamento: z.string().regex(/^\d{2}:\d{2}$/, "Horário de fechamento inválido."),
    diasFuncionamento: z
      .array(z.number().int().min(1, "Dia inválido.").max(7, "Dia inválido."))
      .min(1, "Escolha pelo menos um dia de funcionamento."),
  })
  .refine(
    (v) => v.periodicidadeFechamento === "mensal" || v.diaInicioPeriodo <= 7,
    { message: "Dia da semana inválido.", path: ["diaInicioPeriodo"] },
  )
  .refine((v) => v.horaAbertura < v.horaFechamento, {
    message: "O fechamento tem que ser depois da abertura.",
    path: ["horaFechamento"],
  });

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
        modo_atendimento: c.modoAtendimento,
        hora_abertura: c.horaAbertura,
        hora_fechamento: c.horaFechamento,
        dias_funcionamento: c.diasFuncionamento,
      },
      { onConflict: "barbearia_id" },
    );

  if (error) {
    return { error: "Não foi possível salvar as configurações." };
  }

  revalidatePath("/atendimento");
  revalidatePath("/agenda");
  revalidatePath("/configuracoes");
  return { error: null };
}
