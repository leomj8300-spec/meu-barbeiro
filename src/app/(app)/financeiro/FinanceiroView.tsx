"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  alternarContaPagaAction,
  atualizarFormaPagamentoAction,
  criarContaAction,
  criarValeAction,
  excluirContaAction,
  quitarValeAction,
} from "@/app/actions/financeiro";
import { fmtMoeda as fmt, fmtData, chaveDia } from "@/lib/formato";
import type { Conta, FormaPagamento, ResumoFinanceiro, Vale } from "@/lib/queries";

type Aba = "resumo" | "contas" | "vales" | "formas";

const ABAS: { id: Aba; label: string }[] = [
  { id: "resumo", label: "Resumo" },
  { id: "contas", label: "Contas" },
  { id: "vales", label: "Vales" },
  { id: "formas", label: "Pagamento" },
];

export function FinanceiroView({
  resumo,
  contas,
  formas,
  vales,
  atendentes,
}: {
  resumo: ResumoFinanceiro;
  contas: Conta[];
  formas: FormaPagamento[];
  vales: Vale[];
  atendentes: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("resumo");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const hoje = chaveDia(new Date());
  const vencidas = contas.filter((c) => !c.pago && c.vencimento < hoje);
  const emAberto = contas.filter((c) => !c.pago && c.vencimento >= hoje);
  const quitadas = contas.filter((c) => c.pago);
  const valesAbertos = vales.filter((v) => v.emAberto);

  function rodar(fn: () => Promise<{ error: string | null }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 rounded-[10px]">
          {error}
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAba(a.id)}
            className={`chip shrink-0 ${aba === a.id ? "chip-on" : "chip-off"}`}
          >
            {a.label}
            {a.id === "contas" && vencidas.length > 0 && ` · ${vencidas.length}`}
          </button>
        ))}
      </div>

      {aba === "resumo" && (
        <section className="flex flex-col gap-3">
          <div className="panel-ink px-4 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-text-dim">
              Sobrou · últimos 30 dias
            </p>
            <p className="font-mono text-[30px] text-ink-text leading-none mt-1">
              {fmt(resumo.liquido)}
            </p>
            <p className="text-ink-text-dim text-[11.5px] mt-1.5">
              faturou {fmt(resumo.bruto)}, menos taxa e conta a pagar
            </p>
          </div>

          <div className="panel p-4 flex flex-col gap-2.5">
            <Linha rotulo="Faturamento bruto" valor={fmt(resumo.bruto)} />
            <Linha
              rotulo="Taxa de maquininha"
              valor={`− ${fmt(resumo.taxas)}`}
              tom={resumo.taxas > 0 ? "danger" : undefined}
            />
            <Linha
              rotulo="Contas a pagar em aberto"
              valor={`− ${fmt(resumo.aPagar)}`}
              tom={resumo.aPagar > 0 ? "danger" : undefined}
            />
            <div className="border-t border-border pt-2.5">
              <Linha rotulo="Sobra estimada" valor={fmt(resumo.liquido)} forte />
            </div>
          </div>

          {(resumo.aReceber > 0 || resumo.valesEmAberto > 0) && (
            <div className="panel p-4 flex flex-col gap-2.5">
              {resumo.aReceber > 0 && (
                <Linha rotulo="Contas a receber" valor={fmt(resumo.aReceber)} tom="cons" />
              )}
              {resumo.valesEmAberto > 0 && (
                <Linha
                  rotulo="Vales adiantados (a descontar)"
                  valor={fmt(resumo.valesEmAberto)}
                  tom="warn"
                />
              )}
            </div>
          )}

          {resumo.taxas === 0 && resumo.bruto > 0 && (
            <p className="text-text-dim text-[11.5px]">
              Sua taxa de maquininha está em 0%. Preencha a taxa real na aba Pagamento pra
              sobra ficar verdadeira.
            </p>
          )}
        </section>
      )}

      {aba === "contas" && (
        <ContasAba
          vencidas={vencidas}
          emAberto={emAberto}
          quitadas={quitadas}
          pending={pending}
          onCriar={(dados) => rodar(() => criarContaAction(dados))}
          onAlternar={(id, pago) => rodar(() => alternarContaPagaAction(id, pago))}
          onExcluir={(id) => rodar(() => excluirContaAction(id))}
        />
      )}

      {aba === "vales" && (
        <ValesAba
          vales={vales}
          valesAbertos={valesAbertos}
          atendentes={atendentes}
          pending={pending}
          onCriar={(dados) => rodar(() => criarValeAction(dados))}
          onQuitar={(id) => rodar(() => quitarValeAction(id))}
        />
      )}

      {aba === "formas" && (
        <FormasAba
          formas={formas}
          pending={pending}
          onSalvar={(dados) => rodar(() => atualizarFormaPagamentoAction(dados))}
        />
      )}
    </div>
  );
}

