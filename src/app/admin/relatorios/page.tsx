import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { verifyAdminSession, ADMIN_COOKIE_NAME } from "@/lib/admin-session";
import { listarTicketsSuporte } from "@/lib/admin";
import { logoutAdminAction } from "@/app/actions/admin";
import { IconDoor } from "@/components/icons";
import { AdminTabs } from "../AdminTabs";
import { AtivarAvisos } from "../AtivarAvisos";

const STATUS_LABEL: Record<string, { texto: string; classe: string }> = {
  aberto: { texto: "Em conversa", classe: "text-text-dim border-border bg-panel-2" },
  aguardando_admin: { texto: "Aguardando você", classe: "text-warn border-warn/40 bg-warn/10" },
  resolvido: { texto: "Resolvido", classe: "text-cons border-cons/40 bg-cons/10" },
  recusado: { texto: "Recusado", classe: "text-danger border-danger/40 bg-danger/10" },
  fechado: { texto: "Fechado", classe: "text-text-dim border-border bg-panel-2" },
};

function fmtData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default async function RelatoriosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token || !(await verifyAdminSession(token))) {
    redirect("/admin/login");
  }

  const tickets = await listarTicketsSuporte().catch(() => []);
  const pendentes = tickets.filter((t) => t.status === "aguardando_admin").length;

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-[720px] mx-auto w-full px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-dim">
            Meu Barbeiro · Admin
          </span>
          <div className="flex items-center gap-2">
            <AtivarAvisos vapidPublicKey={process.env.VAPID_PUBLIC_KEY ?? ""} />
            <form action={logoutAdminAction}>
              <button type="submit" className="btn-ghost" aria-label="Sair">
                <IconDoor className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[720px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
        <div>
          <h1 className="heading-display text-2xl text-text mb-1">Relatórios</h1>
          <p className="text-text-dim text-xs">Chamados de suporte que a IA não resolveu sozinha</p>
        </div>

        <AdminTabs pendentes={pendentes} />

        <div className="flex flex-col gap-2">
          {tickets.length === 0 && (
            <p className="text-text-dim text-xs text-center py-8">Nenhum chamado ainda.</p>
          )}
          {tickets.map((t) => {
            const status = STATUS_LABEL[t.status] ?? STATUS_LABEL.aberto;
            return (
              <Link
                key={t.id}
                href={`/admin/relatorios/${t.id}`}
                className="flex items-center justify-between gap-3 rounded-[10px] border border-border bg-panel-2 px-3.5 py-3 hover:border-accent"
              >
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold truncate">
                    {t.barbeariaNome} <span className="text-text-dim font-normal">· {t.abertoPorNome}</span>
                  </p>
                  <p className="text-text-dim text-xs truncate mt-0.5">{t.resumo ?? "Sem resumo ainda."}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${status.classe}`}>
                    {status.texto}
                  </span>
                  <span className="text-text-dim text-[10px]">{fmtData(t.atualizadoEm)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
