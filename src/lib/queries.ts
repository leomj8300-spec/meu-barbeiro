import { cache } from "react";
import { supabaseScoped } from "@/lib/supabase/scoped";
import type { BarbeariaConfiguracoes } from "@/lib/types";
import { TEMA_PADRAO, type TemaCor } from "@/lib/theme";

export interface Servico {
  id: string;
  nome: string;
  preco: number;
  comissionavel: boolean;
}

export interface Consumo {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
}

export async function getServicos(barbeariaId: string): Promise<Servico[]> {
  const { data, error } = await (await supabaseScoped())
    .from("servicos")
    .select("id, nome, preco, comissionavel")
    .eq("barbearia_id", barbeariaId)
    .order("nome");
  if (error) throw error;
  return data ?? [];
}

export async function getConsumos(barbeariaId: string): Promise<Consumo[]> {
  const { data, error } = await (await supabaseScoped())
    .from("consumos")
    .select("id, nome, preco, estoque")
    .eq("barbearia_id", barbeariaId)
    .order("nome");
  if (error) throw error;
  return data ?? [];
}

export interface AtendimentoPendente {
  id: string;
  cliente: string;
  valor: number;
  criadoEm: string;
  barbeiroNome: string;
  servicos: string[];
  consumos: { nome: string; quantidade: number }[];
}

/**
 * Atendimentos com fiado em aberto (pago = false). Dono vê de todos os
 * barbeiros; barbeiro vê só os que ele mesmo registrou.
 */
export async function getAtendimentosPendentes(
  barbeariaId: string,
  barbeiroId?: string,
): Promise<AtendimentoPendente[]> {
  let query = (await supabaseScoped())
    .from("atendimentos")
    .select(
      "id, cliente, valor, criado_em, barbeiro:usuarios(nome), atendimento_servicos(nome), atendimento_consumos(nome, quantidade)",
    )
    .eq("barbearia_id", barbeariaId)
    .eq("pago", false)
    .order("criado_em", { ascending: false });

  if (barbeiroId) query = query.eq("barbeiro_id", barbeiroId);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((a) => {
    const barbeiro = a.barbeiro as unknown as { nome: string } | null;
    return {
      id: a.id,
      cliente: a.cliente,
      valor: Number(a.valor),
      criadoEm: a.criado_em,
      barbeiroNome: barbeiro?.nome ?? "—",
      servicos: (a.atendimento_servicos ?? []).map((s: { nome: string }) => s.nome),
      consumos: (a.atendimento_consumos ?? []).map((c: { nome: string; quantidade: number }) => ({
        nome: c.nome,
        quantidade: c.quantidade,
      })),
    };
  });
}

export interface AtendimentoHistorico extends AtendimentoPendente {
  pago: boolean;
}

/**
 * Últimos atendimentos registrados (pagos e fiado), mais recente primeiro.
 * Dono vê de todos os barbeiros; barbeiro vê só os que ele mesmo registrou.
 */
export async function getHistoricoAtendimentos(
  barbeariaId: string,
  barbeiroId?: string,
): Promise<AtendimentoHistorico[]> {
  let query = (await supabaseScoped())
    .from("atendimentos")
    .select(
      "id, cliente, valor, criado_em, pago, barbeiro:usuarios(nome), atendimento_servicos(nome), atendimento_consumos(nome, quantidade)",
    )
    .eq("barbearia_id", barbeariaId)
    .order("criado_em", { ascending: false })
    .limit(200);

  if (barbeiroId) query = query.eq("barbeiro_id", barbeiroId);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((a) => {
    const barbeiro = a.barbeiro as unknown as { nome: string } | null;
    return {
      id: a.id,
      cliente: a.cliente,
      valor: Number(a.valor),
      criadoEm: a.criado_em,
      pago: a.pago,
      barbeiroNome: barbeiro?.nome ?? "—",
      servicos: (a.atendimento_servicos ?? []).map((s: { nome: string }) => s.nome),
      consumos: (a.atendimento_consumos ?? []).map((c: { nome: string; quantidade: number }) => ({
        nome: c.nome,
        quantidade: c.quantidade,
      })),
    };
  });
}

