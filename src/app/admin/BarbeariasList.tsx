"use client";

import { useState, useTransition } from "react";
import {
  editarBarbeariaAction,
  excluirBarbeariaAction,
  impersonarBarbeariaAction,
} from "@/app/actions/admin";
import type { BarbeariaResumo } from "@/lib/admin";

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function BarbeariasList({ barbearias }: { barbearias: BarbeariaResumo[] }) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1.5">
      {barbearias.map((b) =>
        editandoId === b.id ? (
          <EditarBarbeariaCard key={b.id} barbearia={b} onFechar={() => setEditandoId(null)} />
        ) : excluindoId === b.id ? (
          <ExcluirBarbeariaCard key={b.id} barbearia={b} onFechar={() => setExcluindoId(null)} />
        ) : (
          <div key={b.id} className="rounded-[10px] border border-border bg-panel-2 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[13.5px] font-semibold">{b.nome}</span>
              <span className="font-mono text-[11px] text-text-dim">/b/{b.subdominio}/login</span>
            </div>
            <div className="flex items-center justify-between gap-2 flex-wrap mt-1">
              {b.donoNome ? (
                <p className="text-text-dim text-[11px]">
                  {b.donoNome} · {b.donoEmail}
                </p>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-1.5">
                {b.donoNome && (
                  <form action={impersonarBarbeariaAction.bind(null, b.id)}>
                    <button
                      type="submit"
                      className="rounded-[10px] border border-border bg-panel text-text-dim text-[11px] font-semibold px-2 py-1 hover:border-accent hover:text-accent-label"
                    >
                      Entrar como dono
                    </button>
                  </form>
                )}
                <button
                  type="button"
                  onClick={() => setEditandoId(b.id)}
                  className="rounded-[10px] border border-border bg-panel text-text-dim text-[11px] font-semibold px-2 py-1 hover:border-accent hover:text-accent-label"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setExcluindoId(b.id)}
                  className="rounded-[10px] border border-danger/40 bg-panel text-danger text-[11px] font-semibold px-2 py-1 hover:bg-danger/10"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ),
      )}
    </div>
  );
}

function EditarBarbeariaCard({
  barbearia,
  onFechar,
}: {
  barbearia: BarbeariaResumo;
  onFechar: () => void;
}) {
  const [nomeBarbearia, setNomeBarbearia] = useState(barbearia.nome);
  const [subdominio, setSubdominio] = useState(barbearia.subdominio);
  const [nomeDono, setNomeDono] = useState(barbearia.donoNome ?? "");
  const [emailDono, setEmailDono] = useState(barbearia.donoEmail ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function salvar() {
    setError(null);
    startTransition(async () => {
      const res = await editarBarbeariaAction({
        id: barbearia.id,
        nomeBarbearia,
        subdominio,
        nomeDono,
        emailDono,
      });
      if (res.error) setError(res.error);
      else onFechar();
    });
  }

  return (
    <div className="rounded-[10px] border border-accent-border bg-accent-soft px-3 py-3 flex flex-col gap-2">
      {error && (
        <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 rounded-[10px]">
          {error}
        </div>
      )}
      <input
        type="text"
        placeholder="Nome da barbearia"
        value={nomeBarbearia}
        onChange={(e) => setNomeBarbearia(e.target.value)}
        className="bg-panel border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
      />
      <input
        type="text"
        placeholder="identificador-da-barbearia"
        value={subdominio}
        onChange={(e) => setSubdominio(slugify(e.target.value))}
        className="bg-panel border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] font-mono focus:outline-none focus:border-accent"
      />
      <div className="border-t border-border pt-2 flex flex-col gap-2">
        <p className="text-[11px] text-text-dim">Dono</p>
        <input
          type="text"
          placeholder="Nome"
          value={nomeDono}
          onChange={(e) => setNomeDono(e.target.value)}
          className="bg-panel border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
        />
        <input
          type="email"
          placeholder="E-mail"
          value={emailDono}
          onChange={(e) => setEmailDono(e.target.value)}
          className="bg-panel border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
        />
      </div>
      <div className="flex items-center gap-2 mt-1">
        <button
          type="button"
          onClick={salvar}
          disabled={pending}
          className="btn-primary flex-1 py-2 text-[13px] disabled:opacity-40"
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={onFechar}
          disabled={pending}
          className="rounded-[10px] border border-border bg-panel text-text-dim text-[13px] font-semibold px-3 py-2 disabled:opacity-40"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function ExcluirBarbeariaCard({
  barbearia,
  onFechar,
}: {
  barbearia: BarbeariaResumo;
  onFechar: () => void;
}) {
  const [confirmacao, setConfirmacao] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const confirmado = confirmacao.trim() === barbearia.subdominio;

  function excluir() {
    if (!confirmado) return;
    setError(null);
    startTransition(async () => {
      const res = await excluirBarbeariaAction(barbearia.id);
      if (res.error) setError(res.error);
      else onFechar();
    });
  }

  return (
    <div className="rounded-[10px] border border-danger/50 bg-danger/5 px-3 py-3 flex flex-col gap-2.5">
      {error && (
        <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 rounded-[10px]">
          {error}
        </div>
      )}
      <p className="text-[13px] text-text">
        Excluir <span className="font-semibold">{barbearia.nome}</span> apaga também todos os
        barbeiros, atendimentos, serviços e histórico dessa barbearia. Não dá pra desfazer.
      </p>
      <p className="text-[11px] text-text-dim">
        Digite <span className="font-mono font-semibold text-text">{barbearia.subdominio}</span> pra
        confirmar.
      </p>
      <input
        type="text"
        value={confirmacao}
        onChange={(e) => setConfirmacao(e.target.value)}
        placeholder={barbearia.subdominio}
        className="bg-panel border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] font-mono focus:outline-none focus:border-danger"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={excluir}
          disabled={!confirmado || pending}
          className="flex-1 rounded-[10px] bg-danger text-white font-semibold text-[13px] py-2 disabled:opacity-40"
        >
          {pending ? "Excluindo..." : "Confirmar exclusão"}
        </button>
        <button
          type="button"
          onClick={onFechar}
          disabled={pending}
          className="rounded-[10px] border border-border bg-panel text-text-dim text-[13px] font-semibold px-3 py-2 disabled:opacity-40"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
