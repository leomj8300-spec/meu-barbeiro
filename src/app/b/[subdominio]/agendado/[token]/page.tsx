import { supabaseAdmin } from "@/lib/supabase/server";
import { getBarbeariaPublica } from "@/lib/publico";
import { fmtHora, rotuloDia } from "@/lib/formato";
import { DesmarcarBotao } from "./DesmarcarBotao";

export const metadata = {
  title: "Seu horário",
};

export default async function AgendadoPage({
  params,
}: {
  params: Promise<{ subdominio: string; token: string }>;
}) {
  const { subdominio, token } = await params;
  const barbearia = await getBarbeariaPublica(subdominio);

  // O token é o segredo que prova que o horário é de quem abriu o link, então
  // a busca é por ele — e ainda presa à barbearia do endereço.
  const { data: agendamento } = barbearia
    ? await supabaseAdmin()
        .from("agendamentos")
        .select("inicio, status, cliente, agendamento_servicos(nome)")
        .eq("token_publico", token)
        .eq("barbearia_id", barbearia.id)
        .maybeSingle()
    : { data: null };

  if (!barbearia || !agendamento) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6 bg-bg">
        <div className="panel p-6 max-w-sm text-center">
          <h1 className="heading-display text-xl text-text mb-1.5">Horário não encontrado</h1>
          <p className="text-text-dim text-sm">
            Esse link não vale mais. Se precisar, entre em contato com a barbearia.
          </p>
        </div>
      </main>
    );
  }

  const servicos = (agendamento.agendamento_servicos ?? []).map(
    (s: { nome: string }) => s.nome,
  );
  const ativo = agendamento.status === "marcado";

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-10 bg-bg">
      <div className="panel p-6 max-w-sm w-full text-center">
        <p
          className={`font-mono text-[10px] uppercase tracking-[0.14em] font-semibold ${
            ativo ? "text-cons" : "text-text-dim"
          }`}
        >
          {ativo ? "Horário marcado" : "Horário desmarcado"}
        </p>
        <h1 className="heading-display text-2xl text-text mt-2">
          {rotuloDia(agendamento.inicio)} às {fmtHora(agendamento.inicio)}
        </h1>
        <p className="text-text-dim text-sm mt-1.5">
          {barbearia.nome}
          {servicos.length > 0 && ` · ${servicos.join(", ")}`}
        </p>
        <p className="text-text-dim text-sm mt-0.5">{agendamento.cliente}</p>

        {ativo && <DesmarcarBotao token={token} />}
      </div>
    </main>
  );
}
