import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Leituras entre tenants pro super-admin e pro login por caminho
 * (/b/[subdominio]/login, antes de existir sessão). Usa supabaseAdmin()
 * (chave de serviço) de propósito — src/lib/queries.ts é só leitura escopada
 * por tenant via supabaseScoped(), misturar quebraria essa garantia.
 */

export async function getBarbeariaPorSubdominio(
  subdominio: string,
): Promise<{ id: string; nome: string } | null> {
  const { data, error } = await supabaseAdmin()
    .from("barbearias")
    .select("id, nome")
    .eq("subdominio", subdominio)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export interface BarbeariaResumo {
  id: string;
  nome: string;
  subdominio: string;
  criadoEm: string;
  donoNome: string | null;
  donoEmail: string | null;
}

export async function listarBarbearias(): Promise<BarbeariaResumo[]> {
  const { data, error } = await supabaseAdmin()
    .from("barbearias")
    .select("id, nome, subdominio, criado_em, usuarios(nome, email, papel)")
    .order("criado_em", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((b) => {
    const usuarios = (b.usuarios ?? []) as { nome: string; email: string; papel: string }[];
    const dono = usuarios.find((u) => u.papel === "dono");
    return {
      id: b.id,
      nome: b.nome,
      subdominio: b.subdominio,
      criadoEm: b.criado_em,
      donoNome: dono?.nome ?? null,
      donoEmail: dono?.email ?? null,
    };
  });
}

export interface EstatisticasGerais {
  totalBarbearias: number;
  totalBarbeiros: number;
}

export interface TicketAdminResumo {
  id: string;
  barbeariaNome: string;
  abertoPorNome: string;
  status: string;
  resumo: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export async function listarTicketsSuporte(): Promise<TicketAdminResumo[]> {
  const { data, error } = await supabaseAdmin()
    .from("suporte_tickets")
    .select(
      "id, status, resumo, criado_em, atualizado_em, barbearia:barbearias(nome), usuario:usuarios(nome)",
    )
    .order("atualizado_em", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((t) => {
    const barbearia = t.barbearia as unknown as { nome: string } | null;
    const usuario = t.usuario as unknown as { nome: string } | null;
    return {
      id: t.id,
      barbeariaNome: barbearia?.nome ?? "—",
      abertoPorNome: usuario?.nome ?? "—",
      status: t.status,
      resumo: t.resumo,
      criadoEm: t.criado_em,
      atualizadoEm: t.atualizado_em,
    };
  });
}

export interface MensagemTicketAdmin {
  id: string;
  remetente: string;
  conteudo: string;
  acaoProposta: unknown;
  acaoExecutada: boolean;
  criadoEm: string;
}

export interface TicketAdminDetalhe extends TicketAdminResumo {
  abertoPorPapel: string;
  mensagens: MensagemTicketAdmin[];
}

export async function getTicketDetalhe(ticketId: string): Promise<TicketAdminDetalhe | null> {
  const db = supabaseAdmin();

  const { data: ticket, error } = await db
    .from("suporte_tickets")
    .select(
      "id, status, resumo, criado_em, atualizado_em, barbearia:barbearias(nome), usuario:usuarios(nome, papel)",
    )
    .eq("id", ticketId)
    .maybeSingle();
  if (error || !ticket) return null;

  const { data: mensagens } = await db
    .from("suporte_mensagens")
    .select("id, remetente, conteudo, acao_proposta, acao_executada, criado_em")
    .eq("ticket_id", ticketId)
    .order("criado_em", { ascending: true });

  const barbearia = ticket.barbearia as unknown as { nome: string } | null;
  const usuario = ticket.usuario as unknown as { nome: string; papel: string } | null;

  return {
    id: ticket.id,
    status: ticket.status,
    resumo: ticket.resumo,
    criadoEm: ticket.criado_em,
    atualizadoEm: ticket.atualizado_em,
    barbeariaNome: barbearia?.nome ?? "—",
    abertoPorNome: usuario?.nome ?? "—",
    abertoPorPapel: usuario?.papel ?? "—",
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

export async function getEstatisticasGerais(): Promise<EstatisticasGerais> {
  const db = supabaseAdmin();
  const [barbeariasRes, barbeirosRes] = await Promise.all([
    db.from("barbearias").select("id", { count: "exact", head: true }),
    db.from("usuarios").select("id", { count: "exact", head: true }).eq("papel", "barbeiro"),
  ]);

  // Se a contagem falhar (timeout, erro de rede etc.), `count` vem null —
  // não podemos deixar isso virar "0" na tela: 0 parece um dado real e
  // esconderia a falha do dono, que passaria a achar que não tem barbeiro
  // nenhum cadastrado quando na verdade é só a consulta que não respondeu.
  if (barbeariasRes.error) throw barbeariasRes.error;
  if (barbeirosRes.error) throw barbeirosRes.error;

  return {
    totalBarbearias: barbeariasRes.count ?? 0,
    totalBarbeiros: barbeirosRes.count ?? 0,
  };
}
