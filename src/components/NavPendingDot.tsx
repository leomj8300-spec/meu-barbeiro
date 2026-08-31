"use client";

import { useLinkStatus } from "next/link";

/**
 * Ponto fixo (sem afetar layout) que só aparece enquanto a navegação pro
 * link pai está pendente — dá feedback de "seu toque registrou" em telas
 * dinâmicas sem loading.js de rota (esse já quebrou em produção uma vez,
 * ver commit 9419f23 — travava a troca de aba pra sempre). useLinkStatus
 * só afeta o próprio link clicado, nunca substitui a tela inteira.
 */
export function NavPendingDot() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className="absolute top-0.5 right-0 w-1.5 h-1.5 rounded-full bg-accent"
      style={{
        opacity: pending ? 1 : 0,
        visibility: pending ? "visible" : "hidden",
        transition: "opacity 150ms ease",
        transitionDelay: pending ? "100ms" : "0ms",
      }}
    />
  );
}
