"use client";

import { useState, useTransition } from "react";
import {
  criarBarbeiroAction,
  atualizarBarbeiroAction,
  removerBarbeiroAction,
} from "@/app/actions/equipe";
import type { Barbeiro } from "@/lib/queries";

export function EquipeManager({
  barbeiros,
  comissaoPadraoSugerida,
}: {
  barbeiros: Barbeiro[];
  comissaoPadraoSugerida: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [comissaoPadrao, setComissaoPadrao] = useState(String(comissaoPadraoSugerida));

  function adicionar() {
    setError(null);
    const pct = Number(comissaoPadrao);
    if (!nome.trim() || !email.trim() || senha.length < 6 || !Number.isFinite(pct)) {
      setError("Preencha nome, e-mail e uma senha com ao menos 6 caracteres.");
      return;
    }
    startTransition(async () => {
      const res = await criarBarbeiroAction({ nome: nome.trim(), email: email.trim(), senha, comissaoPadrao: pct });
      if (res.error) {
        setError(res.error);
      } else {
        setNome("");
        setEmail("");
        setSenha("");
        setComissaoPadrao(String(comissaoPadraoSugerida));
      }
    });
  }

  function remover(id: string, nomeBarbeiro: string) {
    if (!confirm(`Remover ${nomeBarbeiro} da equipe?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await removerBarbeiroAction(id);
      if (res.error) setError(res.error);
    });
  }

  return (
    <section className="panel p-4">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold mb-3.5">
        Barbeiros
      </h2>

      {error && (
        <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 mb-3 rounded-[10px]">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5 mb-4">
        {barbeiros.length === 0 && (
          <p className="text-text-dim text-xs">Nenhum barbeiro cadastrado ainda.</p>
        )}
        {barbeiros.map((b) =>
          editandoId === b.id ? (
            <BarbeiroEditForm
              key={b.id}
              barbeiro={b}
              onCancel={() => setEditandoId(null)}
              onSaved={() => setEditandoId(null)}
              onError={setError}
            />
          ) : (
            <div
              key={b.id}
              className="flex items-center justify-between gap-2 rounded-[10px] border border-border bg-panel-2 px-2.5 py-2"
            >
              <div className="min-w-0">
                <span className="text-[13.5px] font-semibold">{b.nome}</span>
                <p className="text-text-dim text-[11px] truncate">{b.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs text-text-dim">{b.comissaoPadrao}%</span>
                <button
                  type="button"
                  onClick={() => setEditandoId(b.id)}
                  className="rounded-[10px] border border-border bg-panel text-text-dim text-[11px] font-semibold px-2 py-1 hover:border-accent hover:text-accent-label"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => remover(b.id, b.nome)}
                  className="rounded-[10px] border border-border bg-panel text-text-dim text-[11px] font-semibold px-2 py-1 hover:border-danger hover:text-danger"
                >
                  Remover
                </button>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="border-t border-border pt-3">
        <p className="text-xs text-text-dim mb-2">Novo barbeiro</p>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
          />
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
          />
          <input
            type="text"
            placeholder="Senha provisória (mín. 6 caracteres)"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              max={100}
              step="0.1"
              placeholder="Comissão %"
              value={comissaoPadrao}
              onChange={(e) => setComissaoPadrao(e.target.value)}
              className="flex-1 bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={adicionar}
              disabled={pending}
              className="btn-primary shrink-0"
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function BarbeiroEditForm({
  barbeiro,
  onCancel,
  onSaved,
  onError,
}: {
  barbeiro: Barbeiro;
  onCancel: () => void;
  onSaved: () => void;
  onError: (msg: string | null) => void;
}) {
  const [nome, setNome] = useState(barbeiro.nome);
  const [comissaoPadrao, setComissaoPadrao] = useState(String(barbeiro.comissaoPadrao));
  const [pending, startTransition] = useTransition();

  function salvar() {
    onError(null);
    const pct = Number(comissaoPadrao);
    if (!nome.trim() || !Number.isFinite(pct) || pct < 0 || pct > 100) {
      onError("Informe nome e comissão válidos.");
      return;
    }
    startTransition(async () => {
      const res = await atualizarBarbeiroAction({ id: barbeiro.id, nome: nome.trim(), comissaoPadrao: pct });
      if (res.error) onError(res.error);
      else onSaved();
    });
  }

  return (
    <div className="rounded-[10px] border border-accent-border bg-panel-2 px-2.5 py-2.5">
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="flex-1 bg-panel border border-border rounded-[10px] text-text px-2.5 py-1.5 text-[13.5px] focus:outline-none focus:border-accent"
        />
        <input
          type="number"
          min={0}
          max={100}
          step="0.1"
          value={comissaoPadrao}
          onChange={(e) => setComissaoPadrao(e.target.value)}
          className="w-20 bg-panel border border-border rounded-[10px] text-text px-2.5 py-1.5 text-[13.5px] focus:outline-none focus:border-accent"
        />
      </div>
      <p className="text-[11px] text-text-dim mb-2">{barbeiro.email}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[10px] border border-border bg-panel text-text-dim text-[11px] font-semibold px-2 py-1 hover:text-text"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={salvar}
          disabled={pending}
          className="rounded-[10px] border border-accent-border bg-accent-soft text-accent-label text-[11px] font-semibold px-2 py-1 disabled:opacity-40"
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
