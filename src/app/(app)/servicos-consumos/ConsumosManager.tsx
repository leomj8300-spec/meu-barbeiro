"use client";

import { useState, useTransition } from "react";
import {
  criarConsumoAction,
  atualizarConsumoAction,
  ajustarEstoqueAction,
  excluirConsumoAction,
} from "@/app/actions/catalogo";
import type { Consumo } from "@/lib/queries";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ConsumosManager({ consumos }: { consumos: Consumo[] }) {
  const [error, setError] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [novoNome, setNovoNome] = useState("");
  const [novoPreco, setNovoPreco] = useState("");
  const [novoEstoque, setNovoEstoque] = useState("0");

  function adicionar() {
    setError(null);
    const preco = Number(novoPreco);
    if (!novoNome.trim() || !Number.isFinite(preco) || preco < 0) {
      setError("Informe nome e preço válidos.");
      return;
    }
    startTransition(async () => {
      const res = await criarConsumoAction({
        nome: novoNome.trim(),
        preco,
        estoqueInicial: Number(novoEstoque) || 0,
      });
      if (res.error) {
        setError(res.error);
      } else {
        setNovoNome("");
        setNovoPreco("");
        setNovoEstoque("0");
      }
    });
  }

  function excluir(id: string) {
    if (!confirm("Excluir este consumo?")) return;
    setError(null);
    startTransition(async () => {
      const res = await excluirConsumoAction(id);
      if (res.error) setError(res.error);
    });
  }

  return (
    <section className="panel p-4">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold mb-3.5">
        Consumos e estoque
      </h2>

      {error && (
        <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 mb-3 rounded-[10px]">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5 mb-4">
        {consumos.length === 0 && (
          <p className="text-text-dim text-xs">Nenhum consumo cadastrado.</p>
        )}
        {consumos.map((c) =>
          editandoId === c.id ? (
            <ConsumoEditForm
              key={c.id}
              consumo={c}
              onCancel={() => setEditandoId(null)}
              onSaved={() => setEditandoId(null)}
              onError={setError}
            />
          ) : (
            <ConsumoRow
              key={c.id}
              consumo={c}
              onEditar={() => setEditandoId(c.id)}
              onExcluir={() => excluir(c.id)}
              onError={setError}
            />
          ),
        )}
      </div>

      <div className="border-t border-border pt-3">
        <p className="text-xs text-text-dim mb-2">Novo consumo</p>
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
            className="w-full sm:w-24 bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
          />
          <input
            type="number"
            step="1"
            min="0"
            placeholder="Estoque inicial"
            value={novoEstoque}
            onChange={(e) => setNovoEstoque(e.target.value)}
            className="w-full sm:w-32 bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
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
    </section>
  );
}

function ConsumoRow({
  consumo,
  onEditar,
  onExcluir,
  onError,
}: {
  consumo: Consumo;
  onEditar: () => void;
  onExcluir: () => void;
  onError: (msg: string | null) => void;
}) {
  const [ajuste, setAjuste] = useState("1");
  const [pending, startTransition] = useTransition();
  const baixo = consumo.estoque <= 5;

  function aplicarAjuste(sinal: 1 | -1) {
    onError(null);
    const qtd = Math.trunc(Number(ajuste));
    if (!Number.isFinite(qtd) || qtd <= 0) {
      onError("Informe uma quantidade válida para o ajuste.");
      return;
    }
    startTransition(async () => {
      const res = await ajustarEstoqueAction(consumo.id, sinal * qtd);
      if (res.error) onError(res.error);
    });
  }

  return (
    <div className="rounded-[10px] border border-border bg-panel-2 px-2.5 py-2">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="min-w-0">
          <span className="text-[13.5px] font-semibold">{consumo.nome}</span>
          <span className={`ml-2 text-[11px] ${baixo ? "text-danger font-bold" : "text-text-dim"}`}>
            {consumo.estoque} em estoque
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-xs text-text-dim">{fmt(consumo.preco)}</span>
          <button
            type="button"
            onClick={onEditar}
            className="rounded-[10px] border border-border bg-panel text-text-dim text-[11px] font-semibold px-2 py-1 hover:border-accent hover:text-accent-label"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={onExcluir}
            className="rounded-[10px] border border-border bg-panel text-text-dim text-[11px] font-semibold px-2 py-1 hover:border-danger hover:text-danger"
          >
            Excluir
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-text-dim">Ajustar estoque:</span>
        <input
          type="number"
          min="1"
          step="1"
          value={ajuste}
          onChange={(e) => setAjuste(e.target.value)}
          className="w-16 bg-panel border border-border rounded-[10px] text-text px-2 py-1 text-xs focus:outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => aplicarAjuste(1)}
          disabled={pending}
          className="rounded-[10px] border border-cons/50 bg-cons/10 text-cons text-[11px] font-semibold px-2 py-1 disabled:opacity-40"
        >
          + Repor
        </button>
        <button
          type="button"
          onClick={() => aplicarAjuste(-1)}
          disabled={pending}
          className="rounded-[10px] border border-warn/50 bg-warn/10 text-warn text-[11px] font-semibold px-2 py-1 disabled:opacity-40"
        >
          − Baixa
        </button>
      </div>
    </div>
  );
}

function ConsumoEditForm({
  consumo,
  onCancel,
  onSaved,
  onError,
}: {
  consumo: Consumo;
  onCancel: () => void;
  onSaved: () => void;
  onError: (msg: string | null) => void;
}) {
  const [nome, setNome] = useState(consumo.nome);
  const [preco, setPreco] = useState(String(consumo.preco));
  const [pending, startTransition] = useTransition();

  function salvar() {
    onError(null);
    const precoNum = Number(preco);
    if (!nome.trim() || !Number.isFinite(precoNum) || precoNum < 0) {
      onError("Informe nome e preço válidos.");
      return;
    }
    startTransition(async () => {
      const res = await atualizarConsumoAction({ id: consumo.id, nome: nome.trim(), preco: precoNum });
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
      <p className="text-[11px] text-text-dim mb-2">
        Estoque não é editado aqui — use os botões de repor/baixa na lista.
      </p>
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
