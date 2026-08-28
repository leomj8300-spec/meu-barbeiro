"use client";

import { useState, useTransition } from "react";
import { responderTicketAction, mudarStatusTicketAction } from "@/app/actions/admin-suporte";
import type { TicketAdminDetalhe } from "@/lib/admin";

function fmtHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function TicketDetalhe({ ticket }: { ticket: TicketAdminDetalhe }) {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const encerrado = ticket.status === "resolvido" || ticket.status === "recusado" || ticket.status === "fechado";

  function responder() {
    const conteudo = texto.trim();
    if (!conteudo) return;
    setError(null);
    startTransition(async () => {
      const res = await responderTicketAction({ ticketId: ticket.id, conteudo });
      if (res.error) {
        setError(res.error);
        return;
      }
      setTexto("");
    });
  }

  function mudarStatus(status: "resolvido" | "recusado", mensagem?: string) {
    setError(null);
    startTransition(async () => {
      const res = await mudarStatusTicketAction({ ticketId: ticket.id, status, mensagem });
      if (res.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="panel p-4">
        <p className="text-[13.5px] font-semibold">
          {ticket.barbeariaNome} <span className="text-text-dim font-normal">· {ticket.abertoPorNome} ({ticket.abertoPorPapel})</span>
        </p>
        <p className="text-text-dim text-xs mt-1">Aberto em {fmtHora(ticket.criadoEm)}</p>
      </div>

      <div className="flex flex-col gap-3">
        {ticket.mensagens.map((m) => {
          const deAdmin = m.remetente === "admin";
          const deUsuario = m.remetente === "usuario";
          return (
            <div key={m.id} className={`flex flex-col ${deAdmin ? "items-end" : "items-start"}`}>
              <span className="text-[10px] text-text-dim mb-0.5">
                {deUsuario ? ticket.abertoPorNome : deAdmin ? "Você" : "IA"} · {fmtHora(m.criadoEm)}
              </span>
              <div
                className={`max-w-[85%] rounded-[10px] px-3 py-2 text-[13.5px] ${
                  deAdmin
                    ? "bg-accent text-on-accent"
                    : deUsuario
                      ? "bg-panel-2 border border-border text-text"
                      : "bg-accent-soft border border-accent-border text-accent-label"
                }`}
              >
                {m.conteudo}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 rounded-[10px]">
          {error}
        </div>
      )}

      {!encerrado && (
        <>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !pending) responder();
              }}
              placeholder="Responder no chamado..."
              disabled={pending}
              className="flex-1 bg-panel-2 border border-border rounded-[10px] text-text px-3 py-2 text-[13.5px] focus:outline-none focus:border-accent disabled:opacity-60"
            />
            <button
              type="button"
              onClick={responder}
              disabled={pending || !texto.trim()}
              className="btn-primary shrink-0"
            >
              Enviar
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => mudarStatus("resolvido", "Resolvido — já pode tentar de novo.")}
              className="flex-1 rounded-[10px] border border-cons bg-cons/15 text-cons text-[12px] font-semibold px-3 py-2 disabled:opacity-40"
            >
              Marcar como resolvido
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => mudarStatus("recusado")}
              className="rounded-[10px] border border-border bg-panel text-text-dim text-[12px] font-semibold px-3 py-2 disabled:opacity-40"
            >
              Recusar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
