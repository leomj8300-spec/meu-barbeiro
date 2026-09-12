"use client";

import { useRouter } from "next/navigation";
import { fmtMoeda as fmt } from "@/lib/formato";
import type { RelatorioGerencial } from "@/lib/queries";

/** Barra proporcional ao maior valor — comparação relativa lê mais rápido que número solto. */
function Barra({ fracao, destaque }: { fracao: number; destaque?: boolean }) {
  return (
    <span className="block h-1.5 rounded-full bg-panel-2 overflow-hidden">
      <span
        className={`block h-full rounded-full ${destaque ? "bg-warn" : "bg-accent"}`}
        style={{ width: `${Math.max(fracao * 100, 2)}%` }}
      />
    </span>
  );
}

export function RelatoriosView({
  relatorio,
  dias,
  periodos,
}: {
  relatorio: RelatorioGerencial;
  dias: number;
  periodos: number[];
}) {
  const router = useRouter();
  const {
    porDiaDaSemana,
    porHora,
    porServico,
    porBarbeiro,
    totalPeriodo,
    qtdPeriodo,
    ticketMedio,
  } = relatorio;

  const maxDia = Math.max(...porDiaDaSemana.map((d) => d.total), 1);
  const maxHora = Math.max(...porHora.map((h) => h.qtd), 1);
  const maxServico = Math.max(...porServico.map((s) => s.total), 1);
  const maxBarbeiro = Math.max(...porBarbeiro.map((b) => b.total), 1);

  // O dia mais fraco é o acionável: é nele que vale mandar promoção.
  const diasComMovimento = porDiaDaSemana.filter((d) => d.qtd > 0);
  const diaMaisFraco =
    diasComMovimento.length > 1
      ? diasComMovimento.reduce((pior, d) => (d.total < pior.total ? d : pior))
      : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1.5">
        {periodos.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => router.push(`/relatorios?dias=${p}`)}
            className={`chip ${dias === p ? "chip-on" : "chip-off"}`}
          >
            {p} dias
          </button>
        ))}
      </div>

      <div className="panel-ink px-4 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-text-dim">
          Faturamento · {dias} dias
        </p>
        <p className="font-mono text-[30px] text-ink-text leading-none mt-1">
          {fmt(totalPeriodo)}
        </p>
        <p className="text-ink-text-dim text-[11.5px] mt-1.5">
          {qtdPeriodo} {qtdPeriodo === 1 ? "atendimento" : "atendimentos"} · ticket médio{" "}
          {fmt(ticketMedio)}
        </p>
      </div>

      {qtdPeriodo === 0 ? (
        <p className="text-text-dim text-sm text-center py-8">
          Nenhum atendimento pago nesse período.
        </p>
      ) : (
        <>
          <section className="panel p-4">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold mb-3">
              Por dia da semana
            </h2>
            <div className="flex flex-col gap-2.5">
              {porDiaDaSemana.map((d) => {
                const fraco = diaMaisFraco?.dia === d.dia;
                return (
                  <div key={d.dia}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={`text-[12px] ${fraco ? "text-warn font-semibold" : "text-text"}`}>
                        {d.dia}
                      </span>
                      <span className="font-mono text-[11px] text-text-dim ml-auto">
                        {d.qtd > 0 ? `${d.qtd} · ${fmt(d.total)}` : "—"}
                      </span>
                    </div>
                    <Barra fracao={d.total / maxDia} destaque={fraco} />
                  </div>
                );
              })}
            </div>
            {diaMaisFraco && (
              <p className="text-text-dim text-[11.5px] mt-3 pt-3 border-t border-border">
                <span className="text-warn font-semibold">{diaMaisFraco.dia}</span> é seu dia
                mais fraco. É nele que uma promoção rende mais — horário vazio não volta.
              </p>
            )}
          </section>

          <section className="panel p-4">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold mb-3">
              Por horário
            </h2>
            <div className="flex flex-col gap-2">
              {porHora.map((h) => (
                <div key={h.hora} className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-text-dim w-10 shrink-0">
                    {String(h.hora).padStart(2, "0")}h
                  </span>
                  <span className="flex-1">
                    <Barra fracao={h.qtd / maxHora} />
                  </span>
                  <span className="font-mono text-[11px] text-text-dim w-6 text-right shrink-0">
                    {h.qtd}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel p-4">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold mb-3">
              Por serviço
            </h2>
            <div className="flex flex-col gap-2.5">
              {porServico.map((s) => (
                <div key={s.nome}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[12px] text-text truncate">{s.nome}</span>
                    <span className="font-mono text-[11px] text-text-dim ml-auto shrink-0">
                      {s.qtd}x · {fmt(s.total)}
                    </span>
                  </div>
                  <Barra fracao={s.total / maxServico} />
                </div>
              ))}
            </div>
          </section>

          {porBarbeiro.length > 1 && (
            <section className="panel p-4">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold mb-3">
                Por profissional
              </h2>
              <div className="flex flex-col gap-2.5">
                {porBarbeiro.map((b) => (
                  <div key={b.nome}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[12px] text-text truncate">{b.nome}</span>
                      <span className="font-mono text-[11px] text-text-dim ml-auto shrink-0">
                        {b.qtd} · {fmt(b.total)}
                      </span>
                    </div>
                    <Barra fracao={b.total / maxBarbeiro} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
