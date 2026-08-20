import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAtendimentosPendentes, getConfiguracoes } from "@/lib/queries";
import { PageHeading } from "@/components/PageHeading";
import { IconTagClock } from "@/components/icons";
import { FiadoList } from "./FiadoList";

export default async function FiadoPage() {
  const session = await auth();
  if (!session?.user) return null;

  const configuracoes = await getConfiguracoes(session.user.barbeariaId);
  if (!configuracoes) {
    if (session.user.papel === "dono") redirect("/onboarding");
    redirect("/atendimento");
  }
  if (!configuracoes.fiadoHabilitado) {
    redirect("/atendimento");
  }

  const pendentes = await getAtendimentosPendentes(
    session.user.barbeariaId,
    session.user.papel === "barbeiro" ? session.user.id : undefined,
  );

  return (
    <>
      <PageHeading
        title="Fiado"
        subtitle="Atendimentos pendentes de pagamento"
        icon={<IconTagClock className="w-5 h-5" />}
      />
      <FiadoList pendentes={pendentes} vePorBarbeiro={session.user.papel === "dono"} />
    </>
  );
}
