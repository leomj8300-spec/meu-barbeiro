"use client";

import type { AtendimentoHistorico } from "@/lib/queries";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoricoList({
  atendimentos,
  vePorBarbeiro,
}: {
  atendimentos: AtendimentoHistorico[];
  vePorBarbeiro: boolean;
}) {
  if (atendimentos.length === 0) {
    return <p className="text-text-dim text-sm text-center py-8">Nenhum atendimento registrado ainda.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {atendimentos.map((a) => (
        <div
          key={a.id}
          className="flex items-center justify-between gap-2 rounded-[10px] border border-border bg-panel-2 px-3 py-2.5 flex-wrap"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[13.5px] font-semibold">{a.cliente}</span>
              <span
                className={`rounded-full text-[9.5px] font-bold uppercase px-1.5 py-0.5 ${
                  a.pago ? "bg-cons/15 text-cons" : "bg-warn/15 text-warn"
                }`}
              >
                {a.pago ? "Pago" : "Fiado"}
              </span>
            </div>
            <p className="font-mono text-[11px] text-text-dim mt-0.5">
              {fmtData(a.criadoEm)}
              {vePorBarbeiro && ` · ${a.barbeiroNome}`}
            </p>
            {(a.servicos.length > 0 || a.consumos.length > 0) && (
              <div className="mt-1 flex flex-wrap gap-1">
                {a.servicos.map((s, i) => (
                  <span
                    key={`s-${i}`}
                    className="inline-block rounded-full bg-serv/15 text-serv text-[10px] font-semibold px-2 py-0.5"
                  >
                    {s}
                  </span>
                ))}
                {a.consumos.map((c, i) => (
                  <span
                    key={`c-${i}`}
                    className="inline-block rounded-full bg-cons/15 text-cons text-[10px] font-semibold px-2 py-0.5"
                  >
                    {c.nome} x{c.quantidade}
                  </span>
                ))}
              </div>
            )}
          </div>
          <span className="font-mono text-sm font-bold text-accent-label shrink-0">{fmt(a.valor)}</span>
        </div>
      ))}
    </div>
  );
}
