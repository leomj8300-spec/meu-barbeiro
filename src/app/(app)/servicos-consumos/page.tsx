import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getServicos, getConsumos, getConfiguracoes } from "@/lib/queries";
import { CONFIGURACOES_PADRAO } from "@/lib/types";
import { PageHeading } from "@/components/PageHeading";
import { IconScissors } from "@/components/icons";
import { ServicosManager } from "./ServicosManager";
import { ConsumosManager } from "./ConsumosManager";

export default async function ServicosConsumosPage() {
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

  const [servicos, consumos] = await Promise.all([
    getServicos(session.user.barbeariaId),
    config.controleEstoqueHabilitado ? getConsumos(session.user.barbeariaId) : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeading title="Serviços e consumos" subtitle="Cadastro e preços" icon={<IconScissors className="w-5 h-5" />} />
      <div className="flex flex-col gap-6">
        <ServicosManager servicos={servicos} />
        {config.controleEstoqueHabilitado && <ConsumosManager consumos={consumos} />}
      </div>
    </>
  );
}
