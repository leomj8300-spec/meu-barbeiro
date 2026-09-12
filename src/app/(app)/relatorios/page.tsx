import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getRelatorioGerencial } from "@/lib/queries";
import { PageHeading } from "@/components/PageHeading";
import { IconCoin } from "@/components/icons";
import { RelatoriosView } from "./RelatoriosView";

const PERIODOS = [30, 90, 180] as const;

export default async function RelatoriosPage({
  searchParams,
}: PageProps<"/relatorios">) {
  const session = await auth();
  if (!session?.user) return null;

  // Números da barbearia inteira são do dono: o barbeiro vê o próprio
  // desempenho no Caixa, não o faturamento da casa.
  if (session.user.papel !== "dono") redirect("/atendimento");

  const params = await searchParams;
  const pedido = Number(params.dias);
  const dias = PERIODOS.includes(pedido as (typeof PERIODOS)[number]) ? pedido : 30;

  const relatorio = await getRelatorioGerencial(session.user.barbeariaId, dias);

  return (
    <>
      <PageHeading
        title="Relatórios"
        subtitle="Onde o dinheiro entra, e quando não entra"
        icon={<IconCoin className="w-5 h-5" />}
      />
      <RelatoriosView relatorio={relatorio} dias={dias} periodos={[...PERIODOS]} />
    </>
  );
}
