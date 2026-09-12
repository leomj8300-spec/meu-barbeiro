import { supabaseAdmin } from "@/lib/supabase/server";
import { AvaliarForm } from "./AvaliarForm";

export const metadata = {
  title: "Como foi o atendimento?",
};

export default async function AvaliarPage({
  params,
}: {
  params: Promise<{ subdominio: string; token: string }>;
}) {
  const { subdominio, token } = await params;

  const db = supabaseAdmin();
  const { data: barbearia } = await db
    .from("barbearias")
    .select("id, nome")
    .eq("subdominio", subdominio)
    .maybeSingle();

  const { data: atendimento } = barbearia
    ? await db
        .from("atendimentos")
        .select("cliente, nota, avaliado_em")
        .eq("token_avaliacao", token)
        .eq("barbearia_id", barbearia.id)
        .maybeSingle()
    : { data: null };

  if (!barbearia || !atendimento) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6 bg-bg">
        <div className="panel p-6 max-w-sm text-center">
          <h1 className="heading-display text-xl text-text mb-1.5">Link inválido</h1>
          <p className="text-text-dim text-sm">
            Esse link de avaliação não vale mais.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-10 bg-bg">
      <div className="panel p-6 max-w-sm w-full">
        <AvaliarForm
          token={token}
          barbearia={barbearia.nome}
          cliente={atendimento.cliente}
          notaExistente={atendimento.avaliado_em ? atendimento.nota : null}
        />
      </div>
    </main>
  );
}
