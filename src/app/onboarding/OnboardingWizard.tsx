"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ToggleField } from "@/components/ToggleField";
import { salvarConfiguracoesAction } from "@/app/actions/configuracoes";
import type { PeriodicidadeFechamento } from "@/lib/types";

const DIAS_SEMANA = [
  { valor: 1, label: "Segunda-feira" },
  { valor: 2, label: "Terça-feira" },
  { valor: 3, label: "Quarta-feira" },
  { valor: 4, label: "Quinta-feira" },
  { valor: 5, label: "Sexta-feira" },
  { valor: 6, label: "Sábado" },
  { valor: 7, label: "Domingo" },
];

const TOTAL_PASSOS = 6;

export function OnboardingWizard() {
  const router = useRouter();
  const [passo, setPasso] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [controleEstoqueHabilitado, setControleEstoqueHabilitado] = useState(true);
  const [gestaoEquipeHabilitada, setGestaoEquipeHabilitada] = useState(false);
  const [comissaoHabilitada, setComissaoHabilitada] = useState(false);
  const [comissaoPadraoPct, setComissaoPadraoPct] = useState("10");
  const [fiadoHabilitado, setFiadoHabilitado] = useState(true);
  const [caixinhaHabilitada, setCaixinhaHabilitada] = useState(true);
  const [periodicidadeFechamento, setPeriodicidadeFechamento] =
    useState<PeriodicidadeFechamento>("semanal");
  const [diaInicioPeriodo, setDiaInicioPeriodo] = useState(1);

  function proximo() {
    setError(null);
    if (passo < TOTAL_PASSOS - 1) setPasso(passo + 1);
    else concluir();
  }

  function voltar() {
    setError(null);
    if (passo > 0) setPasso(passo - 1);
  }

  function concluir() {
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
      if (res.error) {
        setError(res.error);
        return;
      }
      router.push("/atendimento");
      router.refresh();
    });
  }

  return (
    <div className="panel cut-both p-6">
      <p className="text-text-dim text-xs mb-4">
        Passo {passo + 1} de {TOTAL_PASSOS}
      </p>

      {error && (
        <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 mb-3">
          {error}
        </div>
      )}

      {passo === 0 && (
        <Passo titulo="Vende produtos ou bebidas junto com o serviço?" subtitulo="Ex: pomada, cerveja, energético.">
          <ToggleField
            label="Controle de estoque e consumos"
            value={controleEstoqueHabilitado}
            onChange={setControleEstoqueHabilitado}
          />
        </Passo>
      )}

      {passo === 1 && (
        <Passo titulo="Você tem barbeiros contratados, ou só você atende?">
          <ToggleField
            label="Tenho barbeiros na equipe"
            hint="Se não, assumimos que só o dono atende."
            value={gestaoEquipeHabilitada}
            onChange={setGestaoEquipeHabilitada}
          />
        </Passo>
      )}

      {passo === 2 && (
        <Passo titulo="Você paga comissão por serviço aos barbeiros?">
          <ToggleField
            label="Comissão por serviço"
            value={comissaoHabilitada}
            onChange={setComissaoHabilitada}
          />
          {comissaoHabilitada && (
            <div className="mt-3">
              <label className="block text-xs text-text-dim mb-1.5">
                Comissão padrão (%)
              </label>
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
        </Passo>
      )}

      {passo === 3 && (
        <Passo titulo="Você tem controle de fiado?" subtitulo="Cliente corta e paga depois.">
          <ToggleField label="Fiado" value={fiadoHabilitado} onChange={setFiadoHabilitado} />
        </Passo>
      )}

      {passo === 4 && (
        <Passo titulo="Os barbeiros recebem caixinha/gorjeta separada?">
          <ToggleField
            label="Caixinha individual"
            value={caixinhaHabilitada}
            onChange={setCaixinhaHabilitada}
          />
        </Passo>
      )}

      {passo === 5 && (
        <Passo titulo="Como você fecha o faturamento?">
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
        </Passo>
      )}

      <div className="flex justify-between gap-2 mt-5">
        <button
          type="button"
          onClick={voltar}
          disabled={passo === 0 || pending}
          className="border border-border bg-panel-2 text-text text-xs font-semibold px-3.5 py-2 disabled:opacity-30 hover:border-accent hover:text-accent transition-colors"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={proximo}
          disabled={pending}
          className="btn-primary cut-tr"
        >
          {pending ? "Salvando..." : passo === TOTAL_PASSOS - 1 ? "Concluir" : "Próximo"}
        </button>
      </div>
    </div>
  );
}

function Passo({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-[15px] font-semibold mb-1">{titulo}</h2>
      {subtitulo && <p className="text-text-dim text-xs mb-3">{subtitulo}</p>}
      {!subtitulo && <div className="mb-3" />}
      {children}
    </div>
  );
}