export interface CaixinhaEntrada {
  id: string;
  valor: number;
  criadoEm: string;
}

export async function getMinhaCaixinha(
  barbeariaId: string,
  barbeiroId: string,
): Promise<{ total: number; entradas: CaixinhaEntrada[] }> {
  const { data, error } = await (await supabaseScoped())
    .from("caixinhas")
    .select("id, valor, criado_em")
    .eq("barbearia_id", barbeariaId)
    .eq("barbeiro_id", barbeiroId)
    .order("criado_em", { ascending: false });
  if (error) throw error;

  const entradas = (data ?? []).map((c) => ({
    id: c.id,
    valor: Number(c.valor),
    criadoEm: c.criado_em,
  }));
  return { total: entradas.reduce((s, c) => s + c.valor, 0), entradas };
}

export interface CaixinhaPorBarbeiro {
  barbeiroId: string;
  nome: string;
  total: number;
}

export async function getCaixinhaGeral(
  barbeariaId: string,
): Promise<{ total: number; porBarbeiro: CaixinhaPorBarbeiro[] }> {
  const { data, error } = await (await supabaseScoped())
    .from("caixinhas")
    .select("valor, barbeiro:usuarios(id, nome)")
    .eq("barbearia_id", barbeariaId);
  if (error) throw error;

  const totais = new Map<string, CaixinhaPorBarbeiro>();
  let total = 0;
  for (const row of data ?? []) {
    const barbeiro = row.barbeiro as unknown as { id: string; nome: string } | null;
    if (!barbeiro) continue;
    const valor = Number(row.valor);
    total += valor;
    const atual = totais.get(barbeiro.id) ?? { barbeiroId: barbeiro.id, nome: barbeiro.nome, total: 0 };
    atual.total += valor;
    totais.set(barbeiro.id, atual);
  }

  return { total, porBarbeiro: Array.from(totais.values()).sort((a, b) => b.total - a.total) };
}

export interface ComissaoPorBarbeiro {
  barbeiroId: string;
  nome: string;
  comissaoPct: number;
  qtdAtendimentos: number;
  baseComissionavel: number;
  valorComissao: number;
}

/**
 * Comissão acumulada por barbeiro, calculada só sobre atendimentos já pagos
 * (fiado pendente ainda não gera comissão) do período em aberto — passar o
 * `desde` de {@link getPeriodoAtual} (início do período atual, ou seja, fim
 * do último fechamento). Sem esse filtro, atendimentos de períodos já
 * fechados voltam a contar aqui, fazendo a comissão parecer "a receber" de
 * novo mesmo depois de já ter sido registrada no fechamento.
 * Quando o preço foi negociado, a base comissionável é ajustada na mesma
 * proporção entre o valor cobrado e o valor originalmente calculado (soma
 * dos itens no momento do registro).
 */
