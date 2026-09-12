import { auth } from "@/auth";
import { getAniversariantesDoMes, getClientesComResumo } from "@/lib/queries";
import { PageHeading } from "@/components/PageHeading";
import { IconUser } from "@/components/icons";
import { ClientesView } from "./ClientesView";

export default async function ClientesPage() {
  const session = await auth();
  if (!session?.user) return null;

  // Mês em São Paulo, não do servidor (que roda em UTC) — perto da virada do
  // mês os dois discordam e a lista de aniversariantes sairia errada.
  const mes = Number(
    new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }).slice(5, 7),
  );

  const [clientes, aniversariantes] = await Promise.all([
    getClientesComResumo(session.user.barbeariaId),
    getAniversariantesDoMes(session.user.barbeariaId, mes),
  ]);

  return (
    <>
      <PageHeading
        title="Clientes"
        subtitle="Quem senta na sua cadeira"
        icon={<IconUser className="w-5 h-5" />}
      />
      <ClientesView
        clientes={clientes}
        aniversariantes={aniversariantes}
        ehDono={session.user.papel === "dono"}
      />
    </>
  );
}
