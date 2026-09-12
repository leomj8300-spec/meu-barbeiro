"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Avaliação do atendimento. Pública, igual o agendamento — o cliente não tem
 * login. O token é o que prova que a nota é de quem foi atendido; sem ele,
 * qualquer um daria nota (ou várias) no atendimento alheio.
 */

const avaliarSchema = z.object({
  token: z.string().uuid(),
  nota: z.number().int().min(1, "Escolha uma nota.").max(5, "Nota inválida."),
  comentario: z.string().trim().max(300, "Comentário muito longo.").optional(),
});

export async function avaliarAction(
  input: z.infer<typeof avaliarSchema>,
): Promise<{ error: string | null }> {
  const parsed = avaliarSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { token, nota, comentario } = parsed.data;

  const db = supabaseAdmin();
  const { data: atendimento } = await db
    .from("atendimentos")
    .select("id, avaliado_em")
    .eq("token_avaliacao", token)
    .maybeSingle();

  if (!atendimento) return { error: "Avaliação não encontrada." };
  if (atendimento.avaliado_em) return { error: "Esse atendimento já foi avaliado." };

  const { error } = await db
    .from("atendimentos")
    .update({
      nota,
      avaliacao_comentario: comentario || null,
      avaliado_em: new Date().toISOString(),
    })
    .eq("id", atendimento.id);

  if (error) return { error: "Não foi possível registrar sua nota." };

  revalidatePath("/retencao");
  return { error: null };
}
