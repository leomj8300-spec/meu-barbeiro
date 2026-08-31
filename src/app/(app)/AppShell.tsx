"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconScissors,
  IconTagClock,
  IconCoin,
  IconSliders,
  IconUsers,
  IconHistory,
  IconDoor,
} from "@/components/icons";
import { logoutAction } from "@/app/actions/auth";
import { SuporteChat } from "@/components/SuporteChat";
import { NavPendingDot } from "@/components/NavPendingDot";
import type { BarbeariaConfiguracoes, Papel } from "@/lib/types";
import type { MensagemTicketSuporte } from "@/lib/queries";

interface Tab {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
}

export function AppShell({
  nome,
  papel,
  config,
  ticketSuporteInicial,
  children,
}: {
  nome: string;
  papel: Papel;
  config: BarbeariaConfiguracoes;
  ticketSuporteInicial: { ticketId: string; mensagens: MensagemTicketSuporte[] } | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [maisAberto, setMaisAberto] = useState(false);

  const tabs: Tab[] = [
    { href: "/atendimento", label: "Atender", icon: IconScissors },
    { href: "/historico", label: "Histórico", icon: IconHistory },
  ];
  if (config.fiadoHabilitado) tabs.push({ href: "/fiado", label: "Fiado", icon: IconTagClock });
  // Caixa (fechamento+caixinha+comissão) é sempre relevante pro dono; pro
  // barbeiro só existe se sobrar algo pessoal pra ver ali (a própria página
  // já redireciona se não sobrar nada, então a aba segue a mesma regra).
  if (papel === "dono" || config.caixinhaHabilitada || config.comissaoHabilitada) {
    tabs.push({ href: "/caixa", label: "Caixa", icon: IconCoin });
  }

  const ferramentas: Tab[] =
    papel === "dono"
      ? [
          { href: "/servicos-consumos", label: "Serviços e consumos", icon: IconScissors },
          ...(config.gestaoEquipeHabilitada
            ? [{ href: "/equipe", label: "Equipe", icon: IconUsers }]
            : []),
          { href: "/configuracoes", label: "Configurações", icon: IconSliders },
        ]
      : [{ href: "/configuracoes", label: "Configurações", icon: IconSliders }];

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-border" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-[720px] mx-auto w-full px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/atendimento" className="flex items-center gap-2.5 shrink-0">
            <span className="w-9 h-9 rounded-[10px] bg-accent text-on-accent flex items-center justify-center shrink-0">
              <IconScissors className="w-4 h-4" />
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
            <SuporteChat ticketInicial={ticketSuporteInicial} />
            <form action={logoutAction}>
              <button type="submit" className="btn-ghost" aria-label="Sair">
                <IconDoor className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main
        className="flex-1 w-full max-w-[720px] mx-auto px-4 sm:px-6 py-5"
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        {children}
      </main>

      {maisAberto && (
        <button
          aria-label="Fechar menu"
          onClick={() => setMaisAberto(false)}
          className="fixed inset-0 bg-black/60 z-40"
        />
      )}

      {maisAberto && ferramentas.length > 0 && (
        <div
          className="fixed left-0 right-0 z-50 max-w-[720px] mx-auto px-3"
          style={{ bottom: "calc(76px + env(safe-area-inset-bottom))" }}
        >
          <div className="panel grid grid-cols-2 gap-2 p-3">
            {ferramentas.map((f) => {
              const Icon = f.icon;
              const ativo = pathname === f.href;
              return (
                <Link
                  key={f.href}
                  href={f.href}
                  onClick={() => setMaisAberto(false)}
                  className={`relative flex items-center gap-2 px-3 py-2.5 border rounded-[10px] text-xs font-semibold ${
                    ativo
                      ? "border-accent text-accent-label bg-accent-soft"
                      : "border-border text-text-dim"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {f.label}
                  <NavPendingDot />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-panel"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-[720px] mx-auto w-full grid" style={{ gridTemplateColumns: `repeat(${tabs.length + (ferramentas.length > 0 ? 1 : 0)}, 1fr)` }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const ativo = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-semibold"
              >
                <span
                  className={`w-9 h-5 rounded-full flex items-center justify-center ${
                    ativo ? "bg-accent-soft text-accent-label" : "text-text-dim"
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                </span>
                <span className={ativo ? "text-accent-label" : "text-text-dim"}>{tab.label}</span>
                <NavPendingDot />
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
