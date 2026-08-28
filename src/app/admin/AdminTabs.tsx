"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconScissors, IconHelp } from "@/components/icons";

export function AdminTabs({ pendentes }: { pendentes: number }) {
  const pathname = usePathname();

  const abas = [
    { href: "/admin", label: "Barbearias", icon: IconScissors },
    { href: "/admin/relatorios", label: "Relatórios", icon: IconHelp, badge: pendentes },
  ];

  return (
    <div className="flex gap-2 mb-5">
      {abas.map((aba) => {
        const Icon = aba.icon;
        const ativo = pathname === aba.href;
        return (
          <Link
            key={aba.href}
            href={aba.href}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] border text-xs font-semibold ${
              ativo ? "border-accent text-accent-label bg-accent-soft" : "border-border text-text-dim"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {aba.label}
            {!!aba.badge && (
              <span className="ml-0.5 rounded-full bg-danger text-white text-[10px] font-bold min-w-[16px] h-4 px-1 flex items-center justify-center">
                {aba.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
