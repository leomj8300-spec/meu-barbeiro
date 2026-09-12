import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getAgendamentosDoDia,
  getAtendentes,
  getClientes,
  getConfiguracoes,
  getServicos,
} from "@/lib/queries";
import { chaveDia } from "@/lib/formato";
import { PageHeading } from "@/components/PageHeading";
import { IconCalendar } from "@/components/icons";
import { AgendaDoDia } from "./AgendaDoDia";

export default async function AgendaPage({
  searchParams,
}: PageProps<"/agenda">) {
  const session = await auth();
  if (!session?.user) return null;

  const configuracoes = await getConfiguracoes(session.user.barbeariaId);
  if (!configuracoes) {
    if (session.user.papel === "dono") redirect("/onboarding");
    redirect("/atendimento");
  }
  if (configuracoes.modoAtendimento !== "agendamento") redirect("/atendimento");

  const params = await searchParams;
  const diaParam = typeof params.dia === "string" ? params.dia : undefined;
  const dia = diaParam && /^\d{4}-\d{2}-\d{2}$/.test(diaParam) ? diaParam : chaveDia(new Date());

  const ehDono = session.user.papel === "dono";
  const [agendamentos, servicos, atendentes, clientes] = await Promise.all([
    getAgendamentosDoDia(
      session.user.barbeariaId,
      dia,
      ehDono ? undefined : session.user.id,
    ),
    getServicos(session.user.barbeariaId),
    ehDono && configuracoes.gestaoEquipeHabilitada
      ? getAtendentes(session.user.barbeariaId)
      : Promise.resolve([]),
    getClientes(session.user.barbeariaId),
  ]);

  return (
    <>
      <PageHeading
        title="Agenda"
        subtitle="Quem tem hora marcada hoje"
        icon={<IconCalendar className="w-5 h-5" />}
      />
      <AgendaDoDia
        dia={dia}
        agendamentos={agendamentos}
        servicos={servicos}
        atendentes={atendentes}
        usuarioId={session.user.id}
        config={configuracoes}
        nomesDeClientes={clientes.map((c) => c.nome)}
      />
    </>
  );
}
