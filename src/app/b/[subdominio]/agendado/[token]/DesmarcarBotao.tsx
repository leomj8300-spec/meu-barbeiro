"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { desmarcarPublicoAction } from "@/app/actions/agendamento-publico";

export function DesmarcarBotao({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function desmarcar() {
    if (!confirm("Desmarcar esse horário?")) return;
    setError(null);
    startTransition(async () => {
      const res = await desmarcarPublicoAction(token);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="mt-5">
      {error && (
        <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 mb-3 rounded-[10px]">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={desmarcar}
        disabled={pending}
        className="w-full rounded-[10px] border border-border bg-panel-2 text-text-dim text-xs font-semibold px-3.5 py-2.5 hover:border-danger hover:text-danger transition-colors"
      >
        {pending ? "Desmarcando..." : "Desmarcar horário"}
      </button>
    </div>
  );
}
