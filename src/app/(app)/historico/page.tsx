import { auth } from "@/auth";
import { getHistoricoAtendimentos } from "@/lib/queries";
import { PageHeading } from "@/components/PageHeading";
import { IconHistory } from "@/components/icons";
import { HistoricoList } from "./HistoricoList";

export default async function HistoricoPage() {
  const session = await auth();
  if (!session?.user) return null;

  const atendimentos = await getHistoricoAtendimentos(
    session.user.barbeariaId,
    session.user.papel === "barbeiro" ? session.user.id : undefined,
  );

  return (
    <>
      <PageHeading
        title="Histórico"
        subtitle="Atendimentos registrados"
        icon={<IconHistory className="w-5 h-5" />}
      />
      <HistoricoList atendimentos={atendimentos} vePorBarbeiro={session.user.papel === "dono"} />
    </>
  );
}
