import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getConfiguracoes, getPreferenciasTema } from "@/lib/queries";
import { PageHeading } from "@/components/PageHeading";
import { IconSliders } from "@/components/icons";
import { PreferenciasTema } from "@/components/PreferenciasTema";
import { ConfiguracoesForm } from "./ConfiguracoesForm";

export default async function ConfiguracoesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const ehDono = session.user.papel === "dono";

  const [prefs, configuracoes] = await Promise.all([
    getPreferenciasTema(session.user.id),
    ehDono ? getConfiguracoes(session.user.barbeariaId) : Promise.resolve(null),
  ]);

  if (ehDono && !configuracoes) {
    redirect("/onboarding");
  }

  return (
    <>
      <PageHeading
        title="Configurações"
        subtitle={ehDono ? "Suas preferências e as da barbearia" : "Suas preferências pessoais"}
        icon={<IconSliders className="w-5 h-5" />}
      />

      <div className="flex flex-col gap-6">
        <section>
          <h2 className="heading-display text-lg text-text mb-3">Preferências pessoais</h2>
          <PreferenciasTema temaCor={prefs.temaCor} />
        </section>

        {ehDono && configuracoes && (
          <section>
            <div className="h-px bg-border mb-6" />
            <h2 className="heading-display text-lg text-text mb-3">Configurações da barbearia</h2>
            <ConfiguracoesForm configuracoes={configuracoes} />
          </section>
        )}
      </div>
    </>
  );
}
