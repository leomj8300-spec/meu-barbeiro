import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAdminSession, ADMIN_COOKIE_NAME } from "@/lib/admin-session";
import { listarBarbearias } from "@/lib/admin";
import { logoutAdminAction } from "@/app/actions/admin";
import { IconDoor } from "@/components/icons";
import { CriarBarbeariaForm } from "./CriarBarbeariaForm";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token || !(await verifyAdminSession(token))) {
    redirect("/admin/login");
  }

  const barbearias = await listarBarbearias();

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-[720px] mx-auto w-full px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-dim">
            Senas Barber · Admin
          </span>
          <form action={logoutAdminAction}>
            <button type="submit" className="btn-ghost" aria-label="Sair">
              <IconDoor className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[720px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        <div>
          <h1 className="heading-display text-2xl text-text mb-1">Barbearias</h1>
          <p className="text-text-dim text-xs">Cadastro e acesso das barbearias clientes</p>
        </div>

        <CriarBarbeariaForm />

        <section className="panel p-4">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold mb-3">
            Já cadastradas
          </h2>
          {barbearias.length === 0 && (
            <p className="text-text-dim text-xs">Nenhuma barbearia cadastrada ainda.</p>
          )}
          <div className="flex flex-col gap-1.5">
            {barbearias.map((b) => (
              <div key={b.id} className="rounded-[10px] border border-border bg-panel-2 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[13.5px] font-semibold">{b.nome}</span>
                  <span className="font-mono text-[11px] text-text-dim">/b/{b.subdominio}/login</span>
                </div>
                {b.donoNome && (
                  <p className="text-text-dim text-[11px] mt-0.5">
                    {b.donoNome} · {b.donoEmail}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
