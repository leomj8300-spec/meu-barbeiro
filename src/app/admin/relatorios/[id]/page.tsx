import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { verifyAdminSession, ADMIN_COOKIE_NAME } from "@/lib/admin-session";
import { getTicketDetalhe } from "@/lib/admin";
import { logoutAdminAction } from "@/app/actions/admin";
import { IconDoor } from "@/components/icons";
import { TicketDetalhe } from "./TicketDetalhe";

export default async function RelatorioDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token || !(await verifyAdminSession(token))) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const ticket = await getTicketDetalhe(id);
  if (!ticket) notFound();

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-border" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-[720px] mx-auto w-full px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-dim">
            Meu Barbeiro · Admin
          </span>
          <form action={logoutAdminAction}>
            <button type="submit" className="btn-ghost" aria-label="Sair">
              <IconDoor className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[720px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
        <Link href="/admin/relatorios" className="text-text-dim text-xs hover:text-accent-label">
          ← Voltar pros relatórios
        </Link>
        <TicketDetalhe ticket={ticket} />
      </main>
    </div>
  );
}
