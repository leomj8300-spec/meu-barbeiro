import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBarbeiros, getConfiguracoes } from "@/lib/queries";
import { PageHeading } from "@/components/PageHeading";
import { IconUsers } from "@/components/icons";
import { EquipeManager } from "./EquipeManager";

export default async function EquipePage() {
  const session = await auth();
  if (!session?.user) return null;

  if (session.user.papel !== "dono") {
    redirect("/atendimento");
  }

  const configuracoes = await getConfiguracoes(session.user.barbeariaId);
  if (!configuracoes) {
    redirect("/onboarding");
  }
  if (!configuracoes.gestaoEquipeHabilitada) {
    redirect("/atendimento");
  }

  const barbeiros = await getBarbeiros(session.user.barbeariaId);

  return (
    <>
      <PageHeading title="Equipe" subtitle="Barbeiros da sua barbearia" icon={<IconUsers className="w-5 h-5" />} />
      <EquipeManager barbeiros={barbeiros} comissaoPadraoSugerida={configuracoes.comissaoPadraoPct} />
    </>
  );
}