export async function getComissoes(
  barbeariaId: string,
  barbeiroId?: string,
  desde?: string,
): Promise<ComissaoPorBarbeiro[]> {
  // Busca todos os usuários (não só barbeiro) — o dono também pode atender e comissionar sobre si mesmo.
  let barbeirosQuery = (await supabaseScoped())
    .from("usuarios")
    .select("id, nome, comissao_padrao")
    .eq("barbearia_id", barbeariaId);
  if (barbeiroId) barbeirosQuery = barbeirosQuery.eq("id", barbeiroId);

  const [{ data: usuarios, error: errUsuarios }, { data: atendimentos, error: errAtendimentos }] =
    await Promise.all([
      barbeirosQuery,
      (async () => {
        let q = (await supabaseScoped())
          .from("atendimentos")
          .select(
            "barbeiro_id, valor, preco_negociado, atendimento_servicos(preco, comissionavel), atendimento_consumos(preco, quantidade)",
          )
          .eq("barbearia_id", barbeariaId)
          .eq("pago", true);
        if (barbeiroId) q = q.eq("barbeiro_id", barbeiroId);
        if (desde) q = q.gte("criado_em", desde);
        return q;
      })(),
    ]);
  if (errUsuarios) throw errUsuarios;
  if (errAtendimentos) throw errAtendimentos;

  const resultado = new Map<string, ComissaoPorBarbeiro>();
  for (const u of usuarios ?? []) {
    resultado.set(u.id, {
      barbeiroId: u.id,
      nome: u.nome,
      comissaoPct: Number(u.comissao_padrao),
      qtdAtendimentos: 0,
      baseComissionavel: 0,
      valorComissao: 0,
    });
  }

  for (const a of atendimentos ?? []) {
    const acumulado = resultado.get(a.barbeiro_id);
    if (!acumulado) continue;

    const servicos = (a.atendimento_servicos ?? []) as { preco: number; comissionavel: boolean }[];
    const consumos = (a.atendimento_consumos ?? []) as { preco: number; quantidade: number }[];

    const totalServicos = servicos.reduce((s, item) => s + Number(item.preco), 0);
    const totalConsumos = consumos.reduce((s, item) => s + Number(item.preco) * item.quantidade, 0);
    const valorOriginal = totalServicos + totalConsumos;
    const proporcao = a.preco_negociado && valorOriginal > 0 ? Number(a.valor) / valorOriginal : 1;

    const baseServicosComissionaveis = servicos
      .filter((s) => s.comissionavel)
      .reduce((s, item) => s + Number(item.preco), 0);

    acumulado.qtdAtendimentos += 1;
    acumulado.baseComissionavel += baseServicosComissionaveis * proporcao;
    acumulado.valorComissao += (baseServicosComissionaveis * proporcao * acumulado.comissaoPct) / 100;
  }

  return Array.from(resultado.values()).sort((a, b) => b.valorComissao - a.valorComissao);
}

export interface Barbeiro {
  id: string;
  nome: string;
  email: string;
  comissaoPadrao: number;
}

export async function getBarbeiros(barbeariaId: string): Promise<Barbeiro[]> {
  const { data, error } = await (await supabaseScoped())
    .from("usuarios")
    .select("id, nome, email, comissao_padrao")
    .eq("barbearia_id", barbeariaId)
    .eq("papel", "barbeiro")
    .order("nome");
  if (error) throw error;
  return (data ?? []).map((u) => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    comissaoPadrao: Number(u.comissao_padrao),
  }));
}

export interface PeriodoTotais {
  faturamentoTotal: number;
  fiadoPendente: number;
  qtdAtendimentos: number;
  comissaoTotal: number;
  caixinhaTotal: number;
}

export interface PeriodoAtual {
  inicio: string;
  totais: PeriodoTotais;
}

/**
 * Totais do período em aberto: desde o fim do último fechamento (ou desde a
 * criação da barbearia, se nunca fechou) até agora. Não apaga nada — é
 * apenas um recorte por data sobre os atendimentos/caixinhas já existentes.
 *
 * Sem barbeiroId: totais da barbearia inteira (visão do Dono). Com
 * barbeiroId: só os atendimentos/caixinhas daquele barbeiro (visão pessoal
 * do Barbeiro — nunca deve ver o total da barbearia toda).
 */
