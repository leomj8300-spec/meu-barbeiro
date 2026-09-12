"use client";

import { useEffect, useState, useTransition } from "react";
import {
  agendarPublicoAction,
  horariosLivresAction,
} from "@/app/actions/agendamento-publico";
import { fmtMoeda as fmt, rotuloDia, chaveDia } from "@/lib/formato";
import { DIAS_A_FRENTE, somarDias } from "@/lib/horarios";
import type { BarbeariaPublica } from "@/lib/publico";

function fmtDuracao(min: number) {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

/** Os próximos dias em que a barbearia abre, pra escolher sem calendário. */
function proximosDias(diasFuncionamento: number[], hoje: string) {
  const dias: string[] = [];
  for (let i = 0; i <= DIAS_A_FRENTE && dias.length < 14; i++) {
    const dia = somarDias(hoje, i);
    const [ano, mes, d] = dia.split("-").map(Number);
    const js = new Date(Date.UTC(ano, mes - 1, d)).getUTCDay();
    if (diasFuncionamento.includes(js === 0 ? 7 : js)) dias.push(dia);
  }
  return dias;
}

export function AgendarPublico({
  subdominio,
  barbearia,
}: {
  subdominio: string;
  barbearia: BarbeariaPublica;
}) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [barbeiroId, setBarbeiroId] = useState<string>("");
  const [dia, setDia] = useState<string>("");
  const [hora, setHora] = useState<string>("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");

  const [horarios, setHorarios] = useState<string[]>([]);
  const [buscandoHorarios, setBuscandoHorarios] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // O dia de hoje depende do relógio, que o servidor e o navegador só
  // concordam depois da montagem — por isso não sai no HTML inicial.
  const [dias, setDias] = useState<string[]>([]);
  useEffect(() => {
    setDias(proximosDias(barbearia.diasFuncionamento, chaveDia(new Date())));
  }, [barbearia.diasFuncionamento]);

  const escolhidos = barbearia.servicos.filter((s) => selecionados.has(s.id));
  const duracaoTotal = escolhidos.reduce((soma, s) => soma + s.duracaoMin, 0);
  const valorTotal = escolhidos.reduce((soma, s) => soma + s.preco, 0);

  // Cada mudança de serviço, profissional ou dia refaz a lista de horários —
  // o que está livre depende dos três.
  useEffect(() => {
    setHora("");
    if (selecionados.size === 0 || !dia) {
      setHorarios([]);
      return;
    }
    let cancelado = false;
    setBuscandoHorarios(true);
    horariosLivresAction({
      subdominio,
      dia,
      servicoIds: [...selecionados],
      barbeiroId: barbeiroId || undefined,
    }).then((res) => {
      if (cancelado) return;
      setBuscandoHorarios(false);
      if (res.error) setError(res.error);
      else setHorarios(res.horarios);
    });
    return () => {
      cancelado = true;
    };
  }, [subdominio, dia, barbeiroId, selecionados]);

  function alternarServico(id: string) {
    setSelecionados((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  function confirmar() {
    setError(null);
    startTransition(async () => {
      const res = await agendarPublicoAction({
        subdominio,
        dia,
        hora,
        servicoIds: [...selecionados],
        barbeiroId: barbeiroId || undefined,
        nome: nome.trim(),
        telefone: telefone.trim(),
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setToken(res.token ?? null);
    });
  }

  if (token) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-5 py-10 bg-bg">
        <div className="panel p-6 max-w-sm w-full text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-cons font-semibold">
            Horário marcado
          </p>
          <h1 className="heading-display text-2xl text-text mt-2">
            {rotuloDia(`${dia}T12:00:00-03:00`)} às {hora}
          </h1>
          <p className="text-text-dim text-sm mt-1.5">
            {barbearia.nome} · {escolhidos.map((s) => s.nome).join(", ")}
          </p>
          <p className="text-text-dim text-sm mt-4">
            Guarde este link se precisar desmarcar:
          </p>
          <a
            href={`/b/${subdominio}/agendado/${token}`}
            className="block font-mono text-[12px] text-accent-label break-all mt-1.5 underline"
          >
            {`/b/${subdominio}/agendado/${token}`}
          </a>
        </div>
      </main>
    );
  }

  const podeConfirmar =
    selecionados.size > 0 && dia && hora && nome.trim().length >= 2 && telefone.trim().length >= 8;

  return (
    <main className="min-h-dvh bg-bg">
      <header className="panel-ink px-5 py-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-text-dim">
          Agendar horário
        </p>
        <h1 className="heading-display text-2xl text-ink-text mt-1">{barbearia.nome}</h1>
      </header>

      <div className="max-w-[520px] mx-auto px-5 py-6 flex flex-col gap-5">
        {error && (
          <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 rounded-[10px]">
            {error}
          </div>
        )}

        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold mb-2.5">
            1 · O que você quer fazer
          </h2>
          {barbearia.servicos.length === 0 ? (
            <p className="text-text-dim text-sm">Nenhum serviço disponível.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {barbearia.servicos.map((s) => {
                const marcado = selecionados.has(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => alternarServico(s.id)}
                    aria-pressed={marcado}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] border text-left transition-colors ${
                      marcado ? "border-accent bg-accent-soft" : "border-border bg-panel"
                    }`}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13.5px] font-semibold text-text">
                        {s.nome}
                      </span>
                      <span className="block text-[11.5px] text-text-dim">
                        {fmtDuracao(s.duracaoMin)}
                      </span>
                    </span>
                    <span className="font-mono text-[13px] text-text shrink-0">
                      {fmt(s.preco)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {duracaoTotal > 0 && (
            <p className="text-text-dim text-[11.5px] mt-2">
              Total: {fmtDuracao(duracaoTotal)} · {fmt(valorTotal)}
            </p>
          )}
        </section>

        {barbearia.atendentes.length > 1 && (
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold mb-2.5">
              2 · Com quem
            </h2>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setBarbeiroId("")}
                className={`chip ${barbeiroId === "" ? "chip-on" : "chip-off"}`}
              >
                Tanto faz
              </button>
              {barbearia.atendentes.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setBarbeiroId(a.id)}
                  className={`chip ${barbeiroId === a.id ? "chip-on" : "chip-off"}`}
                >
                  {a.nome}
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold mb-2.5">
            {barbearia.atendentes.length > 1 ? "3" : "2"} · Quando
          </h2>
          {selecionados.size === 0 ? (
            <p className="text-text-dim text-sm">Escolha um serviço primeiro.</p>
          ) : (
            <>
              <div className="flex gap-1.5 overflow-x-auto pb-1.5">
                {dias.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDia(d)}
                    className={`chip shrink-0 ${dia === d ? "chip-on" : "chip-off"}`}
                  >
                    {rotuloDia(`${d}T12:00:00-03:00`)}
                  </button>
                ))}
              </div>

              {dia && (
                <div className="mt-3">
                  {buscandoHorarios ? (
                    <p className="text-text-dim text-sm">Procurando horários...</p>
                  ) : horarios.length === 0 ? (
                    <p className="text-text-dim text-sm">
                      Nenhum horário livre nesse dia. Tente outro.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-1.5">
                      {horarios.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setHora(h)}
                          className={`rounded-[10px] border py-2 font-mono text-[12px] font-semibold transition-colors ${
                            hora === h
                              ? "border-accent bg-accent-soft text-accent-label"
                              : "border-border bg-panel text-text-dim"
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {hora && (
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold mb-2.5">
              {barbearia.atendentes.length > 1 ? "4" : "3"} · Seus dados
            </h2>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-panel border border-border rounded-[10px] text-text px-2.5 py-2.5 text-[13.5px] focus:outline-none focus:border-accent"
              />
              <input
                type="tel"
                placeholder="Telefone com DDD"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full bg-panel border border-border rounded-[10px] text-text px-2.5 py-2.5 text-[13.5px] focus:outline-none focus:border-accent"
              />
            </div>
          </section>
        )}

        <button
          type="button"
          onClick={confirmar}
          disabled={!podeConfirmar || pending}
          className="btn-primary w-full justify-center py-3.5 text-[15px]"
        >
          {pending
            ? "Marcando..."
            : hora
              ? `Confirmar ${rotuloDia(`${dia}T12:00:00-03:00`)} às ${hora}`
              : "Escolha um horário"}
        </button>

        <p className="text-text-dim text-[11px] text-center pb-6">
          Dá pra desmarcar pelo link que aparece depois de confirmar.
        </p>
      </div>
    </main>
  );
}
