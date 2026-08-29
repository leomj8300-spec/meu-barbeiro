import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getConfiguracoes, getTicketAtual, usuarioDaSessaoExiste } from "@/lib/queries";
import { CONFIGURACOES_PADRAO } from "@/lib/types";
import { AppShell } from "./AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) return null; // proxy.ts já redireciona pra /login

  // O JWT continua "válido" (assinatura bate) mesmo depois de a conta ou a
  // barbearia inteira serem excluídas — sem essa checagem, cai silenciosamente
  // no onboarding de uma barbearia fantasma em vez de ser desconectado.
  if (!(await usuarioDaSessaoExiste(session.user.id))) {
    redirect("/api/sessao-invalida");
  }

  const [configuracoes, ticketAtual] = await Promise.all([
    getConfiguracoes(session.user.barbeariaId),
    // Suporte é um extra por cima do app — se essa busca falhar por
    // qualquer motivo (ex: migração do chat de suporte ainda não aplicada
    // nesse ambiente), o app inteiro não pode travar por causa disso.
    getTicketAtual(session.user.barbeariaId, session.user.id).catch(() => null),
  ]);
  const config = configuracoes ?? CONFIGURACOES_PADRAO;

  return (
    <AppShell
      nome={session.user.name ?? ""}
      papel={session.user.papel}
      config={config}
      ticketSuporteInicial={
        ticketAtual ? { ticketId: ticketAtual.ticket.id, mensagens: ticketAtual.mensagens } : null
      }
    >
      {children}
    </AppShell>
  );
}
