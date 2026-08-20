import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMinhaCaixinha, getCaixinhaGeral, getConfiguracoes } from "@/lib/queries";
import { PageHeading } from "@/components/PageHeading";
import { IconCoin } from "@/components/icons";
import { CaixinhaView } from "./CaixinhaView";

export default async function CaixinhaPage() {
  const session = await auth();
  if (!session?.user) return null;

  const configuracoes = await getConfiguracoes(session.user.barbeariaId);
  if (!configuracoes) {
    if (session.user.papel === "dono") redirect("/onboarding");
    redirect("/atendimento");
  }
  if (!configuracoes.caixinhaHabilitada) {
    redirect("/atendimento");
  }

  const minha = await getMinhaCaixinha(session.user.barbeariaId, session.user.id);
  const geral =
    session.user.papel === "dono" ? await getCaixinhaGeral(session.user.barbeariaId) : null;

  return (
    <>
      <PageHeading title="Caixinha" subtitle="Gorjetas individuais" icon={<IconCoin className="w-5 h-5" />} />
      <CaixinhaView minha={minha} geral={geral} />
    </>
  );
}
