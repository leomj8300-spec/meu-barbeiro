import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase/server";
import { registrarErro } from "@/lib/logs";

let vapidConfigurado = false;
function garantirVapid(): boolean {
  if (vapidConfigurado) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails("mailto:suporte@meubarbeiro.app", publicKey, privateKey);
  vapidConfigurado = true;
  return true;
}

/**
 * Avisa o super-admin, por notificação push, que um ticket de suporte
 * precisa de decisão manual. Dispara só nesse momento — tickets resolvidos
 * sozinhos pela IA não geram aviso, porque não exigem decisão de ninguém.
 * Nunca lança erro: falha de envio vira log (ou, sem as chaves VAPID
 * configuradas nesse ambiente ainda, só não faz nada), o ticket continua
 * visível em /admin/relatorios mesmo sem o aviso ter saído.
 */
export async function enviarAvisoTicket(params: {
  ticketId: string;
  barbeariaNome: string;
  resumo: string;
}): Promise<void> {
  if (!garantirVapid()) return;

  const { data: inscricoes, error } = await supabaseAdmin()
    .from("admin_push_subscriptions")
    .select("id, endpoint, keys");
  if (error || !inscricoes || inscricoes.length === 0) return;

  const payload = JSON.stringify({
    title: `⚠️ ${params.barbeariaNome} precisa de você`,
    body: params.resumo,
    url: `/admin/relatorios/${params.ticketId}`,
  });

  await Promise.all(
    inscricoes.map(async (inscricao) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: inscricao.endpoint,
            keys: inscricao.keys as { p256dh: string; auth: string },
          },
          payload,
        );
      } catch (err) {
        // Endpoint expirado/revogado (usuário desinstalou, etc.) — remove a
        // inscrição morta e segue tentando as outras.
        if (err instanceof webpush.WebPushError && (err.statusCode === 404 || err.statusCode === 410)) {
          await supabaseAdmin().from("admin_push_subscriptions").delete().eq("id", inscricao.id);
          return;
        }
        await registrarErro({
          contexto: "enviar_aviso_ticket",
          mensagem: err instanceof Error ? err.message : String(err),
        });
      }
    }),
  );
}
