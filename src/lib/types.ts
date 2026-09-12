export type Papel = "dono" | "barbeiro";

export interface Usuario {
  id: string;
  barbearia_id: string;
  nome: string;
  email: string;
  papel: Papel;
  comissao_padrao: number;
}

export type PeriodicidadeFechamento = "semanal" | "quinzenal" | "mensal";

/**
 * Como a barbearia atende. São exclusivos: marcando hora, todo atendimento
 * nasce de um agendamento (inclusive o encaixe de quem chega sem marcar).
 */
export type ModoAtendimento = "ordem_chegada" | "agendamento";

export interface BarbeariaConfiguracoes {
  fiadoHabilitado: boolean;
  caixinhaHabilitada: boolean;
  comissaoHabilitada: boolean;
  comissaoPadraoPct: number;
  controleEstoqueHabilitado: boolean;
  gestaoEquipeHabilitada: boolean;
  periodicidadeFechamento: PeriodicidadeFechamento;
  diaInicioPeriodo: number;
  modoAtendimento: ModoAtendimento;
  /** "09:00" — hora local da barbearia. */
  horaAbertura: string;
  horaFechamento: string;
  /** 1=segunda .. 7=domingo */
  diasFuncionamento: number[];
  /** Publica a agenda pra o cliente marcar sozinho, sem ligar. */
  agendamentoOnlineHabilitado: boolean;
  /** Dias sem aparecer pra o cliente entrar na lista de quem sumiu. */
  diasParaRetorno: number;
}

export const CONFIGURACOES_PADRAO: BarbeariaConfiguracoes = {
  fiadoHabilitado: true,
  caixinhaHabilitada: true,
  comissaoHabilitada: false,
  comissaoPadraoPct: 0,
  controleEstoqueHabilitado: true,
  gestaoEquipeHabilitada: false,
  periodicidadeFechamento: "semanal",
  diaInicioPeriodo: 1,
  modoAtendimento: "ordem_chegada",
  horaAbertura: "09:00",
  horaFechamento: "19:00",
  diasFuncionamento: [1, 2, 3, 4, 5, 6],
  agendamentoOnlineHabilitado: false,
  diasParaRetorno: 30,
};
