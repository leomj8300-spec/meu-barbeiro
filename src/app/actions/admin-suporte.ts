"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/admin-session";

async function exigirAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return !!token && (await verifyAdminSession(token));
}

const responderTicketSchema = z.object({
  ticketId: z.string().uuid(),
  conteudo: z.string().trim().min(1, "Escreva uma resposta."),
});

export async function responderTicketAction(
  input: z.infer<typeof responderTicketSchema>,
): Promise<{ error: string | null }> {
  if (!(await exigirAdmin())) return { error: "Sessão de administrador expirada." };

  const parsed = responderTicketSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { error } = await supabaseAdmin().from("suporte_mensagens").insert({
    ticket_id: parsed.data.ticketId,
    remetente: "admin",
    conteudo: parsed.data.conteudo,
  });
  if (error) return { error: "Não foi possível enviar a resposta." };

  revalidatePath(`/admin/relatorios/${parsed.data.ticketId}`);
  revalidatePath("/admin/relatorios");
  return { error: null };
}

const mudarStatusSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(["resolvido", "recusado", "fechado"]),
  mensagem: z.string().trim().optional(),
});

export async function mudarStatusTicketAction(
  input: z.infer<typeof mudarStatusSchema>,
): Promise<{ error: string | null }> {
  if (!(await exigirAdmin())) return { error: "Sessão de administrador expirada." };

  const parsed = mudarStatusSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const db = supabaseAdmin();

  if (parsed.data.mensagem) {
    await db.from("suporte_mensagens").insert({
      ticket_id: parsed.data.ticketId,
      remetente: "admin",
      conteudo: parsed.data.mensagem,
    });
  }

  const { error } = await db
    .from("suporte_tickets")
    .update({ status: parsed.data.status, atualizado_em: new Date().toISOString() })
    .eq("id", parsed.data.ticketId);
  if (error) return { error: "Não foi possível atualizar o chamado." };

  revalidatePath(`/admin/relatorios/${parsed.data.ticketId}`);
  revalidatePath("/admin/relatorios");
  return { error: null };
}

const salvarInscricaoSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

export async function salvarInscricaoAction(
  input: z.infer<typeof salvarInscricaoSchema>,
): Promise<{ error: string | null }> {
  if (!(await exigirAdmin())) return { error: "Sessão de administrador expirada." };

  const parsed = salvarInscricaoSchema.safeParse(input);
  if (!parsed.success) return { error: "Não foi possível ativar os avisos." };

  const { error } = await supabaseAdmin()
    .from("admin_push_subscriptions")
    .upsert({ endpoint: parsed.data.endpoint, keys: parsed.data.keys }, { onConflict: "endpoint" });
  if (error) return { error: "Não foi possível ativar os avisos." };

  return { error: null };
}
