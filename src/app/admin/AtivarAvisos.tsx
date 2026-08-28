"use client";

import { useEffect, useState, useTransition } from "react";
import { salvarInscricaoAction } from "@/app/actions/admin-suporte";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export function AtivarAvisos({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [suportado, setSuportado] = useState(false);
  const [ativado, setAtivado] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSuportado(true);
    navigator.serviceWorker.getRegistration("/sw-admin.js").then(async (reg) => {
      const inscricao = await reg?.pushManager.getSubscription();
      if (inscricao) setAtivado(true);
    });
  }, []);

  function ativar() {
    if (!vapidPublicKey) {
      setErro("Chave de notificação não configurada.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw-admin.js");
        await navigator.serviceWorker.ready;
        const permissao = await Notification.requestPermission();
        if (permissao !== "granted") {
          setErro("Permissão de notificação negada.");
          return;
        }
        const inscricao = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource,
        });
        const json = inscricao.toJSON();
        const res = await salvarInscricaoAction({
          endpoint: json.endpoint!,
          keys: { p256dh: json.keys!.p256dh!, auth: json.keys!.auth! },
        });
        if (res.error) {
          setErro(res.error);
          return;
        }
        setAtivado(true);
      } catch {
        setErro("Não foi possível ativar os avisos neste navegador.");
      }
    });
  }

  if (!suportado || ativado) return null;

  return (
    <button
      type="button"
      onClick={ativar}
      disabled={pending}
      className="btn-ghost text-[11px] disabled:opacity-40"
      title={erro ?? "Receber aviso quando um chamado precisar de você"}
    >
      {pending ? "Ativando..." : "Ativar avisos"}
    </button>
  );
}
