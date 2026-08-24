"use client";

import { useState, useTransition } from "react";
import { fecharPeriodoAction } from "@/app/actions/fechamento";
import {
  registrarCaixinhaAction,
  zerarMinhaCaixinhaAction,
  zerarCaixinhaTudoAction,
} from "@/app/actions/caixinha";
import type {
  PeriodoAtual,
  FechamentoHistorico,
  CaixinhaEntrada,
  CaixinhaPorBarbeiro,
  ComissaoPorBarbeiro,
} from "@/lib/queries";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function CaixaView({
  ehDono,
  periodoAtual,
  historico,
  minhaCaixinha,
  caixinhaGeral,
  comissoes,
  caixinhaHabilitada,
  comissaoHabilitada,
}: {
  ehDono: boolean;
  periodoAtual: PeriodoAtual;
  historico: FechamentoHistorico[];
  minhaCaixinha: { total: number; entradas: CaixinhaEntrada[] } | null;
  caixinhaGeral: { total: number; porBarbeiro: CaixinhaPorBarbeiro[] } | null;
  comissoes: ComissaoPorBarbeiro[];
  caixinhaHabilitada: boolean;
  comissaoHabilitada: boolean;
}) {
  const { totais } = periodoAtual;

  return (
    <div className="flex flex-col gap-5">
      <PeriodoCard ehDono={ehDono} periodoAtual={periodoAtual} totais={totais} />

      {caixinhaHabilitada && minhaCaixinha && (
        <CaixinhaSection ehDono={ehDono} minha={minhaCaixinha} geral={caixinhaGeral} />
      )}

      {comissaoHabilitada && comissoes.length > 0 && (
        <ComissaoSection ehDono={ehDono} comissoes={comissoes} />
      )}

      {ehDono && (
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
      )}
    </div>
  );
}

function PeriodoCard({
  ehDono,
  periodoAtual,
  totais,
}: {
  ehDono: boolean;
  periodoAtual: PeriodoAtual;
  totais: PeriodoAtual["totais"];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
    <div className="panel-accent p-4">
      {error && (
        <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 rounded-[10px] mb-3">
          {error}
        </div>
      )}
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim mb-1">
        {ehDono ? "Período atual" : "Meu período"} · desde {fmtData(periodoAtual.inicio)}
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
      </div>

      {ehDono && (
        <button type="button" onClick={fechar} disabled={pending} className="btn-primary w-full mt-4 py-3">
          {pending ? "Fechando..." : "Fechar período atual"}
        </button>
      )}
    </div>
  );
}

function CaixinhaSection({
  ehDono,
  minha,
  geral,
}: {
  ehDono: boolean;
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
    <div className="flex flex-col gap-3">
      {error && (
        <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 rounded-[10px]">
          {error}
        </div>
      )}

      <div className="panel p-5 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">Minha caixinha</p>
        <p className="font-mono text-3xl font-bold text-accent-label mt-1">{fmt(minha.total)}</p>
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
            className="flex-1 bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
          />
          <button type="button" onClick={adicionar} disabled={pending} className="btn-primary shrink-0">
            Adicionar
          </button>
        </div>
      </div>

      {minha.entradas.length > 0 && (
        <div className="panel p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold mb-2.5">
            Histórico
          </p>
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
            {minha.entradas.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-[10px] bg-panel-2 border border-border px-2.5 py-1.5"
              >
                <span className="text-[11.5px] text-text-dim">{fmtDataHora(e.criadoEm)}</span>
                <span className="font-mono text-xs font-bold text-accent-label">{fmt(e.valor)}</span>
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

      {ehDono && geral && (
        <div className="panel p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold mb-1">
            Caixinha da equipe
          </p>
          <p className="font-mono text-xl font-bold mb-3">{fmt(geral.total)}</p>

          <div className="flex flex-col gap-1.5">
            {geral.porBarbeiro.length === 0 && (
              <p className="text-text-dim text-xs">Nenhuma gorjeta registrada ainda.</p>
            )}
            {geral.porBarbeiro.map((b) => (
              <div
                key={b.barbeiroId}
                className="flex items-center justify-between rounded-[10px] bg-panel-2 border border-border px-2.5 py-2"
              >
                <span className="text-[13px] font-semibold">{b.nome}</span>
                <span className="font-mono text-xs font-bold text-accent-label">{fmt(b.total)}</span>
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

function ComissaoSection({ ehDono, comissoes }: { ehDono: boolean; comissoes: ComissaoPorBarbeiro[] }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold">
        {ehDono ? "Comissão da equipe" : "Minha comissão"}
      </p>
      {comissoes.map((c) => (
        <div key={c.barbeiroId} className="panel-accent p-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[14px] font-semibold">{c.nome}</span>
            <span className="rounded-[10px] bg-accent-soft text-accent-label text-[10.5px] font-bold px-1.5 py-0.5">
              {c.comissaoPct}%
            </span>
          </div>
          <p className="text-text-dim text-[11.5px] mb-2">
            {c.qtdAtendimentos} atendimento{c.qtdAtendimentos !== 1 ? "s" : ""} · base comissionável{" "}
            {fmt(c.baseComissionavel)}
          </p>
          <p className="font-mono text-2xl font-bold text-accent-label">{fmt(c.valorComissao)}</p>
        </div>
      ))}
    </div>
  );
}
