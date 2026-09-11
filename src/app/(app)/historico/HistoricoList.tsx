"use client";

import { useMemo, useState } from "react";
import { IconSearch } from "@/components/icons";
import { fmtMoeda as fmt, fmtHora, chaveDia, rotuloDia } from "@/lib/formato";
import type { AtendimentoHistorico } from "@/lib/queries";

const FILTROS = ["Todos", "Pagos", "Fiado"] as const;
type Filtro = (typeof FILTROS)[number];

export function HistoricoList({
  atendimentos,
  vePorBarbeiro,
}: {
  atendimentos: AtendimentoHistorico[];
  vePorBarbeiro: boolean;
}) {
  const [filtro, setFiltro] = useState<Filtro>("Todos");
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    return atendimentos.filter((a) => {
      if (filtro === "Pagos" && !a.pago) return false;
      if (filtro === "Fiado" && a.pago) return false;
      if (busca.trim() && !a.cliente.toLowerCase().includes(busca.trim().toLowerCase())) return false;
      return true;
    });
  }, [atendimentos, filtro, busca]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, { rotulo: string; itens: AtendimentoHistorico[] }>();
    for (const a of filtrados) {
      const chave = chaveDia(a.criadoEm);
      if (!mapa.has(chave)) mapa.set(chave, { rotulo: rotuloDia(a.criadoEm), itens: [] });
      mapa.get(chave)!.itens.push(a);
    }
    return Array.from(mapa.values());
  }, [filtrados]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 flex-wrap">
        {FILTROS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            className={`chip ${filtro === f ? "chip-on" : "chip-off"}`}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 rounded-full border border-border bg-panel h-8 px-3 min-w-0">
          <IconSearch className="w-3.5 h-3.5 text-text-dim shrink-0" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar"
            className="w-20 min-w-0 bg-transparent text-text text-[12.5px] focus:outline-none"
          />
        </div>
      </div>

      {grupos.length === 0 && (
        <p className="text-text-dim text-sm text-center py-8">Nenhum atendimento encontrado.</p>
      )}

      <div className="flex flex-col gap-5">
        {grupos.map((g) => {
          const subtotal = g.itens.reduce((s, a) => s + a.valor, 0);
          return (
            <div key={g.rotulo} className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim shrink-0">
                  {g.rotulo}
                </span>
                <span className="flex-1 h-px bg-border" />
                <span className="font-mono text-[12px] text-text shrink-0">{fmt(subtotal)}</span>
              </div>

              {g.itens.map((a) => (
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
                      {fmtHora(a.criadoEm)}
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
        })}
      </div>
    </div>
  );
}
