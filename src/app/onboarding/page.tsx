import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getConfiguracoes, usuarioDaSessaoExiste } from "@/lib/queries";
import { IconScissors } from "@/components/icons";
import { OnboardingWizard } from "./OnboardingWizard";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) return null;

  // Mesma checagem de (app)/layout.tsx: um JWT de dono continua "válido"
  // mesmo depois da barbearia ter sido excluída — sem isso, cai no
  // onboarding de uma barbearia fantasma em vez de ser desconectado.
  if (!(await usuarioDaSessaoExiste(session.user.id))) {
    redirect("/api/sessao-invalida");
  }

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
            <IconScissors className="w-6 h-6" />
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
