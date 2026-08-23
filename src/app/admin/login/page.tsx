"use client";

import { useActionState } from "react";
import { adminLoginAction } from "@/app/actions/admin";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(adminLoginAction, { error: null });

  return (
    <div className="min-h-dvh flex items-center justify-center p-5">
      <div className="w-full max-w-[380px]">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-dim mb-8">
          Meu Barbeiro · Admin
        </p>

        <h1 className="heading-display text-[28px] text-text mb-2">Painel administrativo</h1>
        <p className="text-text-dim text-[15px] mb-9">Acesso restrito.</p>

        {state.error && (
          <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 mb-5 rounded-[10px]">
            {state.error}
          </div>
        )}

        <form action={formAction} className="flex flex-col gap-6">
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

          <div className="flex flex-col gap-1.5 border-b border-border pb-2.5 focus-within:border-accent">
            <label
              htmlFor="senha"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim"
            >
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              autoComplete="current-password"
              className="bg-transparent text-text text-[16px] focus:outline-none"
            />
          </div>

          <button type="submit" disabled={pending} className="btn-primary w-full py-3.5 text-[15px] mt-2">
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
