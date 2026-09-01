import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getConfiguracoes } from "@/lib/queries";
import { PageHeading } from "@/components/PageHeading";
import { IconSliders } from "@/components/icons";
import { ConfiguracoesForm } from "./ConfiguracoesForm";

export default async function ConfiguracoesPage() {
  const session = await auth();
  if (!session?.user) return null;

  // Essa tela é só as flags de negócio da barbearia — sempre dono. As
  // preferências pessoais (tema, cor de destaque) moraram aqui antes, mas
  // agora têm tela própria em /aparencia, visível pros dois papéis.
  if (session.user.papel !== "dono") redirect("/aparencia");

  const configuracoes = await getConfiguracoes(session.user.barbeariaId);
  if (!configuracoes) redirect("/onboarding");

  return (
    <>
      <PageHeading
        title="Configurações"
        subtitle="Preferências da barbearia"
        icon={<IconSliders className="w-5 h-5" />}
      />
      <ConfiguracoesForm configuracoes={configuracoes} />
    </>
  );
}
