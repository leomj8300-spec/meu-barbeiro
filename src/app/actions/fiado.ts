"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { supabaseScoped } from "@/lib/supabase/scoped";

export async function marcarComoPagoAction(atendimentoId: string): Promise<{ error: string | null }> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };

  let query = (await supabaseScoped())
    .from("atendimentos")
    .update({ pago: true, data_pagamento: new Date().toISOString() })
    .eq("id", atendimentoId)
    .eq("barbearia_id", session.user.barbeariaId)
    .eq("pago", false);

  if (session.user.papel === "barbeiro") {
    query = query.eq("barbeiro_id", session.user.id);
  }

  const { data, error } = await query.select("id");
  if (error) return { error: "Não foi possível marcar como pago." };
  if (!data || data.length === 0) return { error: "Atendimento não encontrado ou já pago." };

  revalidatePath("/fiado");
  return { error: null };
}

export async function marcarClienteComoPagoAction(
  cliente: string,
): Promise<{ error: string | null }> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };

  let query = (await supabaseScoped())
    .from("atendimentos")
    .update({ pago: true, data_pagamento: new Date().toISOString() })
    .eq("barbearia_id", session.user.barbeariaId)
    .eq("cliente", cliente)
    .eq("pago", false);

  if (session.user.papel === "barbeiro") {
    query = query.eq("barbeiro_id", session.user.id);
  }

  const { error } = await query;
  if (error) return { error: "Não foi possível marcar como pago." };

  revalidatePath("/fiado");
  return { error: null };
}
