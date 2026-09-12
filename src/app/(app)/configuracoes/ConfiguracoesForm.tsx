"use client";

import { useEffect, useState, useTransition } from "react";
import { ToggleField } from "@/components/ToggleField";
import { salvarConfiguracoesAction } from "@/app/actions/configuracoes";
import type {
  BarbeariaConfiguracoes,
  ModoAtendimento,
  PeriodicidadeFechamento,
} from "@/lib/types";

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

export function ConfiguracoesForm({
  configuracoes,
  subdominio,
}: {
  configuracoes: BarbeariaConfiguracoes;
  subdominio: string | null;
}) {
  // O domínio muda entre local, preview e produção, e o servidor não sabe
  // qual o navegador usou. Resolver depois da montagem (em vez de ler window
  // no render) evita divergir do HTML do servidor e quebrar a hidratação.
  const [linkPublico, setLinkPublico] = useState<string | null>(null);
  useEffect(() => {
    if (subdominio) setLinkPublico(`${window.location.origin}/b/${subdominio}/agendar`);
  }, [subdominio]);

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
  const [modoAtendimento, setModoAtendimento] = useState<ModoAtendimento>(
    configuracoes.modoAtendimento,
  );
  const [horaAbertura, setHoraAbertura] = useState(configuracoes.horaAbertura);
  const [horaFechamento, setHoraFechamento] = useState(configuracoes.horaFechamento);
  const [diasFuncionamento, setDiasFuncionamento] = useState<number[]>(
    configuracoes.diasFuncionamento,
  );
  const [agendamentoOnlineHabilitado, setAgendamentoOnlineHabilitado] = useState(
    configuracoes.agendamentoOnlineHabilitado,
  );

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
        modoAtendimento,
        horaAbertura,
        horaFechamento,
        diasFuncionamento: [...diasFuncionamento].sort((a, b) => a - b),
        agendamentoOnlineHabilitado,
      });
      if (res.error) setError(res.error);
      else setSucesso(true);
    });
  }

  function alternarDia(valor: number) {
    setDiasFuncionamento((atual) =>
      atual.includes(valor) ? atual.filter((d) => d !== valor) : [...atual, valor],
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 rounded-[10px]">
          {error}
        </div>
      )}
      {sucesso && (
        <div className="bg-cons/10 border border-cons text-cons text-xs px-2.5 py-2 rounded-[10px]">
          Configurações salvas.
        </div>
      )}

      <section className="panel p-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold mb-3">
          Como a barbearia atende
        </h2>
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

            <div className="pt-3 border-t border-border">
              <ToggleField
                label="Cliente marca sozinho pela internet"
                hint="Publica uma página com seus horários livres. Você compartilha o link."
                value={agendamentoOnlineHabilitado}
                onChange={setAgendamentoOnlineHabilitado}
              />
              {agendamentoOnlineHabilitado && linkPublico && (
                <div className="mt-2.5 rounded-[10px] border border-border bg-panel-2 px-2.5 py-2">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-text-dim font-mono font-semibold">
                    Link pra mandar no WhatsApp
                  </p>
                  <p className="font-mono text-[12px] text-accent-label break-all mt-1">
                    {linkPublico}
                  </p>
                  <p className="text-text-dim text-[11px] mt-1.5">
                    Só vale depois de salvar. Cadastre a duração dos serviços antes, senão
                    a página não tem como calcular os horários.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="panel p-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold mb-3">
          Operação
        </h2>
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
        <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold mb-3">
          Comissão
        </h2>
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
              onFocus={(e) => e.target.select()}
              className="w-full bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
            />
          </div>
        )}
      </section>

      <section className="panel p-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold mb-3">
          Fechamento de faturamento
        </h2>
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
      </section>

      <button
        type="button"
        onClick={salvar}
        disabled={pending}
        className="btn-primary w-full py-3"
      >
        {pending ? "Salvando..." : "Salvar configurações"}
      </button>
    </div>
  );
}
