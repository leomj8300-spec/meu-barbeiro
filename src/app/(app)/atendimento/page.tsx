import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getServicos, getConsumos, getConfiguracoes } from "@/lib/queries";
import { CONFIGURACOES_PADRAO } from "@/lib/types";
import { PageHeading } from "@/components/PageHeading";
import { IconScissors } from "@/components/icons";
import { AtendimentoForm } from "./AtendimentoForm";

export default async function AtendimentoPage() {
  const session = await auth();
  if (!session?.user) return null; // proxy.ts já redireciona pra /login

  const configuracoes = await getConfiguracoes(session.user.barbeariaId);
  if (!configuracoes) {
    if (session.user.papel === "dono") redirect("/onboarding");
  }
  const config = configuracoes ?? CONFIGURACOES_PADRAO;

  const [servicos, consumos] = await Promise.all([
    getServicos(session.user.barbeariaId),
    config.controleEstoqueHabilitado ? getConsumos(session.user.barbeariaId) : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeading
        title="Atendimento"
        subtitle="Registrar corte e consumos"
        icon={<IconScissors className="w-5 h-5" />}
      />
      <AtendimentoForm servicos={servicos} consumos={consumos} config={config} />
    </>
  );
}
