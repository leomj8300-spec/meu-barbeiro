"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { supabaseScoped } from "@/lib/supabase/scoped";
import { TEMA_CORES } from "@/lib/theme";

const preferenciasSchema = z.object({
  temaCor: z.enum(TEMA_CORES),
});

export type PreferenciasInput = z.infer<typeof preferenciasSchema>;

export async function salvarPreferenciasTemaAction(
  input: PreferenciasInput,
): Promise<{ error: string | null }> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };

  const parsed = preferenciasSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { error } = await (await supabaseScoped())
    .from("usuarios")
    .update({ tema_cor: parsed.data.temaCor })
    .eq("id", session.user.id);

  if (error) {
    return { error: "Não foi possível salvar as preferências." };
  }

  revalidatePath("/", "layout");
  return { error: null };
}
