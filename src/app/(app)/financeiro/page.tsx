import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getAtendentes,
  getContas,
  getFormasPagamento,
  getResumoFinanceiro,
  getVales,
} from "@/lib/queries";
import { PageHeading } from "@/components/PageHeading";
import { IconCoin } from "@/components/icons";
import { FinanceiroView } from "./FinanceiroView";

export default async function FinanceiroPage() {
  const session = await auth();
  if (!session?.user) return null;

  // Aluguel, fornecedor e taxa de maquininha são coisa do dono.
  if (session.user.papel !== "dono") redirect("/atendimento");

  const [resumo, contas, formas, vales, atendentes] = await Promise.all([
    getResumoFinanceiro(session.user.barbeariaId, 30),
    getContas(session.user.barbeariaId),
    getFormasPagamento(session.user.barbeariaId),
    getVales(session.user.barbeariaId),
    getAtendentes(session.user.barbeariaId),
  ]);

  return (
    <>
      <PageHeading
        title="Financeiro"
        subtitle="O que entra, o que sai e o que sobra"
        icon={<IconCoin className="w-5 h-5" />}
      />
      <FinanceiroView
        resumo={resumo}
        contas={contas}
        formas={formas}
        vales={vales}
        atendentes={atendentes}
      />
    </>
  );
}
