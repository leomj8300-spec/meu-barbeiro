import { getBarbeariaPublica } from "@/lib/publico";
import { AgendarPublico } from "./AgendarPublico";

export const metadata = {
  title: "Agendar horário",
};

export default async function AgendarPage({
  params,
}: {
  params: Promise<{ subdominio: string }>;
}) {
  const { subdominio } = await params;
  const barbearia = await getBarbeariaPublica(subdominio);

  // Barbearia inexistente, que não marca hora ou que não publicou a agenda
  // caem todas aqui — a mesma resposta pros três casos, pra essa página não
  // virar uma forma de descobrir quais barbearias existem no sistema.
  if (!barbearia) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6 bg-bg">
        <div className="panel p-6 max-w-sm text-center">
          <h1 className="heading-display text-xl text-text mb-1.5">
            Agendamento indisponível
          </h1>
          <p className="text-text-dim text-sm">
            Esta barbearia não está aceitando agendamento pela internet no momento. Entre
            em contato com ela para marcar seu horário.
          </p>
        </div>
      </main>
    );
  }

  return <AgendarPublico subdominio={subdominio} barbearia={barbearia} />;
}
