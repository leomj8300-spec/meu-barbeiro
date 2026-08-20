"use client";

import { useMemo, useState, useTransition } from "react";
import { registrarAtendimentoAction } from "@/app/actions/atendimento";
import type { Servico, Consumo } from "@/lib/queries";
import type { BarbeariaConfiguracoes } from "@/lib/types";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function AtendimentoForm({
  servicos,
  consumos,
  config,
}: {
  servicos: Servico[];
  consumos: Consumo[];
  config: BarbeariaConfiguracoes;
}) {
  const [cliente, setCliente] = useState("");
  const [servicosSelecionados, setServicosSelecionados] = useState<Set<string>>(new Set());
  const [quantidadesConsumo, setQuantidadesConsumo] = useState<Record<string, number>>({});
  const [precoNegociado, setPrecoNegociado] = useState(false);
  const [valorNegociado, setValorNegociado] = useState("");
  const [fiado, setFiado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [pending, startTransition] = useTransition();

  const valorCalculado = useMemo(() => {
    const totalServicos = servicos
      .filter((s) => servicosSelecionados.has(s.id))
      .reduce((sum, s) => sum + s.preco, 0);
    const totalConsumos = consumos.reduce(
      (sum, c) => sum + c.preco * (quantidadesConsumo[c.id] ?? 0),
      0,
    );
    return totalServicos + totalConsumos;
  }, [servicos, consumos, servicosSelecionados, quantidadesConsumo]);

  const valorFinal = precoNegociado ? Number(valorNegociado || 0) : valorCalculado;
  const totalItens =
    servicosSelecionados.size + Object.values(quantidadesConsumo).filter((q) => q > 0).length;

  function toggleServico(id: string) {
    setServicosSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function alterarQtdConsumo(id: string, delta: number, estoque: number) {
    setQuantidadesConsumo((prev) => {
      const atual = prev[id] ?? 0;
      const novo = Math.max(0, Math.min(estoque, atual + delta));
      return { ...prev, [id]: novo };
    });
  }

  function resetForm() {
    setCliente("");
    setServicosSelecionados(new Set());
    setQuantidadesConsumo({});
    setPrecoNegociado(false);
    setValorNegociado("");
    setFiado(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSucesso(false);

    if (!cliente.trim()) {
      setError("Informe o nome do cliente.");
      return;
    }

    const itensServicos = servicos
      .filter((s) => servicosSelecionados.has(s.id))
      .map((s) => ({
        servico_id: s.id,
        nome: s.nome,
        preco: s.preco,
        comissionavel: s.comissionavel,
      }));

    const itensConsumos = consumos
      .filter((c) => (quantidadesConsumo[c.id] ?? 0) > 0)
      .map((c) => ({
        consumo_id: c.id,
        nome: c.nome,
        preco: c.preco,
        quantidade: quantidadesConsumo[c.id],
      }));

    startTransition(async () => {
      const res = await registrarAtendimentoAction({
        cliente: cliente.trim(),
        servicos: itensServicos,
        consumos: itensConsumos,
        valor: valorFinal,
        precoNegociado,
        fiado,
      });
      if (res.error) {
        setError(res.error);
      } else {
        setSucesso(true);
        resetForm();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 mb-3 rounded-[10px]">
          {error}
        </div>
      )}
      {sucesso && (
        <div className="bg-cons/10 border border-cons text-cons text-xs px-2.5 py-2 mb-3 rounded-[10px]">
          Atendimento registrado com sucesso.
        </div>
      )}

      <div className="mb-4">
        <label
          htmlFor="cliente"
          className="block font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim mb-1.5"
        >
          Cliente
        </label>
        <input
          id="cliente"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          type="text"
          required
          className="w-full bg-panel-2 border border-border rounded-[10px] text-text px-3 py-2.5 text-[15px] focus:outline-none focus:border-accent"
        />
      </div>

      <section className="panel p-4 mb-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim mb-3">
          Serviços
        </h2>
        <div className="flex flex-col gap-1.5">
          {servicos.length === 0 && (
            <p className="text-text-dim text-xs">Nenhum serviço cadastrado.</p>
          )}
          {servicos.map((s) => {
            const selecionado = servicosSelecionados.has(s.id);
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => toggleServico(s.id)}
                className={`flex items-center gap-3 px-3.5 py-3 text-left rounded-[10px] border transition-colors ${
                  selecionado ? "bg-accent-soft border-accent-border" : "border-border bg-panel-2"
                }`}
              >
                <span
                  className={`w-[18px] h-[18px] rounded-[5px] shrink-0 flex items-center justify-center ${
                    selecionado ? "bg-accent text-on-accent" : "border border-border"
                  }`}
                >
                  {selecionado && (
                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5 L10 17.5 L19 6.5" />
                    </svg>
                  )}
                </span>
                <span className="flex-1 text-[15px] font-medium">{s.nome}</span>
                <span className="font-mono text-[14px] font-medium">{fmt(s.preco)}</span>
              </button>
            );
          })}
        </div>
      </section>

      {config.controleEstoqueHabilitado && (
      <section className="panel p-4 mb-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim mb-3">
          Consumo
        </h2>
        <div className="flex flex-col gap-1.5">
          {consumos.length === 0 && (
            <p className="text-text-dim text-xs">Nenhum consumo cadastrado.</p>
          )}
          {consumos.map((c) => {
            const qtd = quantidadesConsumo[c.id] ?? 0;
            const baixo = c.estoque <= 5;
            return (
              <div
                key={c.id}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border ${
                  qtd > 0 ? "bg-accent-soft border-accent-border" : "border-border bg-panel-2"
                }`}
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[14px] font-medium">
                    {c.nome} · <span className="font-mono">{fmt(c.preco)}</span>
                  </span>
                  <span className={`text-[11px] ${baixo ? "text-danger font-semibold" : "text-text-dim"}`}>
                    {c.estoque} em estoque
                  </span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => alterarQtdConsumo(c.id, -1, c.estoque)}
                    className="w-7 h-7 rounded-full border border-border bg-panel text-text font-bold hover:border-accent hover:text-accent-label"
                  >
                    −
                  </button>
                  <span className="font-mono font-semibold w-5 text-center">{qtd}</span>
                  <button
                    type="button"
                    onClick={() => alterarQtdConsumo(c.id, 1, c.estoque)}
                    disabled={qtd >= c.estoque}
                    className="w-7 h-7 rounded-full border border-border bg-panel text-text font-bold hover:border-accent hover:text-accent-label disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      )}

      <section className="panel p-4 mb-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim mb-3">
          Pagamento
        </h2>
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={() => setPrecoNegociado((v) => !v)}
            className={`chip ${precoNegociado ? "chip-on" : "chip-off"}`}
          >
            Preço negociado
          </button>
          {config.fiadoHabilitado && (
            <button
              type="button"
              onClick={() => setFiado((v) => !v)}
              className={`chip ${fiado ? "chip-on" : "chip-off"}`}
            >
              Fiado
            </button>
          )}
        </div>

        {precoNegociado && (
          <input
            type="number"
            step="0.01"
            min="0"
            value={valorNegociado}
            onChange={(e) => setValorNegociado(e.target.value)}
            placeholder={`Valor calculado: ${fmt(valorCalculado)}`}
            className="w-full bg-panel-2 border border-border rounded-[10px] text-text px-3 py-2.5 text-[14px] focus:outline-none focus:border-accent"
          />
        )}
        {fiado && config.fiadoHabilitado && (
          <p className="text-text-dim text-[11.5px] mt-2.5">Cliente paga depois.</p>
        )}
      </section>

      <div className="panel-ink flex justify-between items-end px-4 py-4 mb-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-text-dim">
            Total · {totalItens} {totalItens === 1 ? "item" : "itens"}
          </span>
          <span className="font-mono text-[28px] font-semibold leading-none">{fmt(valorFinal)}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full py-3.5 text-[15px]"
      >
        {pending ? "Registrando..." : "Registrar atendimento"}
      </button>
    </form>
  );
}
