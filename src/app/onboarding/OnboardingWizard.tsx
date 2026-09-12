"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ToggleField } from "@/components/ToggleField";
import { salvarConfiguracoesAction } from "@/app/actions/configuracoes";
import type { ModoAtendimento, PeriodicidadeFechamento } from "@/lib/types";

const DIAS_SEMANA = [
  { valor: 1, label: "Segunda-feira", curto: "SEG" },
  { valor: 2, label: "Terça-feira", curto: "TER" },
  { valor: 3, label: "Quarta-feira", curto: "QUA" },
  { valor: 4, label: "Quinta-feira", curto: "QUI" },
  { valor: 5, label: "Sexta-feira", curto: "SEX" },
  { valor: 6, label: "Sábado", curto: "SÁB" },
  { valor: 7, label: "Domingo", curto: "DOM" },
];

const MODOS: { valor: ModoAtendimento; titulo: string; descricao: string }[] = [
  {
    valor: "ordem_chegada",
    titulo: "Por ordem de chegada",
    descricao: "Cliente chega, espera a vez e você registra na hora.",
  },
  {
    valor: "agendamento",
    titulo: "Por agendamento",
    descricao: "Cliente marca hora. O dia aparece pronto na aba Agenda.",
  },
];

const TOTAL_PASSOS = 7;

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
  const [modoAtendimento, setModoAtendimento] = useState<ModoAtendimento>("ordem_chegada");
  const [horaAbertura, setHoraAbertura] = useState("09:00");
  const [horaFechamento, setHoraFechamento] = useState("19:00");
  const [diasFuncionamento, setDiasFuncionamento] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  function alternarDia(valor: number) {
    setDiasFuncionamento((atual) =>
      atual.includes(valor) ? atual.filter((d) => d !== valor) : [...atual, valor],
    );
  }

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
        modoAtendimento,
        horaAbertura,
        horaFechamento,
        diasFuncionamento: [...diasFuncionamento].sort((a, b) => a - b),
        // Publicar a agenda na internet é decisão consciente do dono, tomada
        // depois nas Configurações — não algo que sai ligado do onboarding.
        agendamentoOnlineHabilitado: false,
        diasParaRetorno: 30,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      router.push(modoAtendimento === "agendamento" ? "/agenda" : "/atendimento");
      router.refresh();
    });
  }

  return (
    <div className="panel p-6">
      <p className="text-text-dim text-xs mb-4">
        Passo {passo + 1} de {TOTAL_PASSOS}
      </p>

      {error && (
        <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 mb-3 rounded-[10px]">
          {error}
        </div>
      )}

      {passo === 0 && (
        <Passo
          titulo="Como a barbearia atende?"
          subtitulo="Dá pra mudar depois, nas Configurações."
        >
          <div className="flex flex-col gap-2">
            {MODOS.map((m) => {
              const selecionado = modoAtendimento === m.valor;
              return (
                <button
                  key={m.valor}
                  type="button"
                  onClick={() => setModoAtendimento(m.valor)}
                  aria-pressed={selecionado}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-[10px] border text-left transition-colors ${
                    selecionado ? "border-accent bg-accent-soft" : "border-border bg-panel-2"
                  }`}
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13.5px] font-semibold text-text">{m.titulo}</span>
                    <span className="block text-[11.5px] text-text-dim mt-0.5">{m.descricao}</span>
                  </span>
                  <span
                    className={`w-4.5 h-4.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      selecionado ? "border-accent" : "border-border"
                    }`}
                  >
                    {selecionado && <span className="w-2 h-2 rounded-full bg-accent" />}
                  </span>
                </button>
              );
            })}
          </div>

          {modoAtendimento === "agendamento" && (
            <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3">
              <div>
                <label className="block text-xs text-text-dim mb-1.5">Dias que abre</label>
                <div className="flex gap-1.5">
                  {DIAS_SEMANA.map((d) => {
                    const aberto = diasFuncionamento.includes(d.valor);
                    return (
                      <button
                        key={d.valor}
                        type="button"
                        onClick={() => alternarDia(d.valor)}
                        aria-pressed={aberto}
                        className={`flex-1 rounded-[10px] border py-2 font-mono text-[10px] font-semibold transition-colors ${
                          aberto
                            ? "border-accent-border bg-accent-soft text-accent-label"
                            : "border-border bg-panel-2 text-text-dim"
                        }`}
                      >
                        {d.curto}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-text-dim mb-1.5">Abre às</label>
                  <input
                    type="time"
                    value={horaAbertura}
                    onChange={(e) => setHoraAbertura(e.target.value)}
                    className="w-full bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-text-dim mb-1.5">Fecha às</label>
                  <input
                    type="time"
                    value={horaFechamento}
                    onChange={(e) => setHoraFechamento(e.target.value)}
                    className="w-full bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>
          )}
        </Passo>
      )}

      {passo === 1 && (
        <Passo titulo="Vende produtos ou bebidas junto com o serviço?" subtitulo="Ex: pomada, cerveja, energético.">
          <ToggleField
            label="Controle de estoque e consumos"
            value={controleEstoqueHabilitado}
            onChange={setControleEstoqueHabilitado}
          />
        </Passo>
      )}

      {passo === 2 && (
        <Passo titulo="Você tem barbeiros contratados, ou só você atende?">
          <ToggleField
            label="Tenho barbeiros na equipe"
            hint="Se não, assumimos que só o dono atende."
            value={gestaoEquipeHabilitada}
            onChange={setGestaoEquipeHabilitada}
          />
        </Passo>
      )}

      {passo === 3 && (
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
                onFocus={(e) => e.target.select()}
                className="w-full bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
              />
            </div>
          )}
        </Passo>
      )}

      {passo === 4 && (
        <Passo titulo="Você tem controle de fiado?" subtitulo="Cliente corta e paga depois.">
          <ToggleField label="Fiado" value={fiadoHabilitado} onChange={setFiadoHabilitado} />
        </Passo>
      )}

      {passo === 5 && (
        <Passo titulo="Os barbeiros recebem caixinha/gorjeta separada?">
          <ToggleField
            label="Caixinha individual"
            value={caixinhaHabilitada}
            onChange={setCaixinhaHabilitada}
          />
        </Passo>
      )}

      {passo === 6 && (
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
                className={`flex-1 rounded-[10px] border px-3 py-2 text-xs font-semibold capitalize transition-colors ${
                  periodicidadeFechamento === opcao
                    ? "border-accent-border bg-accent-soft text-accent-label"
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
                className="w-full bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs text-text-dim mb-1.5">Dia da semana que inicia o período</label>
              <select
                value={diaInicioPeriodo}
                onChange={(e) => setDiaInicioPeriodo(Number(e.target.value))}
                className="w-full bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
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
          className="rounded-[10px] border border-border bg-panel-2 text-text text-xs font-semibold px-3.5 py-2 disabled:opacity-30 hover:border-accent hover:text-accent-label transition-colors"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={proximo}
          disabled={pending}
          className="btn-primary"
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
