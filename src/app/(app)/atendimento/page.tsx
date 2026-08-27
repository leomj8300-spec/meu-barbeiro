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

  // As três buscas não dependem uma da outra — dispara tudo junto em vez de
  // esperar configuracoes pra só então buscar consumos (economiza uma
  // viagem de rede a cada troca de aba).
  const [configuracoes, servicos, todosConsumos] = await Promise.all([
    getConfiguracoes(session.user.barbeariaId),
    getServicos(session.user.barbeariaId),
    getConsumos(session.user.barbeariaId),
  ]);
  if (!configuracoes) {
    if (session.user.papel === "dono") redirect("/onboarding");
  }
  const config = configuracoes ?? CONFIGURACOES_PADRAO;
  const consumos = config.controleEstoqueHabilitado ? todosConsumos : [];

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
