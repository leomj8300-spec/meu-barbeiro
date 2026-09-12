import { supabaseAdmin } from "@/lib/supabase/server";
import type { JanelaOcupada } from "@/lib/horarios";

/**
 * Leitura da página pública de agendamento.
 *
 * Roda sem sessão, então usa a chave de serviço (que ignora RLS) — igual o
 * login e o painel admin já fazem. Por isso cada função aqui é deliberadamente
 * estreita: devolve só o que pode aparecer na internet (nome da barbearia,
 * serviços, quem atende e quais horários estão ocupados) e nunca nome de
 * cliente, telefone de terceiro ou valor de caixa.
 *
 * Toda consulta é presa ao barbearia_id resolvido a partir do subdomínio da
 * URL — nunca a um id vindo do navegador.
 */

export interface ServicoPublico {
  id: string;
  nome: string;
  preco: number;
  duracaoMin: number;
}

export interface BarbeariaPublica {
  id: string;
  nome: string;
  horaAbertura: string;
  horaFechamento: string;
  diasFuncionamento: number[];
  servicos: ServicoPublico[];
  atendentes: { id: string; nome: string }[];
}

/**
 * Null quando a barbearia não existe, não atende por agendamento ou não
 * publicou a agenda — os três casos viram a mesma página de "indisponível",
 * pra não servir de sonda pra descobrir quais subdomínios existem.
 */
export async function getBarbeariaPublica(
  subdominio: string,
): Promise<BarbeariaPublica | null> {
  const db = supabaseAdmin();

  const { data: barbearia } = await db
    .from("barbearias")
    .select("id, nome")
    .eq("subdominio", subdominio)
    .maybeSingle();
  if (!barbearia) return null;

  const { data: config } = await db
    .from("barbearia_configuracoes")
    .select(
      "modo_atendimento, agendamento_online_habilitado, hora_abertura, hora_fechamento, dias_funcionamento",
    )
    .eq("barbearia_id", barbearia.id)
    .maybeSingle();

  if (
    !config ||
    config.modo_atendimento !== "agendamento" ||
    !config.agendamento_online_habilitado
  ) {
    return null;
  }

  const [{ data: servicos }, { data: atendentes }] = await Promise.all([
    db
      .from("servicos")
      .select("id, nome, preco, duracao_min")
      .eq("barbearia_id", barbearia.id)
      .order("nome"),
    db
      .from("usuarios")
      .select("id, nome")
      .eq("barbearia_id", barbearia.id)
      .order("nome"),
  ]);

  return {
    id: barbearia.id,
    nome: barbearia.nome,
    horaAbertura: String(config.hora_abertura).slice(0, 5),
    horaFechamento: String(config.hora_fechamento).slice(0, 5),
    diasFuncionamento: config.dias_funcionamento,
    servicos: (servicos ?? []).map((s) => ({
      id: s.id,
      nome: s.nome,
      preco: Number(s.preco),
      duracaoMin: s.duracao_min,
    })),
    atendentes: atendentes ?? [],
  };
}

/**
 * Só as janelas ocupadas do dia — quem está nelas não é da conta de quem está
 * marcando. Cancelado e falta não ocupam a cadeira.
 */
export async function getJanelasOcupadas(
  barbeariaId: string,
  dia: string,
): Promise<JanelaOcupada[]> {
  const inicioDia = new Date(`${dia}T00:00:00-03:00`).toISOString();
  const fimDia = new Date(`${dia}T23:59:59.999-03:00`).toISOString();

  const { data } = await supabaseAdmin()
    .from("agendamentos")
    .select("barbeiro_id, inicio, duracao_min")
    .eq("barbearia_id", barbeariaId)
    .in("status", ["marcado", "atendido"])
    .gte("inicio", inicioDia)
    .lte("inicio", fimDia);

  return (data ?? []).map((a) => {
    const inicioMs = new Date(a.inicio).getTime();
    return {
      barbeiroId: a.barbeiro_id,
      inicioMs,
      fimMs: inicioMs + a.duracao_min * 60000,
    };
  });
}
