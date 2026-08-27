import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAdminSession, ADMIN_COOKIE_NAME } from "@/lib/admin-session";
import { listarBarbearias, getEstatisticasGerais } from "@/lib/admin";
import { logoutAdminAction } from "@/app/actions/admin";
import { IconDoor } from "@/components/icons";
import { CriarBarbeariaForm } from "./CriarBarbeariaForm";
import { BarbeariasList } from "./BarbeariasList";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token || !(await verifyAdminSession(token))) {
    redirect("/admin/login");
  }

  const [barbearias, estatisticas] = await Promise.all([
    listarBarbearias(),
    getEstatisticasGerais(),
  ]);

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-border">
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

      <main className="flex-1 w-full max-w-[720px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        <div>
          <h1 className="heading-display text-2xl text-text mb-1">Barbearias</h1>
          <p className="text-text-dim text-xs">Cadastro e acesso das barbearias clientes</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="panel p-3.5">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-dim">
              Barbearias
            </p>
            <p className="font-mono text-2xl font-bold mt-0.5">{estatisticas.totalBarbearias}</p>
          </div>
          <div className="panel p-3.5">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-dim">
              Donos · Barbeiros
            </p>
            <p className="font-mono text-2xl font-bold mt-0.5">
              {estatisticas.totalDonos} · {estatisticas.totalBarbeiros}
            </p>
          </div>
          <div className="panel p-3.5">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-dim">
              Atendimentos
            </p>
            <p className="font-mono text-2xl font-bold mt-0.5">{estatisticas.totalAtendimentos}</p>
          </div>
          <div className="panel-accent p-3.5">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-dim">
              Faturado (total)
            </p>
            <p className="font-mono text-2xl font-bold text-accent-label mt-0.5">
              {fmt(estatisticas.faturamentoTotal)}
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
