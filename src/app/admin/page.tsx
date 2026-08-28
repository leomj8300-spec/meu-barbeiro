import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAdminSession, ADMIN_COOKIE_NAME } from "@/lib/admin-session";
import { listarBarbearias, getEstatisticasGerais, listarTicketsSuporte } from "@/lib/admin";
import { logoutAdminAction } from "@/app/actions/admin";
import { IconDoor, IconScissors, IconUsers } from "@/components/icons";
import { CriarBarbeariaForm } from "./CriarBarbeariaForm";
import { BarbeariasList } from "./BarbeariasList";
import { AdminTabs } from "./AdminTabs";
import { AtivarAvisos } from "./AtivarAvisos";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token || !(await verifyAdminSession(token))) {
    redirect("/admin/login");
  }

  const [barbearias, estatisticas, tickets] = await Promise.all([
    listarBarbearias(),
    getEstatisticasGerais(),
    // Mesma cautela do layout do tenant: enquanto a migração do chat de
    // suporte não estiver aplicada nesse ambiente, o painel principal não
    // pode quebrar por causa disso.
    listarTicketsSuporte().catch(() => []),
  ]);
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

      <main className="flex-1 w-full max-w-[720px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        <div>
          <h1 className="heading-display text-2xl text-text mb-1">Barbearias</h1>
          <p className="text-text-dim text-xs">Cadastro e acesso das barbearias clientes</p>
        </div>

        <AdminTabs pendentes={pendentes} />

        <div className="grid grid-cols-2 gap-3">
          <div className="panel-accent p-5 flex flex-col items-center gap-2 text-center">
            <span className="w-11 h-11 rounded-full bg-accent-soft text-accent-label flex items-center justify-center">
              <IconScissors className="w-5 h-5" />
            </span>
            <p className="font-mono text-4xl font-bold text-accent-label leading-none">
              {estatisticas.totalBarbearias}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">
              Barbearias cadastradas
            </p>
          </div>
          <div className="panel-accent p-5 flex flex-col items-center gap-2 text-center">
            <span className="w-11 h-11 rounded-full bg-accent-soft text-accent-label flex items-center justify-center">
              <IconUsers className="w-5 h-5" />
            </span>
            <p className="font-mono text-4xl font-bold text-accent-label leading-none">
              {estatisticas.totalBarbeiros}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">
              Barbeiros cadastrados
            </p>
          </div>
        </div>

        <CriarBarbeariaForm />

        <section className="panel p-4">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold mb-3">
            Já cadastradas
          </h2>
          {barbearias.length === 0 && (
            <p className="text-text-dim text-xs">Nenhuma barbearia cadastrada ainda.</p>
          )}
          <BarbeariasList barbearias={barbearias} />
        </section>
      </main>
    </div>
  );
}
