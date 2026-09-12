"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { supabaseScoped } from "@/lib/supabase/scoped";
import { getConfiguracoes, type MensagemTicketSuporte } from "@/lib/queries";
import { CONFIGURACOES_PADRAO } from "@/lib/types";
import { gerarRespostaSuporte, type MensagemSuporte } from "@/lib/ai/suporte";
import { enviarAvisoTicket } from "@/lib/notificacoes";
import { atualizarBarbeiroAction } from "./equipe";
import { salvarConfiguracoesAction, type ConfiguracoesInput } from "./configuracoes";
import { marcarComoPagoAction } from "./fiado";
import { supabaseAdmin } from "@/lib/supabase/server";

const enviarMensagemSchema = z.object({
  ticketId: z.string().uuid().optional(),
  conteudo: z.string().trim().min(1, "Escreva sua mensagem."),
});

export async function enviarMensagemAction(
  input: z.infer<typeof enviarMensagemSchema>,
): Promise<{ error: string | null; ticketId?: string; mensagens?: MensagemTicketSuporte[] }> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };

  const parsed = enviarMensagemSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const db = await supabaseScoped();
  let idTicket: string;

  if (parsed.data.ticketId) {
    idTicket = parsed.data.ticketId;
    // Responder reabre um ticket que já tinha sido marcado como resolvido —
    // o barbeiro/dono continuando a falar significa que ainda não acabou.
    await db
      .from("suporte_tickets")
      .update({ status: "aberto", atualizado_em: new Date().toISOString() })
      .eq("id", idTicket)
      .in("status", ["resolvido"]);
  } else {
    const { data: novoTicket, error: errTicket } = await db
      .from("suporte_tickets")
      .insert({ barbearia_id: session.user.barbeariaId, aberto_por: session.user.id })
      .select("id")
      .single();
    if (errTicket || !novoTicket) return { error: "Não foi possível abrir o chamado." };
    idTicket = novoTicket.id;
  }

  const { error: errMsgUsuario } = await db
    .from("suporte_mensagens")
    .insert({ ticket_id: idTicket, remetente: "usuario", conteudo: parsed.data.conteudo });
  if (errMsgUsuario) return { error: "Não foi possível enviar a mensagem." };

  const { data: historicoDb, error: errHistorico } = await db
    .from("suporte_mensagens")
    .select("remetente, conteudo")
    .eq("ticket_id", idTicket)
    .order("criado_em", { ascending: true });
  if (errHistorico) return { error: "Não foi possível carregar a conversa." };

  const historico: MensagemSuporte[] = (historicoDb ?? []).map((m) => ({
    remetente: m.remetente as MensagemSuporte["remetente"],
    conteudo: m.conteudo,
  }));

  let respostaIa;
  try {
    respostaIa = await gerarRespostaSuporte({
      barbeariaId: session.user.barbeariaId,
      usuarioId: session.user.id,
      papel: session.user.papel,
      historico,
    });
  } catch {
    return { error: "O suporte automático está indisponível agora. Tente de novo em instantes." };
  }

  await db.from("suporte_mensagens").insert({
    ticket_id: idTicket,
    remetente: "ia",
    conteudo: respostaIa.conteudo,
    acao_proposta: respostaIa.acaoProposta,
  });

  if (respostaIa.escalar) {
    await db
      .from("suporte_tickets")
      .update({
        status: "aguardando_admin",
        resumo: respostaIa.conteudo.slice(0, 140),
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", idTicket);

    const { data: barbearia } = await supabaseAdmin()
      .from("barbearias")
      .select("nome")
      .eq("id", session.user.barbeariaId)
      .single();
    await enviarAvisoTicket({
      ticketId: idTicket,
      barbeariaNome: barbearia?.nome ?? "Uma barbearia",
      resumo: respostaIa.conteudo.slice(0, 140),
    });
  }

  const { data: mensagensFinais } = await db
    .from("suporte_mensagens")
    .select("id, remetente, conteudo, acao_proposta, acao_executada, criado_em")
    .eq("ticket_id", idTicket)
    .order("criado_em", { ascending: true });

  return {
    error: null,
    ticketId: idTicket,
    mensagens: (mensagensFinais ?? []).map((m) => ({
      id: m.id,
      remetente: m.remetente,
      conteudo: m.conteudo,
      acaoProposta: m.acao_proposta,
      acaoExecutada: m.acao_executada,
      criadoEm: m.criado_em,
    })),
  };
}

/**
 * Executa a ação que a IA propôs numa mensagem específica — só depois que a
 * pessoa confirma explicitamente na tela. Cada ramo aqui só chama a action
 * REAL correspondente (mesma que os botões do app já usam), então a
 * permissão de quem pode fazer o quê continua sendo decidida por ela, não
 * por este código: um barbeiro tentando confirmar uma ação de dono recebe o
 * mesmo erro que receberia clicando no botão de verdade.
 */
export async function confirmarAcaoAction(
  mensagemId: string,
): Promise<{ error: string | null; mensagens?: MensagemTicketSuporte[] }> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };

  const db = await supabaseScoped();
  const { data: mensagem, error: errMensagem } = await db
    .from("suporte_mensagens")
    .select("id, ticket_id, acao_proposta, acao_executada")
    .eq("id", mensagemId)
    .maybeSingle();
  if (errMensagem || !mensagem) return { error: "Mensagem não encontrada." };
  if (!mensagem.acao_proposta) return { error: "Essa mensagem não tem ação pra confirmar." };
  if (mensagem.acao_executada) return { error: "Essa ação já foi aplicada." };

  const proposta = mensagem.acao_proposta as {
    acao: "ajustar_comissao_barbeiro" | "alternar_recurso" | "marcar_fiado_pago";
    params: Record<string, unknown>;
  };

  let resultado: { error: string | null };

  switch (proposta.acao) {
    case "ajustar_comissao_barbeiro": {
      const barbeiroId = String(proposta.params.barbeiroId);
      const { data: barbeiro } = await db.from("usuarios").select("nome").eq("id", barbeiroId).maybeSingle();
      if (!barbeiro) {
        resultado = { error: "Barbeiro não encontrado." };
        break;
      }
      resultado = await atualizarBarbeiroAction({
        id: barbeiroId,
        nome: barbeiro.nome,
        comissaoPadrao: Number(proposta.params.novoPct),
      });
      break;
    }
    case "alternar_recurso": {
      const atual = (await getConfiguracoes(session.user.barbeariaId)) ?? CONFIGURACOES_PADRAO;
      const recurso = String(proposta.params.recurso);
      const ligado = Boolean(proposta.params.ligado);
      const novaConfig: ConfiguracoesInput = {
        controleEstoqueHabilitado: atual.controleEstoqueHabilitado,
        gestaoEquipeHabilitada: atual.gestaoEquipeHabilitada,
        comissaoHabilitada: recurso === "comissao" ? ligado : atual.comissaoHabilitada,
        comissaoPadraoPct: atual.comissaoPadraoPct,
        fiadoHabilitado: recurso === "fiado" ? ligado : atual.fiadoHabilitado,
        caixinhaHabilitada: recurso === "caixinha" ? ligado : atual.caixinhaHabilitada,
        periodicidadeFechamento: atual.periodicidadeFechamento,
        diaInicioPeriodo: atual.diaInicioPeriodo,
        // A IA não mexe no modo de atendimento nem no horário: trocar isso
        // reorganiza o dia inteiro da barbearia, é decisão do dono na tela.
        modoAtendimento: atual.modoAtendimento,
        horaAbertura: atual.horaAbertura,
        horaFechamento: atual.horaFechamento,
        diasFuncionamento: atual.diasFuncionamento,
      };
      resultado = await salvarConfiguracoesAction(novaConfig);
      break;
    }
    case "marcar_fiado_pago": {
      resultado = await marcarComoPagoAction(String(proposta.params.atendimentoId));
      break;
    }
  }

  await db.from("suporte_mensagens").insert({
    ticket_id: mensagem.ticket_id,
    remetente: "ia",
    conteudo: resultado.error
      ? `Não consegui aplicar: ${resultado.error}`
      : "Pronto, já apliquei essa mudança.",
  });

  if (!resultado.error) {
    await db.from("suporte_mensagens").update({ acao_executada: true }).eq("id", mensagemId);
  }

  const { data: mensagensFinais } = await db
    .from("suporte_mensagens")
    .select("id, remetente, conteudo, acao_proposta, acao_executada, criado_em")
    .eq("ticket_id", mensagem.ticket_id)
    .order("criado_em", { ascending: true });

  return {
    error: null,
    mensagens: (mensagensFinais ?? []).map((m) => ({
      id: m.id,
      remetente: m.remetente,
      conteudo: m.conteudo,
      acaoProposta: m.acao_proposta,
      acaoExecutada: m.acao_executada,
      criadoEm: m.criado_em,
    })),
  };
}
