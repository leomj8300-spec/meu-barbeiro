import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAtendimentosPendentes, getConfiguracoes } from "@/lib/queries";
import { PageHeading } from "@/components/PageHeading";
import { IconTagClock } from "@/components/icons";
import { FiadoList } from "./FiadoList";

export default async function FiadoPage() {
  const session = await auth();
  if (!session?.user) return null;

  // As duas buscas não dependem uma da outra — dispara em paralelo em vez
  // de esperar configuracoes pra só então buscar pendentes (o resultado só
  // é descartado no caminho raro de redirect).
  const [configuracoes, pendentes] = await Promise.all([
    getConfiguracoes(session.user.barbeariaId),
    getAtendimentosPendentes(
      session.user.barbeariaId,
      session.user.papel === "barbeiro" ? session.user.id : undefined,
    ),
  ]);
  if (!configuracoes) {
    if (session.user.papel === "dono") redirect("/onboarding");
    redirect("/atendimento");
  }
  if (!configuracoes.fiadoHabilitado) {
    redirect("/atendimento");
  }

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
