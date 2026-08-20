"use client";

import { useState, useTransition } from "react";
import {
  registrarCaixinhaAction,
  zerarMinhaCaixinhaAction,
  zerarCaixinhaTudoAction,
} from "@/app/actions/caixinha";
import type { CaixinhaEntrada, CaixinhaPorBarbeiro } from "@/lib/queries";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function CaixinhaView({
  minha,
  geral,
}: {
  minha: { total: number; entradas: CaixinhaEntrada[] };
  geral: { total: number; porBarbeiro: CaixinhaPorBarbeiro[] } | null;
}) {
  const [valor, setValor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function adicionar() {
    setError(null);
    const v = Number(valor);
    if (!Number.isFinite(v) || v <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    startTransition(async () => {
      const res = await registrarCaixinhaAction(v);
      if (res.error) setError(res.error);
      else setValor("");
    });
  }

  function zerarMinha() {
    if (!confirm("Zerar sua caixinha? Isso apaga o histórico de gorjetas.")) return;
    setError(null);
    startTransition(async () => {
      const res = await zerarMinhaCaixinhaAction();
      if (res.error) setError(res.error);
    });
  }

  function zerarTudo() {
    if (!confirm("Zerar a caixinha de TODOS os barbeiros? Isso apaga o histórico de todo mundo.")) return;
    setError(null);
    startTransition(async () => {
      const res = await zerarCaixinhaTudoAction();
      if (res.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2">
          {error}
        </div>
      )}

      <div className="panel p-5 text-center">
        <p className="text-[11px] uppercase tracking-wide text-text-dim">Minha caixinha</p>
        <p className="font-mono text-3xl font-bold text-accent mt-1">{fmt(minha.total)}</p>
      </div>

      <div className="panel p-4">
        <p className="text-xs text-text-dim mb-2">Registrar gorjeta</p>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Valor"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="flex-1 bg-panel-2 border border-border text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={adicionar}
            disabled={pending}
            className="btn-primary cut-tr shrink-0"
          >
            Adicionar
          </button>
        </div>
      </div>

      {minha.entradas.length > 0 && (
        <div className="panel p-4">
          <p className="text-xs uppercase tracking-wide text-text-dim mb-2.5">Histórico</p>
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
            {minha.entradas.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between bg-panel-2 border border-border px-2.5 py-1.5"
              >
                <span className="text-[11.5px] text-text-dim">{fmtData(e.criadoEm)}</span>
                <span className="font-mono text-xs font-bold text-accent">{fmt(e.valor)}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={zerarMinha}
            disabled={pending}
            className="mt-3 text-text-dim text-[11.5px] underline hover:text-danger disabled:opacity-40"
          >
            Zerar minha caixinha
          </button>
        </div>
      )}

      {geral && (
        <div className="panel p-4">
          <p className="text-xs uppercase tracking-wide text-text-dim mb-1">Caixinha da equipe</p>
          <p className="font-mono text-xl font-bold mb-3">{fmt(geral.total)}</p>

          <div className="flex flex-col gap-1.5">
            {geral.porBarbeiro.length === 0 && (
              <p className="text-text-dim text-xs">Nenhuma gorjeta registrada ainda.</p>
            )}
            {geral.porBarbeiro.map((b) => (
              <div
                key={b.barbeiroId}
                className="flex items-center justify-between bg-panel-2 border border-border px-2.5 py-2"
              >
                <span className="text-[13px] font-semibold">{b.nome}</span>
                <span className="font-mono text-xs font-bold text-accent">{fmt(b.total)}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={zerarTudo}
            disabled={pending}
            className="mt-3 text-text-dim text-[11.5px] underline hover:text-danger disabled:opacity-40"
          >
            Zerar caixinha de todos
          </button>
        </div>
      )}
    </div>
  );
}
