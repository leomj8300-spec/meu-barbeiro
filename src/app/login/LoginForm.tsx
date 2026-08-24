"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/app/actions/auth";
import { IconBarberPole } from "@/components/icons";

export function LoginForm({
  barbeariaId,
  nomeBarbearia,
}: {
  barbeariaId?: string;
  nomeBarbearia?: string;
}) {
  const [state, formAction, pending] = useActionState(loginAction, { error: null });
  const [verSenha, setVerSenha] = useState(false);

  return (
    <div className="min-h-dvh flex items-center justify-center p-5">
      <div className="w-full max-w-[380px]">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-11 h-11 rounded-[10px] bg-accent text-on-accent flex items-center justify-center shrink-0">
            <IconBarberPole className="w-5 h-5" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-dim">
            {nomeBarbearia ?? "Meu Barbeiro"}
          </span>
        </div>

        <h1 className="heading-display text-[32px] text-text mb-2">
          Bom te ver
          <br />
          de novo.
        </h1>
        <p className="text-text-dim text-[15px] mb-9">Entre para abrir o caixa do dia.</p>

        {state.error && (
          <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 mb-5 rounded-[10px]">
            {state.error}
          </div>
        )}

        <form action={formAction} className="flex flex-col gap-6">
          {barbeariaId && <input type="hidden" name="barbeariaId" value={barbeariaId} />}
          <div className="flex flex-col gap-1.5 border-b border-border pb-2.5 focus-within:border-accent">
            <label
              htmlFor="email"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim"
            >
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="bg-transparent text-text text-[16px] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5 border-b border-accent pb-2.5">
            <label
              htmlFor="password"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-label"
            >
              Senha
            </label>
            <div className="flex items-center justify-between gap-2">
              <input
                id="password"
                name="password"
                type={verSenha ? "text" : "password"}
                required
                autoComplete="current-password"
                className="bg-transparent text-text text-[16px] tracking-[0.15em] focus:outline-none w-full"
              />
              <button
                type="button"
                onClick={() => setVerSenha((v) => !v)}
                className="font-mono text-[11px] text-text-dim shrink-0"
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
