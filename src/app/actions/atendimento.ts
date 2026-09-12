"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { supabaseScoped } from "@/lib/supabase/scoped";
import { getConfiguracoes } from "@/lib/queries";
import { CONFIGURACOES_PADRAO } from "@/lib/types";
import { registrarErro } from "@/lib/logs";

const itemServicoSchema = z.object({
  servico_id: z.string().uuid(),
  nome: z.string(),
  preco: z.number().nonnegative(),
  comissionavel: z.boolean(),
});

const itemConsumoSchema = z.object({
  consumo_id: z.string().uuid(),
  nome: z.string(),
  preco: z.number().nonnegative(),
  quantidade: z.number().int().positive(),
});

const registrarAtendimentoSchema = z.object({
  cliente: z.string().trim().min(1, "Informe o nome do cliente."),
  servicos: z.array(itemServicoSchema),
  consumos: z.array(itemConsumoSchema),
  valor: z.number().nonnegative(),
  precoNegociado: z.boolean(),
  fiado: z.boolean(),
  /** Presente quando o atendimento nasceu de um horário marcado. */
  agendamentoId: z.string().uuid().optional(),
});

export type RegistrarAtendimentoInput = z.infer<typeof registrarAtendimentoSchema>;

export async function registrarAtendimentoAction(
  input: RegistrarAtendimentoInput,
): Promise<{ error: string | null }> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };

  const parsed = registrarAtendimentoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { cliente, servicos, valor, precoNegociado } = parsed.data;

  const configuracoes = (await getConfiguracoes(session.user.barbeariaId)) ?? CONFIGURACOES_PADRAO;
  const consumos = configuracoes.controleEstoqueHabilitado ? parsed.data.consumos : [];
  const fiado = configuracoes.fiadoHabilitado ? parsed.data.fiado : false;

  if (servicos.length === 0 && consumos.length === 0) {
    return { error: "Selecione ao menos um serviço ou consumo." };
  }

  // Marcando hora, todo atendimento nasce de um agendamento (o encaixe de quem
  // chega sem marcar também vira um). A trava fica aqui, no servidor, e não só
  // na tela — senão bastaria abrir /atendimento direto pra furar a agenda.
  if (configuracoes.modoAtendimento === "agendamento" && !parsed.data.agendamentoId) {
    return { error: "Nesse modo, o atendimento precisa sair de um horário marcado." };
  }

  const { data: atendimentoId, error } = await (await supabaseScoped()).rpc("registrar_atendimento", {
    p_barbearia_id: session.user.barbeariaId,
    p_barbeiro_id: session.user.id,
    p_cliente: cliente,
    p_servicos: servicos,
    p_consumos: consumos,
    p_valor: valor,
    p_preco_negociado: precoNegociado,
    p_fiado: fiado,
  });

  if (error) {
    if (error.message.startsWith("estoque-insuficiente")) {
      const nome = error.message.split(":")[1];
      return { error: `Estoque insuficiente de: ${nome}` };
    }
    await registrarErro({
      barbeariaId: session.user.barbeariaId,
      usuarioId: session.user.id,
      contexto: "registrar_atendimento",
      mensagem: error.message,
    });
    return { error: "Não foi possível registrar o atendimento." };
  }

  if (parsed.data.agendamentoId) {
    // O atendimento já está gravado; se marcar como atendido falhar, o cliente
    // continua aparecendo como "marcado" na agenda. Chato, mas não perde
    // dinheiro nem duplica registro — por isso não desfaz o atendimento.
    await (await supabaseScoped())
      .from("agendamentos")
      .update({ status: "atendido", atendimento_id: atendimentoId })
      .eq("id", parsed.data.agendamentoId)
      .eq("barbearia_id", session.user.barbeariaId);
    revalidatePath("/agenda");
  }

  revalidatePath("/atendimento");
  return { error: null };
}
