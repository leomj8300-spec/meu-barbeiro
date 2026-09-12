import { auth } from "@/auth";
import {
  getAgendamentosParaLembrar,
  getAniversariantesDoMes,
  getAtendimentosParaAvaliar,
  getBarbearia,
  getClientesSumidos,
  getConfiguracoes,
} from "@/lib/queries";
import { CONFIGURACOES_PADRAO } from "@/lib/types";
import { chaveDia } from "@/lib/formato";
import { PageHeading } from "@/components/PageHeading";
import { IconHelp } from "@/components/icons";
import { RetencaoView } from "./RetencaoView";
import { somarDias } from "@/lib/horarios";

export default async function RetencaoPage() {
  const session = await auth();
  if (!session?.user) return null;

  const configuracoes = (await getConfiguracoes(session.user.barbeariaId)) ?? CONFIGURACOES_PADRAO;
  const ehDono = session.user.papel === "dono";
  const meuId = ehDono ? undefined : session.user.id;

  const hoje = chaveDia(new Date());
  const amanha = somarDias(hoje, 1);
  const mes = Number(hoje.slice(5, 7));

  const [lembretes, sumidos, avaliacoes, aniversariantes, barbearia] = await Promise.all([
    configuracoes.modoAtendimento === "agendamento"
      ? getAgendamentosParaLembrar(session.user.barbeariaId, amanha, meuId)
      : Promise.resolve([]),
    getClientesSumidos(session.user.barbeariaId, configuracoes.diasParaRetorno),
    getAtendimentosParaAvaliar(session.user.barbeariaId, meuId),
    getAniversariantesDoMes(session.user.barbeariaId, mes),
    getBarbearia(session.user.barbeariaId),
  ]);

  return (
    <>
      <PageHeading
        title="Retenção"
        subtitle="Quem lembrar, quem chamar de volta"
        icon={<IconHelp className="w-5 h-5" />}
      />
      <RetencaoView
        nomeBarbearia={barbearia?.nome ?? "a barbearia"}
        subdominio={barbearia?.subdominio ?? null}
        lembretes={lembretes}
        sumidos={sumidos}
        avaliacoes={avaliacoes}
        aniversariantes={aniversariantes}
        diasParaRetorno={configuracoes.diasParaRetorno}
      />
    </>
  );
}