export async function getPeriodoAtual(
  barbeariaId: string,
  comissaoHabilitada: boolean,
  barbeiroId?: string,
): Promise<PeriodoAtual> {
  const { data: ultimoFechamento } = await (await supabaseScoped())
    .from("fechamentos_semanais")
    .select("semana_fim")
    .eq("barbearia_id", barbeariaId)
    .order("semana_fim", { ascending: false })
    .limit(1)
    .maybeSingle();

  let inicio: string;
  if (ultimoFechamento) {
    inicio = ultimoFechamento.semana_fim;
  } else {
    const { data: barbearia } = await (await supabaseScoped())
      .from("barbearias")
      .select("criado_em")
      .eq("id", barbeariaId)
      .single();
    inicio = barbearia?.criado_em ?? new Date(0).toISOString();
  }

  let atendimentosQuery = (await supabaseScoped())
    .from("atendimentos")
    .select(
      "valor, pago, barbeiro_id, preco_negociado, atendimento_servicos(preco, comissionavel), atendimento_consumos(preco, quantidade)",
    )
    .eq("barbearia_id", barbeariaId)
    .gte("criado_em", inicio);
  if (barbeiroId) atendimentosQuery = atendimentosQuery.eq("barbeiro_id", barbeiroId);
  const { data: atendimentos, error: errAtendimentos } = await atendimentosQuery;
  if (errAtendimentos) throw errAtendimentos;

  let caixinhasQuery = (await supabaseScoped())
    .from("caixinhas")
    .select("valor")
    .eq("barbearia_id", barbeariaId)
    .gte("criado_em", inicio);
  if (barbeiroId) caixinhasQuery = caixinhasQuery.eq("barbeiro_id", barbeiroId);
  const { data: caixinhas, error: errCaixinhas } = await caixinhasQuery;
  if (errCaixinhas) throw errCaixinhas;

  let comissaoPorId = new Map<string, number>();
  if (comissaoHabilitada) {
    const { data: usuarios } = await (await supabaseScoped())
      .from("usuarios")
      .select("id, comissao_padrao")
      .eq("barbearia_id", barbeariaId);
    comissaoPorId = new Map((usuarios ?? []).map((u) => [u.id, Number(u.comissao_padrao)]));
  }

  let faturamentoTotal = 0;
  let fiadoPendente = 0;
  let comissaoTotal = 0;

  for (const a of atendimentos ?? []) {
    const valor = Number(a.valor);
    if (a.pago) faturamentoTotal += valor;
    else fiadoPendente += valor;

    if (comissaoHabilitada && a.pago) {
      const servicos = (a.atendimento_servicos ?? []) as { preco: number; comissionavel: boolean }[];
      const consumos = (a.atendimento_consumos ?? []) as { preco: number; quantidade: number }[];
      const totalServicos = servicos.reduce((s, item) => s + Number(item.preco), 0);
      const totalConsumos = consumos.reduce((s, item) => s + Number(item.preco) * item.quantidade, 0);
      const valorOriginal = totalServicos + totalConsumos;
      const proporcao = a.preco_negociado && valorOriginal > 0 ? valor / valorOriginal : 1;
      const baseComissionavel =
        servicos.filter((s) => s.comissionavel).reduce((s, item) => s + Number(item.preco), 0) * proporcao;
      const pct = comissaoPorId.get(a.barbeiro_id) ?? 0;
      comissaoTotal += (baseComissionavel * pct) / 100;
    }
  }

  const caixinhaTotal = (caixinhas ?? []).reduce((s, c) => s + Number(c.valor), 0);

  return {
    inicio,
    totais: {
      faturamentoTotal,
      fiadoPendente,
      qtdAtendimentos: (atendimentos ?? []).length,
      comissaoTotal,
      caixinhaTotal,
    },
  };
}

export interface FechamentoHistorico {
  id: string;
  semanaInicio: string;
  semanaFim: string;
  totais: PeriodoTotais;
}

