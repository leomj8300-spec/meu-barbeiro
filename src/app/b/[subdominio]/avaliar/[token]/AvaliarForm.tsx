"use client";

import { useState, useTransition } from "react";
import { avaliarAction } from "@/app/actions/avaliacao";

const NOTAS = [1, 2, 3, 4, 5];

function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0];
}

export function AvaliarForm({
  token,
  barbearia,
  cliente,
  notaExistente,
}: {
  token: string;
  barbearia: string;
  cliente: string;
  notaExistente: number | null;
}) {
  const [nota, setNota] = useState<number | null>(null);
  const [comentario, setComentario] = useState("");
  const [enviada, setEnviada] = useState<number | null>(notaExistente);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function enviar() {
    if (!nota) return;
    setError(null);
    startTransition(async () => {
      const res = await avaliarAction({
        token,
        nota,
        comentario: comentario.trim() || undefined,
      });
      if (res.error) setError(res.error);
      else setEnviada(nota);
    });
  }

  if (enviada) {
    return (
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-cons font-semibold">
          Obrigado
        </p>
        <h1 className="heading-display text-2xl text-text mt-2">
          {"★".repeat(enviada)}
          <span className="text-text-dim">{"★".repeat(5 - enviada)}</span>
        </h1>
        <p className="text-text-dim text-sm mt-2">
          Sua opinião ajuda a {barbearia} a melhorar.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold">
        {barbearia}
      </p>
      <h1 className="heading-display text-2xl text-text mt-1.5">
        Oi {primeiroNome(cliente)}, como foi?
      </h1>
      <p className="text-text-dim text-sm mt-1">
        Sua nota vai direto pro barbeiro, leva 5 segundos.
      </p>

      {error && (
        <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 mt-4 rounded-[10px]">
          {error}
        </div>
      )}

      <div className="flex gap-1.5 mt-5">
        {NOTAS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setNota(n)}
            aria-label={`Nota ${n}`}
            aria-pressed={nota === n}
            className={`flex-1 aspect-square rounded-[10px] border text-2xl transition-colors ${
              nota && n <= nota
                ? "border-accent bg-accent-soft text-accent-label"
                : "border-border bg-panel-2 text-text-dim"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      {nota !== null && (
        <textarea
          placeholder="Quer contar alguma coisa? (opcional)"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={3}
          className="w-full bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] mt-3 focus:outline-none focus:border-accent resize-none"
        />
      )}

      <button
        type="button"
        onClick={enviar}
        disabled={!nota || pending}
        className="btn-primary w-full justify-center py-3 mt-3"
      >
        {pending ? "Enviando..." : "Enviar nota"}
      </button>
    </div>
  );
}
