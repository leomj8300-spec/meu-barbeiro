"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/app/actions/auth";
import { IconScissors, IconMail, IconLock } from "@/components/icons";

export function LoginForm({
  barbeariaId,
  nomeBarbearia,
  erroInicial,
}: {
  barbeariaId?: string;
  nomeBarbearia?: string;
  erroInicial?: string | null;
}) {
  const [state, formAction, pending] = useActionState(loginAction, { error: null });
  const [verSenha, setVerSenha] = useState(false);
  const erro = state.error ?? erroInicial;

  return (
    <div className="min-h-dvh flex items-center justify-center p-5">
      <div className="w-full max-w-[380px]">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-11 h-11 rounded-[10px] bg-accent text-on-accent flex items-center justify-center shrink-0">
            <IconScissors className="w-5 h-5" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-dim">
            {nomeBarbearia ?? "Meu Barbeiro"}
          </span>
        </div>

        <h1 className="heading-display text-[32px] text-text mb-2">Bom te ver de volta</h1>
        <p className="text-text-dim text-[15px] mb-9">Entre para registrar os atendimentos de hoje.</p>

        {erro && (
          <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 mb-5 rounded-[10px]">
            {erro}
          </div>
        )}

        <form action={formAction} className="flex flex-col gap-5">
          {barbeariaId && <input type="hidden" name="barbeariaId" value={barbeariaId} />}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim"
            >
              E-mail
            </label>
            <div className="flex items-center gap-2.5 rounded-[10px] border border-border bg-panel h-[52px] px-3.5 focus-within:border-accent">
              <IconMail className="w-[17px] h-[17px] text-text-dim shrink-0" />
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="flex-1 min-w-0 bg-transparent text-text text-[15px] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim"
            >
              Senha
            </label>
            <div className="flex items-center gap-2.5 rounded-[10px] border border-border bg-panel h-[52px] px-3.5 focus-within:border-accent">
              <IconLock className="w-[17px] h-[17px] text-text-dim shrink-0" />
              <input
                id="password"
                name="password"
                type={verSenha ? "text" : "password"}
                required
                autoComplete="current-password"
                className="flex-1 min-w-0 bg-transparent text-text text-[15px] tracking-[0.1em] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setVerSenha((v) => !v)}
                className="font-mono text-[10px] text-text-dim shrink-0"
              >
                {verSenha ? "OCULTAR" : "VER"}
              </button>
            </div>
          </div>

          <button type="submit" disabled={pending} className="btn-primary w-full py-3.5 text-[15px] mt-2">
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
