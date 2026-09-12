/**
 * Cálculo dos horários livres da barbearia.
 *
 * Regras de negócio em um lugar só, sem tocar em banco — assim dá pra usar
 * tanto na página pública quanto (no futuro) na agenda interna, e raciocinar
 * sobre elas sem subir servidor.
 */

/** De quanto em quanto tempo um horário pode começar. */
export const PASSO_MIN = 15;

/** Não dá pra marcar pra daqui a 5 minutos: o cliente não chega a tempo. */
export const ANTECEDENCIA_MIN = 30;

/** Até quando dá pra marcar pra frente. */
export const DIAS_A_FRENTE = 30;

/** Perto demais da hora, desmarcar não ajuda ninguém — o buraco fica lá. */
export const HORAS_PARA_DESMARCAR = 2;

/** Quantos horários futuros o mesmo telefone pode ter em aberto. */
export const LIMITE_POR_TELEFONE = 3;

export function minutosDoDia(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export function horaDeMinutos(min: number) {
  const h = Math.floor(min / 60);
  return `${String(h).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

/** 1=segunda .. 7=domingo, a partir de "2026-09-11". */
export function diaDaSemana(dia: string) {
  const [ano, mes, d] = dia.split("-").map(Number);
  const js = new Date(Date.UTC(ano, mes - 1, d)).getUTCDay(); // 0=domingo
  return js === 0 ? 7 : js;
}

/**
 * O instante em que um horário local da barbearia acontece. -03:00 fixo
 * porque o Brasil não tem horário de verão desde 2019, e é o mesmo fuso que
 * src/lib/formato.ts usa pra exibir.
 */
export function instante(dia: string, hora: string) {
  return new Date(`${dia}T${hora}:00-03:00`);
}

export function somarDias(chave: string, dias: number) {
  const [ano, mes, dia] = chave.split("-").map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export interface JanelaOcupada {
  barbeiroId: string;
  inicioMs: number;
  fimMs: number;
}

/**
 * Devolve os horários em que um serviço de `duracaoMin` cabe, considerando o
 * expediente, o que já está marcado e a antecedência mínima.
 *
 * Um horário entra na lista se PELO MENOS UM dos barbeiros elegíveis estiver
 * livre nele — é isso que permite o cliente escolher "tanto faz quem atende"
 * e ainda assim só ver horário que existe de verdade.
 */
export function horariosLivres({
  dia,
  duracaoMin,
  horaAbertura,
  horaFechamento,
  diasFuncionamento,
  barbeirosElegiveis,
  ocupados,
  agora = new Date(),
}: {
  dia: string;
  duracaoMin: number;
  horaAbertura: string;
  horaFechamento: string;
  diasFuncionamento: number[];
  barbeirosElegiveis: string[];
  ocupados: JanelaOcupada[];
  agora?: Date;
}): string[] {
  if (duracaoMin <= 0 || barbeirosElegiveis.length === 0) return [];
  if (!diasFuncionamento.includes(diaDaSemana(dia))) return [];

  const abre = minutosDoDia(horaAbertura);
  const fecha = minutosDoDia(horaFechamento);
  const minimo = agora.getTime() + ANTECEDENCIA_MIN * 60000;

  const livres: string[] = [];

  for (let inicio = abre; inicio + duracaoMin <= fecha; inicio += PASSO_MIN) {
    const hora = horaDeMinutos(inicio);
    const comecaMs = instante(dia, hora).getTime();
    if (comecaMs < minimo) continue;

    const terminaMs = comecaMs + duracaoMin * 60000;
    const alguemLivre = barbeirosElegiveis.some((barbeiroId) =>
      ocupados.every(
        (o) =>
          o.barbeiroId !== barbeiroId || comecaMs >= o.fimMs || terminaMs <= o.inicioMs,
      ),
    );
    if (alguemLivre) livres.push(hora);
  }

  return livres;
}

/** Qual barbeiro atende esse horário — o primeiro elegível que estiver livre. */
export function primeiroBarbeiroLivre({
  dia,
  hora,
  duracaoMin,
  barbeirosElegiveis,
  ocupados,
}: {
  dia: string;
  hora: string;
  duracaoMin: number;
  barbeirosElegiveis: string[];
  ocupados: JanelaOcupada[];
}): string | null {
  const comecaMs = instante(dia, hora).getTime();
  const terminaMs = comecaMs + duracaoMin * 60000;

  return (
    barbeirosElegiveis.find((barbeiroId) =>
      ocupados.every(
        (o) =>
          o.barbeiroId !== barbeiroId || comecaMs >= o.fimMs || terminaMs <= o.inicioMs,
      ),
    ) ?? null
  );
}
