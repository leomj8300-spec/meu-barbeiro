"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconBarberPole,
  IconScissors,
  IconTagClock,
  IconCoin,
  IconPercent,
  IconSliders,
  IconUsers,
  IconCalendarCheck,
  IconHistory,
  IconDoor,
} from "@/components/icons";
import { logoutAction } from "@/app/actions/auth";
import type { BarbeariaConfiguracoes, Papel } from "@/lib/types";

interface Tab {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
}

export function AppShell({
  nome,
  papel,
  config,
  children,
}: {
  nome: string;
  papel: Papel;
  config: BarbeariaConfiguracoes;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [maisAberto, setMaisAberto] = useState(false);

  const tabs: Tab[] = [
    { href: "/atendimento", label: "Atender", icon: IconScissors },
    { href: "/historico", label: "Histórico", icon: IconHistory },
  ];
  if (config.fiadoHabilitado) tabs.push({ href: "/fiado", label: "Fiado", icon: IconTagClock });
  if (config.caixinhaHabilitada) tabs.push({ href: "/caixinha", label: "Caixinha", icon: IconCoin });
  if (config.comissaoHabilitada) tabs.push({ href: "/comissao", label: "Comissão", icon: IconPercent });
  if (papel === "dono") tabs.push({ href: "/fechamento", label: "Fechamento", icon: IconCalendarCheck });

  const ferramentas: Tab[] =
    papel === "dono"
      ? [
          { href: "/servicos-consumos", label: "Serviços e consumos", icon: IconScissors },
          ...(config.gestaoEquipeHabilitada
            ? [{ href: "/equipe", label: "Equipe", icon: IconUsers }]
            : []),
          { href: "/configuracoes", label: "Configurações", icon: IconSliders },
        ]
      : [];

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-[720px] mx-auto w-full px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/atendimento" className="flex items-center gap-2.5 shrink-0">
            <span className="w-9 h-9 rounded-[10px] bg-accent text-on-accent flex items-center justify-center shrink-0">
              <IconBarberPole className="w-4 h-4" />
            </span>
            <span className="heading-display text-lg text-text hidden xs:inline">
              Meu Barbeiro
            </span>
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-right min-w-0 hidden sm:block">
              <p className="text-xs font-semibold text-text truncate">{nome}</p>
              <p className="text-[10px] uppercase tracking-wider text-accent-label font-bold">{papel}</p>
            </div>
            <Link
              href="/configuracoes"
              className="btn-ghost w-9 h-9 !p-0 rounded-full"
              aria-label="Preferências"
            >
              <IconSliders className="w-4 h-4" />
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="btn-ghost" aria-label="Sair">
                <IconDoor className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[720px] mx-auto px-4 sm:px-6 py-5 pb-24">{children}</main>

      {maisAberto && (
        <button
          aria-label="Fechar menu"
          onClick={() => setMaisAberto(false)}
          className="fixed inset-0 bg-black/60 z-40"
        />
      )}

      {maisAberto && ferramentas.length > 0 && (
        <div className="fixed bottom-[76px] left-0 right-0 z-50 max-w-[720px] mx-auto px-3">
          <div className="panel grid grid-cols-2 gap-2 p-3">
            {ferramentas.map((f) => {
              const Icon = f.icon;
              const ativo = pathname === f.href;
              return (
                <Link
                  key={f.href}
                  href={f.href}
                  onClick={() => setMaisAberto(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 border rounded-[10px] text-xs font-semibold ${
                    ativo
                      ? "border-accent text-accent-label bg-accent-soft"
                      : "border-border text-text-dim"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {f.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-panel">
        <div className="max-w-[720px] mx-auto w-full grid" style={{ gridTemplateColumns: `repeat(${tabs.length + (ferramentas.length > 0 ? 1 : 0)}, 1fr)` }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const ativo = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-semibold"
              >
                <span
                  className={`w-9 h-5 rounded-full flex items-center justify-center ${
                    ativo ? "bg-accent-soft text-accent-label" : "text-text-dim"
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                </span>
                <span className={ativo ? "text-accent-label" : "text-text-dim"}>{tab.label}</span>
              </Link>
            );
          })}
          {ferramentas.length > 0 && (
            <button
              type="button"
              onClick={() => setMaisAberto((v) => !v)}
              className="flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-semibold"
            >
              <span
                className={`w-9 h-5 rounded-full flex items-center justify-center ${
                  maisAberto ? "bg-accent-soft text-accent-label" : "text-text-dim"
                }`}
              >
                <IconSliders className="w-4.5 h-4.5" />
              </span>
              <span className={maisAberto ? "text-accent-label" : "text-text-dim"}>Mais</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
