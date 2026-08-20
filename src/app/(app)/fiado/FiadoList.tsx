"use client";

import { useMemo, useState, useTransition } from "react";
import { marcarComoPagoAction, marcarClienteComoPagoAction } from "@/app/actions/fiado";
import type { AtendimentoPendente } from "@/lib/queries";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function FiadoList({
  pendentes,
  vePorBarbeiro,
}: {
  pendentes: AtendimentoPendente[];
  vePorBarbeiro: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [abertos, setAbertos] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const grupos = useMemo(() => {
    const mapa = new Map<string, AtendimentoPendente[]>();
    for (const a of pendentes) {
      const chave = a.cliente.trim().toLowerCase();
      if (!mapa.has(chave)) mapa.set(chave, []);
      mapa.get(chave)!.push(a);
    }
    return Array.from(mapa.entries()).map(([chave, itens]) => ({
      chave,
      nome: itens[0].cliente,
      itens,
      total: itens.reduce((s, a) => s + a.valor, 0),
    }));
  }, [pendentes]);

  const totalPendente = pendentes.reduce((s, a) => s + a.valor, 0);

  function toggle(chave: string) {
    setAbertos((prev) => {
      const next = new Set(prev);
      if (next.has(chave)) next.delete(chave);
      else next.add(chave);
      return next;
    });
  }

  function marcarUm(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await marcarComoPagoAction(id);
      if (res.error) setError(res.error);
    });
  }

  function marcarCliente(nome: string) {
    if (!confirm(`Confirmar que todos os fiados de "${nome}" foram pagos?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await marcarClienteComoPagoAction(nome);
      if (res.error) setError(res.error);
    });
  }

  return (
    <div>
      {error && (
        <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 mb-3 rounded-[10px]">
          {error}
        </div>
      )}

      <div className="panel-ink px-4 py-4 mb-5 flex flex-col gap-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-text-dim">
          Em aberto
        </span>
        <span className="font-mono text-[30px] font-semibold leading-none">{fmt(totalPendente)}</span>
        <div className="flex items-center gap-2">
          <span className="w-[7px] h-[7px] rounded-full bg-accent" />
          <span className="font-mono text-[11px] text-ink-text-dim">
            {grupos.length} {grupos.length === 1 ? "cliente" : "clientes"} em aberto
          </span>
        </div>
      </div>

      {grupos.length === 0 && (
        <p className="text-text-dim text-sm text-center py-8">Nenhum fiado pendente.</p>
      )}

      <div className="flex flex-col gap-2">
        {grupos.map((g) => {
          const aberto = abertos.has(g.chave);
          return (
            <div key={g.chave} className="panel overflow-hidden">
              <div
                onClick={() => toggle(g.chave)}
                className="flex items-center justify-between gap-2 px-4 py-3 cursor-pointer flex-wrap"
              >
                <div className="min-w-0">
                  <span className="text-[15px] font-medium">{g.nome}</span>
                  {g.itens.length > 1 && (
                    <span className="chip chip-off ml-1.5 !py-0.5 !px-2 text-[10.5px] font-semibold align-middle">
                      x{g.itens.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-semibold text-warn">{fmt(g.total)}</span>
                  <span className="text-text-dim text-[11px]">{aberto ? "▲" : "▼"}</span>
                </div>
              </div>

              {aberto && (
                <div className="border-t border-border px-4 py-3 flex flex-col gap-2">
                  {g.itens.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-2 bg-panel-2 border border-border rounded-[10px] px-3 py-2.5 flex-wrap"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] text-text-dim">
                          {fmtData(a.criadoEm)}
                          {vePorBarbeiro && ` · ${a.barbeiroNome}`}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {a.servicos.map((s, i) => (
                            <span key={i} className="inline-block rounded-full bg-serv/15 text-serv text-[10px] font-semibold px-2 py-0.5">
                              {s}
                            </span>
                          ))}
                          {a.consumos.map((c, i) => (
                            <span key={i} className="inline-block rounded-full bg-cons/15 text-cons text-[10px] font-semibold px-2 py-0.5">
                              {c.nome} x{c.quantidade}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-xs font-semibold text-warn">{fmt(a.valor)}</span>
                        <button
                          type="button"
                          onClick={() => marcarUm(a.id)}
                          disabled={pending}
                          className="rounded-[10px] border border-cons/50 bg-cons/10 text-cons text-[11px] font-semibold px-2.5 py-1.5 disabled:opacity-40"
                        >
                          Marcar como pago
                        </button>
                      </div>
                    </div>
                  ))}
                  {g.itens.length > 1 && (
                    <button
                      type="button"
                      onClick={() => marcarCliente(g.nome)}
                      disabled={pending}
                      className="self-end rounded-[10px] border border-cons bg-cons/15 text-cons text-[11px] font-semibold px-3 py-1.5 disabled:opacity-40"
                    >
                      Marcar todos como pago
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
