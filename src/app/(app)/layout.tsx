import { auth } from "@/auth";
import { getConfiguracoes } from "@/lib/queries";
import { CONFIGURACOES_PADRAO } from "@/lib/types";
import { AppShell } from "./AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) return null; // proxy.ts já redireciona pra /login

  const configuracoes = await getConfiguracoes(session.user.barbeariaId);
  const config = configuracoes ?? CONFIGURACOES_PADRAO;

  return (
    <AppShell nome={session.user.name ?? ""} papel={session.user.papel} config={config}>
      {children}
    </AppShell>
  );
}
