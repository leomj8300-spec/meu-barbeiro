"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { supabaseScoped } from "@/lib/supabase/scoped";
import { getConfiguracoes, getServicos } from "@/lib/queries";
import { CONFIGURACOES_PADRAO } from "@/lib/types";
import { resolverClienteId } from "@/lib/clientes";

const agendamentoSchema = z.object({
  cliente: z.string().trim().min(1, "Informe o nome do cliente."),
  telefone: z.string().trim().max(20, "Telefone muito longo.").optional(),
  /** "2026-09-11" */
  dia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  /** "14:30" */
  hora: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido."),
  servicoIds: z.array(z.string().uuid()).min(1, "Escolha pelo menos um serviço."),
  barbeiroId: z.string().uuid().optional(),
  observacao: z.string().trim().max(300, "Observação muito longa.").optional(),
});

export type AgendamentoInput = z.infer<typeof agendamentoSchema>;

/**
 * Monta o instante a partir do dia e da hora locais da barbearia. O -03:00 é
 * fixo porque o Brasil não tem mais horário de verão desde 2019 — e é o mesmo
 * fuso que src/lib/formato.ts usa pra exibir, então o que o barbeiro digita é
 * exatamente o que ele vê depois.
 */
function instante(dia: string, hora: string) {
  return new Date(`${dia}T${hora}:00-03:00`);
}

function minutosDoDia(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

/** 1=segunda .. 7=domingo, a partir do dia do calendário. */
function diaDaSemana(dia: string) {
  const [ano, mes, d] = dia.split("-").map(Number);
  const js = new Date(Date.UTC(ano, mes - 1, d)).getUTCDay(); // 0=domingo
  return js === 0 ? 7 : js;
}

type Contexto = { barbeariaId: string; usuarioId: string; ehDono: boolean };

async function exigirSessao(): Promise<{ ok: true; ctx: Contexto } | { ok: false; erro: string }> {
  const session = await auth();
  if (!session?.user) return { ok: false, erro: "Sessão expirada. Faça login novamente." };
  return {
    ok: true,
    ctx: {
      barbeariaId: session.user.barbeariaId,
      usuarioId: session.user.id,
      ehDono: session.user.papel === "dono",
    },
  };
}

/**
 * Recusa dois clientes na mesma cadeira. Compara janelas [início, fim) do
 * mesmo barbeiro no mesmo dia — cancelado e falta não ocupam horário.
 */
async function temConflito(
  barbeariaId: string,
  barbeiroId: string,
  inicio: Date,
  duracaoMin: number,
  ignorarId?: string,
) {
  const fim = new Date(inicio.getTime() + duracaoMin * 60000);
  // Um agendamento só pode colidir se começar no mesmo dia; buscar a janela do
  // dia inteiro é barato e evita depender de SQL de intervalo.
  const diaInicio = new Date(inicio);
  diaInicio.setUTCHours(diaInicio.getUTCHours() - 24);
  const diaFim = new Date(inicio);
  diaFim.setUTCHours(diaFim.getUTCHours() + 24);

  let query = (await supabaseScoped())
    .from("agendamentos")
    .select("id, inicio, duracao_min")
    .eq("barbearia_id", barbeariaId)
    .eq("barbeiro_id", barbeiroId)
    .in("status", ["marcado", "atendido"])
    .gte("inicio", diaInicio.toISOString())
    .lte("inicio", diaFim.toISOString());

  if (ignorarId) query = query.neq("id", ignorarId);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).some((a) => {
    const outroInicio = new Date(a.inicio).getTime();
    const outroFim = outroInicio + a.duracao_min * 60000;
    return inicio.getTime() < outroFim && fim.getTime() > outroInicio;
  });
}

export async function criarAgendamentoAction(
  input: AgendamentoInput,
): Promise<{ error: string | null; id?: string }> {
  return criar(input, { validarAgenda: true });
}

/**
 * `validarAgenda` false é o encaixe: o cliente já está na cadeira, então não
 * faz sentido recusar por estar fora do expediente ou por colidir com outro
 * horário — isso registra o que está acontecendo, não planeja o futuro.
 */
