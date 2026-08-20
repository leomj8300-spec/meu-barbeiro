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

export interface BarbeariaConfiguracoes {
  fiadoHabilitado: boolean;
  caixinhaHabilitada: boolean;
  comissaoHabilitada: boolean;
  comissaoPadraoPct: number;
  controleEstoqueHabilitado: boolean;
  gestaoEquipeHabilitada: boolean;
  periodicidadeFechamento: PeriodicidadeFechamento;
  diaInicioPeriodo: number;
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
};
