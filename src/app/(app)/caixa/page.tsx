import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getConfiguracoes,
  getPeriodoAtual,
  getHistoricoFechamentos,
  getMinhaCaixinha,
  getCaixinhaGeral,
  getComissoes,
} from "@/lib/queries";
import { PageHeading } from "@/components/PageHeading";
import { IconCoin } from "@/components/icons";
import { CaixaView } from "./CaixaView";

export default async function CaixaPage() {
  const session = await auth();
  if (!session?.user) return null;

  const ehDono = session.user.papel === "dono";

  const configuracoes = await getConfiguracoes(session.user.barbeariaId);
  if (!configuracoes) {
    if (ehDono) redirect("/onboarding");
    redirect("/atendimento");
  }

  // Pro barbeiro, Caixa só existe se sobrar algo pessoal pra mostrar — o
  // resumo de período da barbearia inteira e o fechamento são só do dono.
  if (!ehDono && !configuracoes.caixinhaHabilitada && !configuracoes.comissaoHabilitada) {
    redirect("/atendimento");
  }

  const [periodoAtual, historico, minhaCaixinha, caixinhaGeral, comissoes] = await Promise.all([
    getPeriodoAtual(
      session.user.barbeariaId,
      configuracoes.comissaoHabilitada,
      ehDono ? undefined : session.user.id,
    ),
    ehDono ? getHistoricoFechamentos(session.user.barbeariaId) : Promise.resolve([]),
    configuracoes.caixinhaHabilitada
      ? getMinhaCaixinha(session.user.barbeariaId, session.user.id)
      : Promise.resolve(null),
    configuracoes.caixinhaHabilitada && ehDono
      ? getCaixinhaGeral(session.user.barbeariaId)
      : Promise.resolve(null),
    configuracoes.comissaoHabilitada
      ? getComissoes(session.user.barbeariaId, ehDono ? undefined : session.user.id)
      : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeading
        title="Caixa"
        subtitle={ehDono ? "Fechamento, caixinha e comissão" : "Seus números deste período"}
        icon={<IconCoin className="w-5 h-5" />}
      />
      <CaixaView
        ehDono={ehDono}
        periodoAtual={periodoAtual}
        historico={historico}
        minhaCaixinha={minhaCaixinha}
        caixinhaGeral={caixinhaGeral}
        comissoes={comissoes}
        caixinhaHabilitada={configuracoes.caixinhaHabilitada}
        comissaoHabilitada={configuracoes.comissaoHabilitada}
      />
    </>
  );
}
