import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getComissoes, getConfiguracoes } from "@/lib/queries";
import { PageHeading } from "@/components/PageHeading";
import { IconPercent } from "@/components/icons";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ComissaoPage() {
  const session = await auth();
  if (!session?.user) return null;

  const configuracoes = await getConfiguracoes(session.user.barbeariaId);
  if (!configuracoes) {
    if (session.user.papel === "dono") redirect("/onboarding");
    redirect("/atendimento");
  }
  if (!configuracoes.comissaoHabilitada) {
    redirect("/atendimento");
  }

  const comissoes = await getComissoes(
    session.user.barbeariaId,
    session.user.papel === "barbeiro" ? session.user.id : undefined,
  );

  return (
    <>
      <PageHeading
        title="Comissão"
        subtitle="Acumulado sobre serviços comissionáveis pagos"
        icon={<IconPercent className="w-5 h-5" />}
      />

      <div className="flex flex-col gap-2">
        {comissoes.length === 0 && (
          <p className="text-text-dim text-sm text-center py-8">Nenhum atendimento pago ainda.</p>
        )}
        {comissoes.map((c) => (
          <div key={c.barbeiroId} className="panel-accent p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[14px] font-semibold">{c.nome}</span>
              <span className="rounded-[10px] bg-accent-soft text-accent-label text-[10.5px] font-bold px-1.5 py-0.5">
                {c.comissaoPct}%
              </span>
            </div>
            <p className="text-text-dim text-[11.5px] mb-2">
              {c.qtdAtendimentos} atendimento{c.qtdAtendimentos !== 1 ? "s" : ""} · base comissionável{" "}
              {fmt(c.baseComissionavel)}
            </p>
            <p className="font-mono text-2xl font-bold text-accent-label">{fmt(c.valorComissao)}</p>
          </div>
        ))}
      </div>
    </>
  );
}
