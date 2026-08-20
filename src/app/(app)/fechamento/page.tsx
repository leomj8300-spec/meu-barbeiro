import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPeriodoAtual, getHistoricoFechamentos, getConfiguracoes } from "@/lib/queries";
import { CONFIGURACOES_PADRAO } from "@/lib/types";
import { PageHeading } from "@/components/PageHeading";
import { IconCalendarCheck } from "@/components/icons";
import { FechamentoView } from "./FechamentoView";

export default async function FechamentoPage() {
  const session = await auth();
  if (!session?.user) return null;

  if (session.user.papel !== "dono") {
    redirect("/atendimento");
  }

  const configuracoes = await getConfiguracoes(session.user.barbeariaId);
  if (!configuracoes) {
    redirect("/onboarding");
  }
  const config = configuracoes ?? CONFIGURACOES_PADRAO;

  const [periodoAtual, historico] = await Promise.all([
    getPeriodoAtual(session.user.barbeariaId, config.comissaoHabilitada),
    getHistoricoFechamentos(session.user.barbeariaId),
  ]);

  return (
    <>
      <PageHeading
        title="Fechamento"
        subtitle={`Periodicidade: ${config.periodicidadeFechamento}`}
        icon={<IconCalendarCheck className="w-5 h-5" />}
      />
      <FechamentoView
        periodoAtual={periodoAtual}
        historico={historico}
        comissaoHabilitada={config.comissaoHabilitada}
        caixinhaHabilitada={config.caixinhaHabilitada}
      />
    </>
  );
}
