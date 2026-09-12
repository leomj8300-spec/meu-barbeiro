"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registrarAtendimentoAction } from "@/app/actions/atendimento";
import { IconUser } from "@/components/icons";
import { fmtMoeda as fmt } from "@/lib/formato";
import type { Servico, Consumo, FormaPagamento } from "@/lib/queries";
import type { BarbeariaConfiguracoes } from "@/lib/types";

export function AtendimentoForm({
  servicos,
  consumos,
  config,
  agendamentoId,
  clienteInicial,
  servicosIniciais,
  nomesDeClientes = [],
  formasPagamento = [],
}: {
  servicos: Servico[];
  consumos: Consumo[];
  config: BarbeariaConfiguracoes;
  /** Presente quando o atendimento veio de um horário marcado. */
  agendamentoId?: string;
  clienteInicial?: string;
  servicosIniciais?: string[];
  nomesDeClientes?: string[];
  formasPagamento?: FormaPagamento[];
}) {
  const [cliente, setCliente] = useState(clienteInicial ?? "");
  const [servicosSelecionados, setServicosSelecionados] = useState<Set<string>>(
    new Set(servicosIniciais ?? []),
  );
  const [quantidadesConsumo, setQuantidadesConsumo] = useState<Record<string, number>>({});
  const [precoNegociado, setPrecoNegociado] = useState(false);
  const [valorNegociado, setValorNegociado] = useState("");
  const [fiado, setFiado] = useState(false);
  const [formaPagamentoId, setFormaPagamentoId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

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
    setFormaPagamentoId("");
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
        agendamentoId,
        formaPagamentoId: fiado ? undefined : formaPagamentoId || undefined,
      });
      if (res.error) {
        setError(res.error);
      } else if (agendamentoId) {
        // Veio da agenda: volta pra lá, que é de onde o barbeiro continua o dia.
        router.push("/agenda");
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
        <div className="flex items-center gap-2.5 rounded-[10px] border border-border bg-panel h-[52px] px-3.5 focus-within:border-accent">
          <IconUser className="w-[17px] h-[17px] text-text-dim shrink-0" />
          <input
            id="cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            type="text"
            required
            list="clientes-cadastrados"
            placeholder="Nome do cliente"
            className="flex-1 min-w-0 bg-transparent text-text text-[15px] focus:outline-none"
          />
          {/* Reconhece quem já veio antes em vez de virar uma ficha nova por
              causa de um acento ou apelido diferente. */}
          <datalist id="clientes-cadastrados">
            {nomesDeClientes.map((nome) => (
              <option key={nome} value={nome} />
            ))}
          </datalist>
        </div>
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
        {/* Só aparece quando não é fiado: fiado ainda não foi pago, então não
            tem forma de pagamento nem taxa de maquininha. */}
        {formasPagamento.length > 0 && !fiado && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {formasPagamento.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormaPagamentoId(formaPagamentoId === f.id ? "" : f.id)}
                className={`chip ${formaPagamentoId === f.id ? "chip-on" : "chip-off"}`}
              >
                {f.nome}
              </button>
            ))}
          </div>
        )}

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

      {/* Respiro pro conteúdo não ficar escondido atrás da faixa fixa abaixo. */}
      <div style={{ height: "calc(86px + env(safe-area-inset-bottom))" }} />

      <div
        className="fixed left-0 right-0 z-30 max-w-[720px] mx-auto px-4 sm:px-6"
        style={{ bottom: "calc(76px + env(safe-area-inset-bottom))" }}
      >
        <div className="panel-ink flex items-center justify-between gap-3 px-4 py-3.5 shadow-[0_12px_30px_-10px_rgba(14,14,14,0.5)]">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-text-dim">
              Total · {totalItens} {totalItens === 1 ? "item" : "itens"}
            </span>
            <span className="font-mono text-[24px] font-semibold leading-none">{fmt(valorFinal)}</span>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 h-[46px] rounded-[10px] bg-accent text-on-accent font-semibold text-[14px] px-5 disabled:opacity-40"
          >
            {pending ? "Registrando..." : "Registrar"}
          </button>
        </div>
      </div>
    </form>
  );
}