function Linha({
  rotulo,
  valor,
  tom,
  forte,
}: {
  rotulo: string;
  valor: string;
  tom?: "danger" | "cons" | "warn";
  forte?: boolean;
}) {
  const cor =
    tom === "danger"
      ? "text-danger"
      : tom === "cons"
        ? "text-cons"
        : tom === "warn"
          ? "text-warn"
          : "text-text";
  return (
    <div className="flex items-baseline gap-2">
      <span className={`text-[12.5px] ${forte ? "text-text font-semibold" : "text-text-dim"}`}>
        {rotulo}
      </span>
      <span
        className={`font-mono ml-auto shrink-0 ${forte ? "text-[15px] font-bold" : "text-[13px]"} ${cor}`}
      >
        {valor}
      </span>
    </div>
  );
}

function ContasAba({
  vencidas,
  emAberto,
  quitadas,
  pending,
  onCriar,
  onAlternar,
  onExcluir,
}: {
  vencidas: Conta[];
  emAberto: Conta[];
  quitadas: Conta[];
  pending: boolean;
  onCriar: (dados: {
    tipo: "pagar" | "receber";
    descricao: string;
    valor: number;
    vencimento: string;
  }) => void;
  onAlternar: (id: string, pago: boolean) => void;
  onExcluir: (id: string) => void;
}) {
  const [criando, setCriando] = useState(false);
  const [tipo, setTipo] = useState<"pagar" | "receber">("pagar");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState(chaveDia(new Date()));

  function enviar() {
    onCriar({ tipo, descricao: descricao.trim(), valor: Number(valor || 0), vencimento });
    setDescricao("");
    setValor("");
    setCriando(false);
  }

  return (
    <section className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setCriando((v) => !v)}
        className="btn-primary self-start"
      >
        {criando ? "Fechar" : "Lançar conta"}
      </button>

      {criando && (
        <div className="panel p-4 flex flex-col gap-2.5">
          <div className="flex gap-1.5">
            {(["pagar", "receber"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`flex-1 rounded-[10px] border px-3 py-2 text-xs font-semibold capitalize transition-colors ${
                  tipo === t
                    ? "border-accent-border bg-accent-soft text-accent-label"
                    : "border-border bg-panel-2 text-text-dim"
                }`}
              >
                A {t}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Descrição (ex: aluguel, fornecedor)"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Valor"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="flex-1 bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
            />
            <input
              type="date"
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
              className="flex-1 bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
            />
          </div>
          <button
            type="button"
            onClick={enviar}
            disabled={pending || !descricao.trim() || !valor}
            className="btn-primary w-full justify-center"
          >
            Lançar
          </button>
        </div>
      )}

      <Grupo titulo="Vencidas" contas={vencidas} tom="danger" {...{ pending, onAlternar, onExcluir }} />
      <Grupo titulo="Em aberto" contas={emAberto} {...{ pending, onAlternar, onExcluir }} />
      <Grupo titulo="Quitadas" contas={quitadas.slice(0, 10)} {...{ pending, onAlternar, onExcluir }} />

      {vencidas.length + emAberto.length + quitadas.length === 0 && (
        <p className="text-text-dim text-sm text-center py-8">Nenhuma conta lançada.</p>
      )}
    </section>
  );
}

function Grupo({
  titulo,
  contas,
  tom,
  pending,
  onAlternar,
  onExcluir,
}: {
  titulo: string;
  contas: Conta[];
  tom?: "danger";
  pending: boolean;
  onAlternar: (id: string, pago: boolean) => void;
  onExcluir: (id: string) => void;
}) {
  if (contas.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h2
        className={`font-mono text-[10px] uppercase tracking-[0.14em] font-semibold ${
          tom === "danger" ? "text-danger" : "text-text-dim"
        }`}
      >
        {titulo}
      </h2>
      {contas.map((c) => (
        <div
          key={c.id}
          className={`flex items-center gap-2 rounded-[10px] border px-3 py-2.5 ${
            tom === "danger" ? "border-danger/40 bg-danger/5" : "border-border bg-panel-2"
          }`}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-text truncate">
              {c.descricao}
              <span
                className={`ml-2 rounded-full text-[9.5px] font-bold uppercase px-1.5 py-0.5 ${
                  c.tipo === "pagar" ? "bg-danger/15 text-danger" : "bg-cons/15 text-cons"
                }`}
              >
                {c.tipo}
              </span>
            </p>
            <p className="text-text-dim text-[11px]">vence {fmtData(`${c.vencimento}T12:00:00-03:00`)}</p>
          </div>
          <span className="font-mono text-[13px] text-text shrink-0">{fmt(c.valor)}</span>
          <button
            type="button"
            onClick={() => onAlternar(c.id, !c.pago)}
            disabled={pending}
            className="rounded-[10px] border border-border bg-panel text-text-dim text-[11px] font-semibold px-2 py-1 hover:border-cons hover:text-cons shrink-0"
          >
            {c.pago ? "Reabrir" : "Quitar"}
          </button>
          <button
            type="button"
            onClick={() => onExcluir(c.id)}
            disabled={pending}
            className="rounded-[10px] border border-border bg-panel text-text-dim text-[11px] font-semibold px-2 py-1 hover:border-danger hover:text-danger shrink-0"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function ValesAba({
  vales,
  valesAbertos,
  atendentes,
  pending,
  onCriar,
  onQuitar,
}: {
  vales: Vale[];
  valesAbertos: Vale[];
  atendentes: { id: string; nome: string }[];
  pending: boolean;
  onCriar: (dados: { barbeiroId: string; valor: number; descricao?: string }) => void;
  onQuitar: (id: string) => void;
}) {
  const [barbeiroId, setBarbeiroId] = useState(atendentes[0]?.id ?? "");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");

  const totalAberto = valesAbertos.reduce((s, v) => s + v.valor, 0);

  return (
    <section className="flex flex-col gap-4">
      {totalAberto > 0 && (
        <div className="panel-ink px-4 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-text-dim">
            Adiantado, a descontar
          </p>
          <p className="font-mono text-[30px] text-ink-text leading-none mt-1">
            {fmt(totalAberto)}
          </p>
        </div>
      )}

      <div className="panel p-4 flex flex-col gap-2.5">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold">
          Lançar vale
        </h2>
        <select
          value={barbeiroId}
          onChange={(e) => setBarbeiroId(e.target.value)}
          className="w-full bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
        >
          {atendentes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Valor"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-28 bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
          />
          <input
            type="text"
            placeholder="Motivo (opcional)"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="flex-1 bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            onCriar({
              barbeiroId,
              valor: Number(valor || 0),
              descricao: descricao.trim() || undefined,
            });
            setValor("");
            setDescricao("");
          }}
          disabled={pending || !valor || !barbeiroId}
          className="btn-primary w-full justify-center"
        >
          Lançar vale
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {vales.length === 0 && (
          <p className="text-text-dim text-sm text-center py-8">Nenhum vale lançado.</p>
        )}
        {vales.map((v) => (
          <div
            key={v.id}
            className={`flex items-center gap-2 rounded-[10px] border border-border bg-panel-2 px-3 py-2.5 ${
              v.emAberto ? "" : "opacity-55"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-text truncate">{v.barbeiroNome}</p>
              <p className="text-text-dim text-[11px]">
                {fmtData(v.criadoEm)}
                {v.descricao && ` · ${v.descricao}`}
                {!v.emAberto && " · descontado"}
              </p>
            </div>
            <span className="font-mono text-[13px] text-warn shrink-0">{fmt(v.valor)}</span>
            {v.emAberto && (
              <button
                type="button"
                onClick={() => onQuitar(v.id)}
                disabled={pending}
                className="rounded-[10px] border border-border bg-panel text-text-dim text-[11px] font-semibold px-2 py-1 hover:border-cons hover:text-cons shrink-0"
              >
                Descontar
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function FormasAba({
  formas,
  pending,
  onSalvar,
}: {
  formas: FormaPagamento[];
  pending: boolean;
  onSalvar: (dados: { id: string; nome: string; taxaPct: number; ativa: boolean }) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <p className="text-text-dim text-[11.5px]">
        A taxa da maquininha sai do que você recebe. Preencha a real de cada bandeira pra o
        resumo mostrar quanto sobra de verdade.
      </p>
      {formas.map((f) => (
        <FormaLinha key={f.id} forma={f} pending={pending} onSalvar={onSalvar} />
      ))}
    </section>
  );
}

function FormaLinha({
  forma,
  pending,
  onSalvar,
}: {
  forma: FormaPagamento;
  pending: boolean;
  onSalvar: (dados: { id: string; nome: string; taxaPct: number; ativa: boolean }) => void;
}) {
  const [taxa, setTaxa] = useState(String(forma.taxaPct));
  const mudou = Number(taxa || 0) !== forma.taxaPct;

  return (
    <div className="flex items-center gap-2 rounded-[10px] border border-border bg-panel-2 px-3 py-2.5">
      <span className="text-[13.5px] font-semibold text-text flex-1 min-w-0 truncate">
        {forma.nome}
      </span>
      <input
        type="number"
        step="0.1"
        min="0"
        max="100"
        value={taxa}
        onChange={(e) => setTaxa(e.target.value)}
        onFocus={(e) => e.target.select()}
        className="w-20 bg-panel border border-border rounded-[10px] text-text px-2 py-1.5 text-[13px] font-mono focus:outline-none focus:border-accent"
      />
      <span className="text-text-dim text-[12px] shrink-0">%</span>
      <button
        type="button"
        onClick={() =>
          onSalvar({
            id: forma.id,
            nome: forma.nome,
            taxaPct: Number(taxa || 0),
            ativa: forma.ativa,
          })
        }
        disabled={pending || !mudou}
        className="rounded-[10px] border border-border bg-panel text-text-dim text-[11px] font-semibold px-2 py-1 hover:border-accent hover:text-accent-label disabled:opacity-30 shrink-0"
      >
        Salvar
      </button>
    </div>
  );
}