async function criar(
  input: AgendamentoInput,
  { validarAgenda }: { validarAgenda: boolean },
): Promise<{ error: string | null; id?: string }> {
  const sessao = await exigirSessao();
  if (!sessao.ok) return { error: sessao.erro };
  const { barbeariaId, usuarioId, ehDono } = sessao.ctx;

  const parsed = agendamentoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const d = parsed.data;

  // Barbeiro só marca pra si; o dono marca pra quem estiver livre (é ele que
  // costuma atender o telefone no balcão).
  const barbeiroId = ehDono && d.barbeiroId ? d.barbeiroId : usuarioId;

  const config = (await getConfiguracoes(barbeariaId)) ?? CONFIGURACOES_PADRAO;
  if (config.modoAtendimento !== "agendamento") {
    return { error: "A barbearia não está atendendo por agendamento." };
  }

  if (validarAgenda && !config.diasFuncionamento.includes(diaDaSemana(d.dia))) {
    return { error: "A barbearia não abre nesse dia." };
  }

  const servicos = await getServicos(barbeariaId);
  const escolhidos = servicos.filter((s) => d.servicoIds.includes(s.id));
  if (escolhidos.length !== d.servicoIds.length) {
    return { error: "Serviço não encontrado." };
  }
  const duracaoMin = escolhidos.reduce((soma, s) => soma + s.duracaoMin, 0);

  const inicio = instante(d.dia, d.hora);

  if (validarAgenda) {
    const comeca = minutosDoDia(d.hora);
    if (comeca < minutosDoDia(config.horaAbertura)) {
      return { error: `A barbearia abre às ${config.horaAbertura}.` };
    }
    if (comeca + duracaoMin > minutosDoDia(config.horaFechamento)) {
      return { error: `Não dá tempo antes de fechar, às ${config.horaFechamento}.` };
    }
    if (await temConflito(barbeariaId, barbeiroId, inicio, duracaoMin)) {
      return { error: "Já existe um cliente marcado nesse horário." };
    }
  }

  // Marcar horário também alimenta a carteira: quem marca vira ficha.
  const clienteId = await resolverClienteId(barbeariaId, d.cliente);

  const db = await supabaseScoped();
  const { data: criado, error } = await db
    .from("agendamentos")
    .insert({
      barbearia_id: barbeariaId,
      barbeiro_id: barbeiroId,
      cliente: d.cliente,
      cliente_id: clienteId,
      telefone: d.telefone || null,
      inicio: inicio.toISOString(),
      duracao_min: duracaoMin,
      observacao: d.observacao || null,
    })
    .select("id")
    .single();

  if (error || !criado) return { error: "Não foi possível marcar o horário." };

  const { error: erroServicos } = await db.from("agendamento_servicos").insert(
    escolhidos.map((s) => ({
      agendamento_id: criado.id,
      servico_id: s.id,
      nome: s.nome,
      preco: s.preco,
      duracao_min: s.duracaoMin,
    })),
  );
  if (erroServicos) {
    // Sem os serviços o agendamento fica sem duração real nem pré-preenchimento
    // — melhor desfazer do que deixar um horário pela metade na agenda.
    await db.from("agendamentos").delete().eq("id", criado.id);
    return { error: "Não foi possível marcar o horário." };
  }

  revalidatePath("/agenda");
  return { error: null, id: criado.id };
}

/** Encaixe de quem chegou sem marcar: um agendamento começando agora. */
export async function encaixarAgoraAction(
  cliente: string,
  servicoIds: string[],
): Promise<{ error: string | null; id?: string }> {
  const sessao = await exigirSessao();
  if (!sessao.ok) return { error: sessao.erro };

  const agora = new Date();
  const emSaoPaulo = agora.toLocaleString("en-CA", {
    timeZone: "America/Sao_Paulo",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  // "2026-09-11, 14:30"
  const [dia, hora] = emSaoPaulo.split(", ");

  return criar({ cliente, dia, hora, servicoIds }, { validarAgenda: false });
}

const mudarStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["cancelado", "faltou", "marcado"]),
});

export async function mudarStatusAgendamentoAction(
  input: z.infer<typeof mudarStatusSchema>,
): Promise<{ error: string | null }> {
  const sessao = await exigirSessao();
  if (!sessao.ok) return { error: sessao.erro };

  const parsed = mudarStatusSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { data, error } = await (await supabaseScoped())
    .from("agendamentos")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .eq("barbearia_id", sessao.ctx.barbeariaId)
    // Já atendido não volta atrás por aqui: o atendimento (e o dinheiro) já
    // foi registrado, desfazer teria que mexer em caixa, estoque e comissão.
    .neq("status", "atendido")
    .select("id");

  if (error) return { error: "Não foi possível atualizar o agendamento." };
  if (!data || data.length === 0) return { error: "Agendamento não encontrado." };

  revalidatePath("/agenda");
  return { error: null };
}
