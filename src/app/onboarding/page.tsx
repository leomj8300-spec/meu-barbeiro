import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getConfiguracoes } from "@/lib/queries";
import { IconBarberPole } from "@/components/icons";
import { OnboardingWizard } from "./OnboardingWizard";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) return null;

  if (session.user.papel !== "dono") {
    redirect("/atendimento");
  }

  const configuracoes = await getConfiguracoes(session.user.barbeariaId);
  if (configuracoes) {
    redirect("/atendimento");
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[440px]">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-11 h-11 rounded-[10px] bg-accent text-on-accent flex items-center justify-center shrink-0">
            <IconBarberPole className="w-6 h-6" />
          </span>
          <div>
            <h1 className="heading-display text-xl text-text leading-none">Configurar barbearia</h1>
            <p className="text-text-dim text-xs mt-1">Leva menos de um minuto.</p>
          </div>
        </div>
        <OnboardingWizard />
      </div>
    </div>
  );
}
