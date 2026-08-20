"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { supabaseScoped } from "@/lib/supabase/scoped";
import { getConfiguracoes, getPeriodoAtual } from "@/lib/queries";

export async function fecharPeriodoAction(): Promise<{ error: string | null }> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };
  if (session.user.papel !== "dono") return { error: "Apenas o dono pode fechar o período." };

  const configuracoes = await getConfiguracoes(session.user.barbeariaId);
  const comissaoHabilitada = configuracoes?.comissaoHabilitada ?? false;
  const periodo = await getPeriodoAtual(session.user.barbeariaId, comissaoHabilitada);

  if (periodo.totais.qtdAtendimentos === 0 && periodo.totais.caixinhaTotal === 0) {
    return { error: "Não há movimento no período atual para fechar." };
  }

  const agora = new Date().toISOString();
  const { error } = await (await supabaseScoped()).from("fechamentos_semanais").insert({
    barbearia_id: session.user.barbeariaId,
    semana_inicio: periodo.inicio,
    semana_fim: agora,
    totais: periodo.totais,
  });
  if (error) return { error: "Não foi possível fechar o período." };

  revalidatePath("/fechamento");
  return { error: null };
}
