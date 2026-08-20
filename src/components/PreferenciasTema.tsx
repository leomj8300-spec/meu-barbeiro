"use client";

import { useState, useTransition } from "react";
import { salvarPreferenciasTemaAction } from "@/app/actions/preferencias";
import { TEMA_CORES, TEMA_LABELS, TEMA_TOKENS, type TemaCor } from "@/lib/theme";

export function PreferenciasTema({ temaCor: temaCorInicial }: { temaCor: TemaCor }) {
  const [temaCor, setTemaCor] = useState<TemaCor>(temaCorInicial);
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [pending, startTransition] = useTransition();

  const alterado = temaCor !== temaCorInicial;

  function salvar() {
    setError(null);
    setSucesso(false);
    startTransition(async () => {
      const res = await salvarPreferenciasTemaAction({ temaCor });
      if (res.error) setError(res.error);
      else setSucesso(true);
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
          Preferências salvas.
        </div>
      )}

      <section className="panel p-4">
        <h2 className="text-xs uppercase tracking-wide text-text-dim mb-3.5 font-semibold">
          Cor de destaque
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {TEMA_CORES.map((cor) => {
            const t = TEMA_TOKENS[cor];
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
