"use client";

import { useState, useTransition } from "react";
import { salvarPreferenciasTemaAction } from "@/app/actions/preferencias";
import { IconSun, IconMoon, IconContrast } from "@/components/icons";
import {
  TEMA_CORES,
  TEMA_LABELS,
  TEMA_TOKENS,
  TEMA_MODOS,
  TEMA_MODO_LABELS,
  type TemaCor,
  type TemaModo,
} from "@/lib/theme";

const MODO_ICONE: Record<TemaModo, (props: { className?: string }) => React.ReactElement> = {
  claro: IconSun,
  escuro: IconMoon,
  automatico: IconContrast,
};

const MODO_DESCRICAO: Record<TemaModo, string> = {
  claro: "Vitrine batendo sol, tela mais legível",
  escuro: "Luz baixa à noite, não ofusca o cliente",
  automatico: "Segue o horário: 9h claro, 18h escuro",
};

export function PreferenciasTema({
  temaCor: temaCorInicial,
  temaModo: temaModoInicial,
}: {
  temaCor: TemaCor;
  temaModo: TemaModo;
}) {
  const [temaCor, setTemaCor] = useState<TemaCor>(temaCorInicial);
  const [temaModo, setTemaModo] = useState<TemaModo>(temaModoInicial);
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [pending, startTransition] = useTransition();

  const alterado = temaCor !== temaCorInicial || temaModo !== temaModoInicial;

  function salvar() {
    setError(null);
    setSucesso(false);
    const modoMudou = temaModo !== temaModoInicial;
    startTransition(async () => {
      const res = await salvarPreferenciasTemaAction({ temaCor, temaModo });
      if (res.error) {
        setError(res.error);
        return;
      }
      // O modo "automático" depende de um script que só roda na carga
      // inicial da página (não em navegação client-side) — sem reload,
      // trocar de/para automático pode não aplicar até o usuário recarregar
      // manualmente. Cor sozinha não tem esse problema (é só um <style>).
      if (modoMudou) {
        window.location.reload();
        return;
      }
      setSucesso(true);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 rounded-[10px]">
          {error}
        </div>
      )}
      {sucesso && !alterado && (
        <div className="bg-cons/10 border border-cons text-cons text-xs px-2.5 py-2 rounded-[10px]">
          Preferências salvas — a página atualiza sozinha ao trocar de tela.
        </div>
      )}

      <section className="panel p-4">
        <h2 className="text-xs uppercase tracking-wide text-text-dim mb-3.5 font-semibold">
          Tema
        </h2>
        <div className="flex flex-col gap-2">
          {TEMA_MODOS.map((modo) => {
            const Icon = MODO_ICONE[modo];
            const selecionado = modo === temaModo;
            return (
              <button
                type="button"
                key={modo}
                onClick={() => setTemaModo(modo)}
                aria-pressed={selecionado}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-[10px] border text-left transition-colors ${
                  selecionado
                    ? "border-accent bg-accent-soft"
                    : "border-border bg-panel-2"
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    selecionado ? "text-accent-label" : "text-text-dim"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13.5px] font-semibold text-text">
                    {TEMA_MODO_LABELS[modo]}
                  </span>
                  <span className="block text-[11.5px] text-text-dim mt-0.5">
                    {MODO_DESCRICAO[modo]}
                  </span>
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
      </section>

      <section className="panel p-4">
        <h2 className="text-xs uppercase tracking-wide text-text-dim mb-1.5 font-semibold">
          Minha cor na cadeira
        </h2>
        <p className="text-[11.5px] text-text-dim mb-3.5">
          Dois barbeiros no mesmo balcão trocam de celular sem perceber. A cor do seu login
          aparece no botão, no total e na aba ativa.
        </p>
        <div className="grid grid-cols-4 gap-3">
          {TEMA_CORES.map((cor) => {
            const t = TEMA_TOKENS[cor].light;
            const selecionado = cor === temaCor;
            return (
              <button
                type="button"
                key={cor}
                onClick={() => setTemaCor(cor)}
                className="flex flex-col items-center gap-1.5"
                aria-pressed={selecionado}
              >
                <span
                  className="w-11 h-11 rounded-full border-2 flex items-center justify-center transition-colors"
                  style={{
                    background: t.accent,
                    borderColor: selecionado ? t.accent : "transparent",
                    outline: selecionado ? `2px solid ${t.accent}` : undefined,
                    outlineOffset: selecionado ? "2px" : undefined,
                  }}
                >
                  {selecionado && (
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4.5 h-4.5"
                      fill="none"
                      stroke={t.onAccent}
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12.5 L10 17.5 L19 6.5" />
                    </svg>
                  )}
                </span>
                <span className="text-[10.5px] text-text-dim font-medium text-center leading-tight">
                  {TEMA_LABELS[cor]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        onClick={salvar}
        disabled={pending || !alterado}
        className="btn-primary w-full py-3"
      >
        {pending ? "Salvando..." : "Salvar preferências"}
      </button>
    </div>
  );
}
