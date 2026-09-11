"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { IconHelp, IconDoor } from "@/components/icons";
import { enviarMensagemAction, confirmarAcaoAction } from "@/app/actions/suporte";
import { fmtHora } from "@/lib/formato";
import type { MensagemTicketSuporte } from "@/lib/queries";

export function SuporteChat({
  ticketInicial,
}: {
  ticketInicial: { ticketId: string; mensagens: MensagemTicketSuporte[] } | null;
}) {
  const [aberto, setAberto] = useState(false);
  const [ticketId, setTicketId] = useState<string | undefined>(ticketInicial?.ticketId);
  const [mensagens, setMensagens] = useState<MensagemTicketSuporte[]>(ticketInicial?.mensagens ?? []);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aberto) fimRef.current?.scrollIntoView({ block: "end" });
  }, [aberto, mensagens]);

  function enviar() {
    const conteudo = texto.trim();
    if (!conteudo) return;
    setError(null);
    setTexto("");
    startTransition(async () => {
      const res = await enviarMensagemAction({ ticketId, conteudo });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.ticketId) setTicketId(res.ticketId);
      if (res.mensagens) setMensagens(res.mensagens);
    });
  }

  function confirmar(mensagemId: string) {
    setError(null);
    startTransition(async () => {
      const res = await confirmarAcaoAction(mensagemId);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.mensagens) setMensagens(res.mensagens);
    });
  }

  function cancelarProposta(mensagemId: string) {
    setMensagens((prev) => prev.map((m) => (m.id === mensagemId ? { ...m, acaoProposta: null } : m)));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="btn-ghost"
        aria-label="Suporte"
      >
        <IconHelp className="w-4 h-4" />
        <span className="hidden sm:inline">Suporte</span>
      </button>

      {aberto && (
        <button
          aria-label="Fechar suporte"
          onClick={() => setAberto(false)}
          className="fixed inset-0 bg-black/60 z-40"
        />
      )}

      {aberto && (
        <div
          className="fixed inset-x-0 z-50 max-w-[520px] mx-auto px-3"
          style={{ top: "max(24px, env(safe-area-inset-top))", bottom: "max(24px, env(safe-area-inset-bottom))" }}
        >
          <div className="panel h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <IconHelp className="w-4 h-4 text-accent-label" />
                <span className="text-sm font-semibold">Suporte</span>
              </div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="btn-ghost !px-2"
                aria-label="Fechar"
              >
                <IconDoor className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
              {mensagens.length === 0 && (
                <p className="text-text-dim text-xs text-center py-6">
                  Conta pra gente o que está acontecendo — a gente investiga na hora.
                </p>
              )}
              {mensagens.map((m) => {
                const deUsuario = m.remetente === "usuario";
                return (
                  <div key={m.id} className={`flex flex-col ${deUsuario ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-[10px] px-3 py-2 text-[13.5px] ${
                        deUsuario
                          ? "bg-accent text-on-accent"
                          : m.remetente === "admin"
                            ? "bg-accent-soft text-accent-label border border-accent-border"
                            : "bg-panel-2 border border-border text-text"
                      }`}
                    >
                      {m.conteudo}
                    </div>
                    <span className="text-[10px] text-text-dim mt-0.5">{fmtHora(m.criadoEm)}</span>
                    {m.acaoProposta && !m.acaoExecutada && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => confirmar(m.id)}
                          className="rounded-[10px] border border-accent-border bg-accent-soft text-accent-label text-[11px] font-semibold px-2.5 py-1.5 disabled:opacity-40"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => cancelarProposta(m.id)}
                          className="rounded-[10px] border border-border bg-panel text-text-dim text-[11px] font-semibold px-2.5 py-1.5 disabled:opacity-40"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={fimRef} />
            </div>

            {error && (
              <div className="mx-4 mb-2 bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 rounded-[10px]">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 px-3 py-3 border-t border-border shrink-0">
              <input
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !pending) enviar();
                }}
                placeholder="Descreva o problema..."
                disabled={pending}
                className="flex-1 bg-panel-2 border border-border rounded-[10px] text-text px-3 py-2 text-[13.5px] focus:outline-none focus:border-accent disabled:opacity-60"
              />
              <button
                type="button"
                onClick={enviar}
                disabled={pending || !texto.trim()}
                className="btn-primary shrink-0"
              >
                {pending ? "..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
