-- Retenção: lembrar quem tem horário, chamar de volta quem sumiu e medir o
-- atendimento.
--
-- O app não dispara mensagem sozinho de propósito: WhatsApp oficial e SMS
-- cobram por mensagem, o que viraria custo fixo mesmo com a barbearia parada.
-- Em vez disso ele monta a lista com o texto pronto e o barbeiro envia do
-- próprio número num toque — que é o número que o cliente reconhece e
-- responde.
--
-- A avaliação mora no atendimento (e não no agendamento) porque quem atende
-- por ordem de chegada também precisa medir a qualidade.

alter table barbearia_configuracoes
  -- Depois de quantos dias sem aparecer o cliente entra na lista de "sumidos".
  add column dias_para_retorno integer not null default 30
    check (dias_para_retorno > 0 and dias_para_retorno <= 365);

alter table atendimentos
  -- Link secreto da avaliação: sem ele, qualquer um poderia dar nota (ou
  -- várias) no atendimento dos outros.
  add column token_avaliacao uuid not null default gen_random_uuid(),
  add column nota integer check (nota >= 1 and nota <= 5),
  add column avaliacao_comentario text,
  add column avaliado_em timestamptz;

create unique index atendimentos_token_avaliacao_idx on atendimentos(token_avaliacao);
create index atendimentos_nota_idx on atendimentos(barbearia_id, nota);
