import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getServicos,
  getConsumos,
  getConfiguracoes,
  getAgendamento,
  getClientes,
  getFormasPagamento,
} from "@/lib/queries";
import { CONFIGURACOES_PADRAO } from "@/lib/types";
import { fmtHora } from "@/lib/formato";
import { PageHeading } from "@/components/PageHeading";
import { IconScissors } from "@/components/icons";
import { AtendimentoForm } from "./AtendimentoForm";

export default async function AtendimentoPage({ searchParams }: PageProps<"/atendimento">) {
  const session = await auth();
  if (!session?.user) return null; // proxy.ts já redireciona pra /login

  // As buscas não dependem uma da outra — dispara tudo junto em vez de
  // esperar configuracoes pra só então buscar consumos (economiza uma
  // viagem de rede a cada troca de aba).
  const [configuracoes, servicos, todosConsumos, clientes, formasPagamento] = await Promise.all([
    getConfiguracoes(session.user.barbeariaId),
    getServicos(session.user.barbeariaId),
    getConsumos(session.user.barbeariaId),
    getClientes(session.user.barbeariaId),
    getFormasPagamento(session.user.barbeariaId, true),
  ]);
  if (!configuracoes) {
    if (session.user.papel === "dono") redirect("/onboarding");
  }
  const config = configuracoes ?? CONFIGURACOES_PADRAO;
  const consumos = config.controleEstoqueHabilitado ? todosConsumos : [];

  // Marcando hora, essa tela só existe como o segundo passo do agendamento —
  // chegar aqui sem um horário na mão significa que o caminho foi furado.
  const params = await searchParams;
  const agendamentoId = typeof params.agendamento === "string" ? params.agendamento : undefined;
  const agendando = config.modoAtendimento === "agendamento";
  if (agendando && !agendamentoId) redirect("/agenda");

  const agendamento = agendamentoId
    ? await getAgendamento(session.user.barbeariaId, agendamentoId)
    : null;
  if (agendando && !agendamento) redirect("/agenda");
  if (agendamento && agendamento.status !== "marcado") redirect("/agenda");

  return (
    <>
      <PageHeading
        title="Atendimento"
        subtitle={
          agendamento
            ? `${fmtHora(agendamento.inicio)} · ${agendamento.cliente}`
            : "Registrar corte e consumos"
        }
        icon={<IconScissors className="w-5 h-5" />}
      />
      <AtendimentoForm
        servicos={servicos}
        consumos={consumos}
        config={config}
        agendamentoId={agendamento?.id}
        clienteInicial={agendamento?.cliente}
        servicosIniciais={agendamento?.servicos.map((s) => s.servicoId)}
        nomesDeClientes={clientes.map((c) => c.nome)}
        formasPagamento={formasPagamento}
      />
    </>
  );
}
