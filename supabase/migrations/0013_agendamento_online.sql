-- Agendamento online: o cliente marca sozinho, sem ligar pra barbearia.
--
-- A página é pública (roda sem login) e por isso só enxerga o que pode ser
-- público: nome da barbearia, serviços, profissionais e quais horários estão
-- livres. Nunca a carteira de clientes, telefones de terceiros ou faturamento.
--
-- Fica desligado por padrão: publicar a agenda da barbearia na internet é
-- decisão do dono, não algo que acontece sozinho numa atualização.

alter table barbearia_configuracoes
  add column agendamento_online_habilitado boolean not null default false;

alter table agendamentos
  -- Como o cliente não tem login, o link secreto é o que prova que o
  -- horário é dele — é por ele que desmarca. Sem isso, a alternativa seria
  -- deixar qualquer um que saiba um telefone cancelar o corte alheio.
  add column token_publico uuid not null default gen_random_uuid(),
  add column origem text not null default 'barbearia'
    check (origem in ('barbearia', 'cliente'));

create unique index agendamentos_token_publico_idx on agendamentos(token_publico);
