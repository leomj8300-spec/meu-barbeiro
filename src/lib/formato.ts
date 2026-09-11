/**
 * Formatação de dinheiro e de data/hora.
 *
 * O fuso é fixo de propósito. Componentes de lista são renderizados no
 * servidor (Vercel, UTC) e depois hidratados no celular (UTC−3): sem fixar,
 * o mesmo horário virava "14:16" no HTML e "11:16" na tela, o React
 * descartava a lista inteira e remontava no cliente, piscando a hora errada.
 * Fixando em São Paulo, os dois lados escrevem o mesmo texto — e é a hora da
 * barbearia, que é a que importa pra quem está no balcão.
 */

const FUSO = "America/Sao_Paulo";

const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

export function fmtMoeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** 14:30 */
export function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    timeZone: FUSO,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 11/09/2026 */
export function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** 11/09, 14:30 */
export function fmtDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Dia do calendário em São Paulo, como "2026-09-11" — serve de chave de agrupamento. */
export function chaveDia(data: string | Date) {
  // en-CA formata como YYYY-MM-DD, que ordena e compara como texto.
  return new Date(data).toLocaleDateString("en-CA", { timeZone: FUSO });
}

/** Aritmética sobre a chave de dia (não sobre instante), então não escorrega de fuso. */
function somarDias(chave: string, dias: number) {
  const [ano, mes, dia] = chave.split("-").map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** "Hoje · 11 SET", "Ontem · 10 SET" ou "09 SET". */
export function rotuloDia(data: string | Date) {
  const chave = chaveDia(data);
  const [, mes, dia] = chave.split("-");
  const rotulo = `${dia} ${MESES[Number(mes) - 1]}`;
  const hoje = chaveDia(new Date());
  if (chave === hoje) return `Hoje · ${rotulo}`;
  if (chave === somarDias(hoje, -1)) return `Ontem · ${rotulo}`;
  return rotulo;
}

/** "hoje", "1 dia", "12 dias" — contados em dias de calendário, não em 24h corridas. */
export function diasDesde(iso: string) {
  const de = chaveDia(iso);
  const ate = chaveDia(new Date());
  const dias = Math.max(
    0,
    Math.round((Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / 86400000),
  );
  if (dias === 0) return "hoje";
  return dias === 1 ? "1 dia" : `${dias} dias`;
}
