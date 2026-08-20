"use client";

import { useState, useTransition } from "react";
import { ToggleField } from "@/components/ToggleField";
import { salvarConfiguracoesAction } from "@/app/actions/configuracoes";
import type { BarbeariaConfiguracoes, PeriodicidadeFechamento } from "@/lib/types";

const DIAS_SEMANA = [
  { valor: 1, label: "Segunda-feira" },
  { valor: 2, label: "Terça-feira" },
  { valor: 3, label: "Quarta-feira" },
  { valor: 4, label: "Quinta-feira" },
  { valor: 5, label: "Sexta-feira" },
  { valor: 6, label: "Sábado" },
  { valor: 7, label: "Domingo" },
];

export function ConfiguracoesForm({ configuracoes }: { configuracoes: BarbeariaConfiguracoes }) {
  const [controleEstoqueHabilitado, setControleEstoqueHabilitado] = useState(
    configuracoes.controleEstoqueHabilitado,
  );
  const [gestaoEquipeHabilitada, setGestaoEquipeHabilitada] = useState(
    configuracoes.gestaoEquipeHabilitada,
  );
  const [comissaoHabilitada, setComissaoHabilitada] = useState(configuracoes.comissaoHabilitada);
  const [comissaoPadraoPct, setComissaoPadraoPct] = useState(
    String(configuracoes.comissaoPadraoPct),
  );
  const [fiadoHabilitado, setFiadoHabilitado] = useState(configuracoes.fiadoHabilitado);
  const [caixinhaHabilitada, setCaixinhaHabilitada] = useState(configuracoes.caixinhaHabilitada);
  const [periodicidadeFechamento, setPeriodicidadeFechamento] =
    useState<PeriodicidadeFechamento>(configuracoes.periodicidadeFechamento);
  const [diaInicioPeriodo, setDiaInicioPeriodo] = useState(configuracoes.diaInicioPeriodo);

  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [pending, startTransition] = useTransition();

  function salvar() {
    setError(null);
    setSucesso(false);
    startTransition(async () => {
      const res = await salvarConfiguracoesAction({
        controleEstoqueHabilitado,
        gestaoEquipeHabilitada,
        comissaoHabilitada,
        comissaoPadraoPct: comissaoHabilitada ? Number(comissaoPadraoPct || 0) : 0,
        fiadoHabilitado,
        caixinhaHabilitada,
        periodicidadeFechamento,
        diaInicioPeriodo,
      });
      if (res.error) setError(res.error);
      else setSucesso(true);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2">
          {error}
        </div>
      )}
      {sucesso && (
        <div className="bg-cons/10 border border-cons text-cons text-xs px-2.5 py-2">
          Configurações salvas.
        </div>
      )}

      <section className="panel p-4">
        <h2 className="text-xs uppercase tracking-wide text-text-dim mb-3">Operação</h2>
        <div className="flex flex-col gap-2">
          <ToggleField
            label="Controle de estoque e consumos"
            hint="Some a seção de consumos no atendimento se desativado."
            value={controleEstoqueHabilitado}
            onChange={setControleEstoqueHabilitado}
          />
          <ToggleField
            label="Gestão de equipe"
            hint="Cadastro e remoção de barbeiros."
            value={gestaoEquipeHabilitada}
            onChange={setGestaoEquipeHabilitada}
          />
          <ToggleField
            label="Fiado"
            hint="Cliente corta e paga depois."
            value={fiadoHabilitado}
            onChange={setFiadoHabilitado}
          />
          <ToggleField
            label="Caixinha individual"
            hint="Gorjeta separada por barbeiro."
            value={caixinhaHabilitada}
            onChange={setCaixinhaHabilitada}
          />
        </div>
      </section>

      <section className="panel p-4">
        <h2 className="text-xs uppercase tracking-wide text-text-dim mb-3">Comissão</h2>
        <ToggleField
          label="Comissão por serviço"
          hint="Incide só sobre serviços comissionáveis, nunca sobre consumos."
          value={comissaoHabilitada}
          onChange={setComissaoHabilitada}
        />
        {comissaoHabilitada && (
          <div className="mt-3">
            <label className="block text-xs text-text-dim mb-1.5">Comissão padrão (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={comissaoPadraoPct}
              onChange={(e) => setComissaoPadraoPct(e.target.value)}
              className="w-full bg-panel-2 border border-border text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
            />
          </div>
        )}
      </section>

      <section className="panel p-4">
        <h2 className="text-xs uppercase tracking-wide text-text-dim mb-3">Fechamento de faturamento</h2>
        <div className="flex gap-1.5 mb-3">
          {(["semanal", "quinzenal", "mensal"] as const).map((opcao) => (
            <button
              key={opcao}
              type="button"
              onClick={() => {
                setPeriodicidadeFechamento(opcao);
                setDiaInicioPeriodo(1);
              }}
              className={`flex-1 border px-3 py-2 text-xs font-semibold capitalize transition-colors ${
                periodicidadeFechamento === opcao
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border bg-panel-2 text-text-dim"
              }`}
            >
              {opcao}
            </button>
          ))}
        </div>

        {periodicidadeFechamento === "mensal" ? (
          <div>
            <label className="block text-xs text-text-dim mb-1.5">Dia do mês que inicia o período</label>
            <input
              type="number"
              min={1}
              max={31}
              value={diaInicioPeriodo}
              onChange={(e) => setDiaInicioPeriodo(Number(e.target.value))}
              className="w-full bg-panel-2 border border-border text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs text-text-dim mb-1.5">Dia da semana que inicia o período</label>
            <select
              value={diaInicioPeriodo}
              onChange={(e) => setDiaInicioPeriodo(Number(e.target.value))}
              className="w-full bg-panel-2 border border-border text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
            >
              {DIAS_SEMANA.map((d) => (
                <option key={d.valor} value={d.valor}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={salvar}
        disabled={pending}
        className="btn-primary cut-tr w-full py-3"
      >
        {pending ? "Salvando..." : "Salvar configurações"}
      </button>
    </div>
  );
}
