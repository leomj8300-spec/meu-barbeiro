"use client";

import { useState, useTransition } from "react";
import { fecharPeriodoAction } from "@/app/actions/fechamento";
import type { PeriodoAtual, FechamentoHistorico } from "@/lib/queries";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function FechamentoView({
  periodoAtual,
  historico,
  comissaoHabilitada,
  caixinhaHabilitada,
}: {
  periodoAtual: PeriodoAtual;
  historico: FechamentoHistorico[];
  comissaoHabilitada: boolean;
  caixinhaHabilitada: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { totais } = periodoAtual;

  function fechar() {
    if (
      !confirm(
        "Fechar o período atual? Os totais serão salvos no histórico e um novo período começa agora. Nenhum atendimento é apagado.",
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const res = await fecharPeriodoAction();
      if (res.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 rounded-[10px]">
          {error}
        </div>
      )}

      <div className="panel-accent p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim mb-1">
          Período atual · desde {fmtData(periodoAtual.inicio)}
        </p>
        <p className="font-mono text-3xl font-bold text-accent-label mb-3">{fmt(totais.faturamentoTotal)}</p>

        <div className="grid grid-cols-2 gap-2 text-[12.5px]">
          <div className="rounded-[10px] bg-panel-2 border border-border px-2.5 py-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">Atendimentos</p>
            <p className="font-mono font-bold">{totais.qtdAtendimentos}</p>
          </div>
          <div className="rounded-[10px] bg-panel-2 border border-border px-2.5 py-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">Fiado pendente</p>
            <p className="font-mono font-bold text-warn">{fmt(totais.fiadoPendente)}</p>
          </div>
          {comissaoHabilitada && (
            <div className="rounded-[10px] bg-panel-2 border border-border px-2.5 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">Comissão</p>
              <p className="font-mono font-bold">{fmt(totais.comissaoTotal)}</p>
            </div>
          )}
          {caixinhaHabilitada && (
            <div className="rounded-[10px] bg-panel-2 border border-border px-2.5 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">Caixinha</p>
              <p className="font-mono font-bold">{fmt(totais.caixinhaTotal)}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={fechar}
          disabled={pending}
          className="btn-primary w-full mt-4 py-3"
        >
          {pending ? "Fechando..." : "Fechar período atual"}
        </button>
      </div>

      <div className="panel p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold mb-2.5">
          Histórico de fechamentos
        </p>
        {historico.length === 0 && (
          <p className="text-text-dim text-xs">Nenhum fechamento registrado ainda.</p>
        )}
        <div className="flex flex-col gap-1.5">
          {historico.map((f) => (
            <div key={f.id} className="rounded-[10px] bg-panel-2 border border-border px-2.5 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] text-text-dim">
                  {fmtData(f.semanaInicio)} — {fmtData(f.semanaFim)}
                </span>
                <span className="font-mono text-sm font-bold text-accent-label">
                  {fmt(f.totais.faturamentoTotal)}
                </span>
              </div>
              <p className="text-[11px] text-text-dim mt-0.5">
                {f.totais.qtdAtendimentos} atendimentos
                {comissaoHabilitada && ` · comissão ${fmt(f.totais.comissaoTotal)}`}
                {caixinhaHabilitada && ` · caixinha ${fmt(f.totais.caixinhaTotal)}`}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