export async function getHistoricoFechamentos(barbeariaId: string): Promise<FechamentoHistorico[]> {
  const { data, error } = await (await supabaseScoped())
    .from("fechamentos_semanais")
    .select("id, semana_inicio, semana_fim, totais")
    .eq("barbearia_id", barbeariaId)
    .order("semana_fim", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((f) => ({
    id: f.id,
    semanaInicio: f.semana_inicio,
    semanaFim: f.semana_fim,
    totais: f.totais as PeriodoTotais,
  }));
}

export interface PreferenciasTema {
  temaCor: TemaCor;
}

/**
 * Preferência de tema é por usuário, não por barbearia — por isso busca por
 * id do usuário, não fica no JWT (evitaria refletir a troca até o próximo
 * login) e é lida fresca a cada render do layout raiz, igual a
 * getConfiguracoes já faz pras flags do negócio.
 */
export const getPreferenciasTema = cache(async function getPreferenciasTema(
  userId: string,
): Promise<PreferenciasTema> {
  const { data, error } = await (await supabaseScoped())
    .from("usuarios")
    .select("tema_cor")
    .eq("id", userId)
    .single();
  if (error || !data) return TEMA_PADRAO;

  return { temaCor: data.tema_cor as TemaCor };
});

/**
 * Retorna null quando a barbearia ainda não passou pelo onboarding
 * (nenhuma linha em barbearia_configuracoes).
 */
export const getConfiguracoes = cache(async function getConfiguracoes(
  barbeariaId: string,
): Promise<BarbeariaConfiguracoes | null> {
  const { data, error } = await (await supabaseScoped())
    .from("barbearia_configuracoes")
    .select(
      "fiado_habilitado, caixinha_habilitada, comissao_habilitada, comissao_padrao_pct, controle_estoque_habilitado, gestao_equipe_habilitada, periodicidade_fechamento, dia_inicio_periodo",
    )
    .eq("barbearia_id", barbeariaId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    fiadoHabilitado: data.fiado_habilitado,
    caixinhaHabilitada: data.caixinha_habilitada,
    comissaoHabilitada: data.comissao_habilitada,
    comissaoPadraoPct: Number(data.comissao_padrao_pct),
    controleEstoqueHabilitado: data.controle_estoque_habilitado,
    gestaoEquipeHabilitada: data.gestao_equipe_habilitada,
    periodicidadeFechamento: data.periodicidade_fechamento,
    diaInicioPeriodo: data.dia_inicio_periodo,
  };
});

export interface AcaoPropostaSuporte {
  acao: "ajustar_comissao_barbeiro" | "alternar_recurso" | "marcar_fiado_pago";
  params: Record<string, unknown>;
  descricao: string;
}

export interface MensagemTicketSuporte {
  id: string;
  remetente: "usuario" | "ia" | "admin";
  conteudo: string;
  acaoProposta: AcaoPropostaSuporte | null;
  acaoExecutada: boolean;
  criadoEm: string;
}

export interface TicketSuporte {
  id: string;
  status: "aberto" | "aguardando_admin" | "resolvido" | "recusado" | "fechado";
}

/**
 * Ticket de suporte mais recente ainda "vivo" (não fechado/recusado) de
 * quem pediu — o chat sempre continua a mesma conversa em vez de perder o
 * fio a cada visita, até alguém encerrar de propósito.
 */
export async function getTicketAtual(
  barbeariaId: string,
  usuarioId: string,
): Promise<{ ticket: TicketSuporte; mensagens: MensagemTicketSuporte[] } | null> {
  const { data: ticket, error } = await (await supabaseScoped())
    .from("suporte_tickets")
    .select("id, status")
    .eq("barbearia_id", barbeariaId)
    .eq("aberto_por", usuarioId)
    .not("status", "in", "(fechado,recusado)")
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!ticket) return null;

  const { data: mensagens, error: errMensagens } = await (await supabaseScoped())
    .from("suporte_mensagens")
    .select("id, remetente, conteudo, acao_proposta, acao_executada, criado_em")
    .eq("ticket_id", ticket.id)
    .order("criado_em", { ascending: true });
  if (errMensagens) throw errMensagens;

  return {
    ticket,
    mensagens: (mensagens ?? []).map((m) => ({
      id: m.id,
      remetente: m.remetente,
      conteudo: m.conteudo,
      acaoProposta: m.acao_proposta,
      acaoExecutada: m.acao_executada,
      criadoEm: m.criado_em,
    })),
  };
}
