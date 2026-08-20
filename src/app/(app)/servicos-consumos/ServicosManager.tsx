"use client";

import { useState, useTransition } from "react";
import {
  criarServicoAction,
  atualizarServicoAction,
  excluirServicoAction,
} from "@/app/actions/catalogo";
import type { Servico } from "@/lib/queries";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ServicosManager({ servicos }: { servicos: Servico[] }) {
  const [error, setError] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [novoNome, setNovoNome] = useState("");
  const [novoPreco, setNovoPreco] = useState("");
  const [novoComissionavel, setNovoComissionavel] = useState(true);

  function adicionar() {
    setError(null);
    const preco = Number(novoPreco);
    if (!novoNome.trim() || !Number.isFinite(preco) || preco < 0) {
      setError("Informe nome e preço válidos.");
      return;
    }
    startTransition(async () => {
      const res = await criarServicoAction({
        nome: novoNome.trim(),
        preco,
        comissionavel: novoComissionavel,
      });
      if (res.error) {
        setError(res.error);
      } else {
        setNovoNome("");
        setNovoPreco("");
        setNovoComissionavel(true);
      }
    });
  }

  function excluir(id: string) {
    if (!confirm("Excluir este serviço?")) return;
    setError(null);
    startTransition(async () => {
      const res = await excluirServicoAction(id);
      if (res.error) setError(res.error);
    });
  }

  return (
    <section className="panel p-4">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold mb-3.5">
        Serviços
      </h2>

      {error && (
        <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 mb-3 rounded-[10px]">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5 mb-4">
        {servicos.length === 0 && (
          <p className="text-text-dim text-xs">Nenhum serviço cadastrado.</p>
        )}
        {servicos.map((s) =>
          editandoId === s.id ? (
            <ServicoEditForm
              key={s.id}
              servico={s}
              onCancel={() => setEditandoId(null)}
              onSaved={() => setEditandoId(null)}
              onError={setError}
            />
          ) : (
            <div
              key={s.id}
              className="flex items-center justify-between gap-2 rounded-[10px] border border-border bg-panel-2 px-2.5 py-2"
            >
              <div className="min-w-0">
                <span className="text-[13.5px] font-semibold">{s.nome}</span>
                {s.comissionavel && (
                  <span className="ml-2 inline-block rounded-[10px] bg-serv/15 text-serv text-[10px] font-bold uppercase px-1.5 py-0.5 align-middle">
                    comissionável
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs text-text-dim">{fmt(s.preco)}</span>
                <button
                  type="button"
                  onClick={() => setEditandoId(s.id)}
                  className="rounded-[10px] border border-border bg-panel text-text-dim text-[11px] font-semibold px-2 py-1 hover:border-accent hover:text-accent-label"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => excluir(s.id)}
                  className="rounded-[10px] border border-border bg-panel text-text-dim text-[11px] font-semibold px-2 py-1 hover:border-danger hover:text-danger"
                >
                  Excluir
                </button>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="border-t border-border pt-3">
        <p className="text-xs text-text-dim mb-2">Novo serviço</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Nome"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            className="flex-1 bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
          />
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Preço"
            value={novoPreco}
            onChange={(e) => setNovoPreco(e.target.value)}
            className="w-full sm:w-28 bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
          />
          <label className="flex items-center gap-1.5 text-xs text-text-dim shrink-0 cursor-pointer">
            <input
              type="checkbox"
              checked={novoComissionavel}
              onChange={(e) => setNovoComissionavel(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            Comissionável
          </label>
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
    </section>
  );
}

function ServicoEditForm({
  servico,
  onCancel,
  onSaved,
  onError,
}: {
  servico: Servico;
  onCancel: () => void;
  onSaved: () => void;
  onError: (msg: string | null) => void;
}) {
  const [nome, setNome] = useState(servico.nome);
  const [preco, setPreco] = useState(String(servico.preco));
  const [comissionavel, setComissionavel] = useState(servico.comissionavel);
  const [pending, startTransition] = useTransition();

  function salvar() {
    onError(null);
    const precoNum = Number(preco);
    if (!nome.trim() || !Number.isFinite(precoNum) || precoNum < 0) {
      onError("Informe nome e preço válidos.");
      return;
    }
    startTransition(async () => {
      const res = await atualizarServicoAction({
        id: servico.id,
        nome: nome.trim(),
        preco: precoNum,
        comissionavel,
      });
      if (res.error) onError(res.error);
      else onSaved();
    });
  }

  return (
    <div className="rounded-[10px] border border-accent-border bg-panel-2 px-2.5 py-2.5">
      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="flex-1 bg-panel border border-border rounded-[10px] text-text px-2.5 py-1.5 text-[13.5px] focus:outline-none focus:border-accent"
        />
        <input
          type="number"
          step="0.01"
          min="0"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          className="w-full sm:w-28 bg-panel border border-border rounded-[10px] text-text px-2.5 py-1.5 text-[13.5px] focus:outline-none focus:border-accent"
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-xs text-text-dim cursor-pointer">
          <input
            type="checkbox"
            checked={comissionavel}
            onChange={(e) => setComissionavel(e.target.checked)}
            className="w-4 h-4 accent-accent"
          />
          Comissionável
        </label>
        <div className="flex gap-2">
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
    </div>
  );
}
