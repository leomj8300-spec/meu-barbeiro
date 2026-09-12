-- Modo de atendimento por agendamento.
--
-- Até aqui o app só sabia trabalhar por ordem de chegada: o barbeiro digita
-- o nome de quem sentou na cadeira e registra. Barbearia que marca hora
-- precisa do contrário — saber o dia inteiro de antemão. O dono escolhe o
-- modo no onboarding (ou depois, nas Configurações) e os dois são
-- exclusivos: marcando hora, todo atendimento nasce de um agendamento.
--
-- O agendamento não substitui o atendimento: quando o cliente senta, vira um
-- atendimento normal (ligado por atendimento_id). Assim fiado, consumo,
-- estoque, comissão, caixinha, Caixa e Histórico continuam iguais.

alter table barbearia_configuracoes
  add column modo_atendimento text not null default 'ordem_chegada'
    check (modo_atendimento in ('ordem_chegada', 'agendamento')),
  -- Delimita a grade do dia e evita marcar às 3h da manhã por engano.
  add column hora_abertura time not null default '09:00',
  add column hora_fechamento time not null default '19:00',
  -- 1=segunda .. 7=domingo, mesma convenção de dia_inicio_periodo.
  add column dias_funcionamento integer[] not null default '{1,2,3,4,5,6}';

-- Sem duração não dá pra montar agenda: é ela que diz onde o próximo cliente
-- cabe. Corte 30min, corte+barba 50min — o barbeiro configura uma vez.
alter table servicos
  add column duracao_min integer not null default 30
    check (duracao_min > 0 and duracao_min <= 480);

create table agendamentos (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  barbeiro_id uuid not null references usuarios(id) on delete restrict,
  cliente text not null,
  telefone text,
  inicio timestamptz not null,
  duracao_min integer not null check (duracao_min > 0),
  status text not null default 'marcado'
    check (status in ('marcado', 'atendido', 'cancelado', 'faltou')),
  observacao text,
  -- Preenchido quando o agendamento vira atendimento de verdade.
  atendimento_id uuid references atendimentos(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index agendamentos_dia_idx on agendamentos(barbearia_id, inicio);
create index agendamentos_barbeiro_idx on agendamentos(barbeiro_id, inicio);

-- Serviços previstos: preço e duração travados na marcação, igual
-- atendimento_servicos trava no registro. Servem pra somar a duração e pra
-- pré-preencher o registro quando o cliente senta.
create table agendamento_servicos (
  id uuid primary key default gen_random_uuid(),
  agendamento_id uuid not null references agendamentos(id) on delete cascade,
  servico_id uuid not null references servicos(id) on delete restrict,
  nome text not null,
  preco numeric(10,2) not null,
  duracao_min integer not null
);

create index agendamento_servicos_agendamento_id_idx
  on agendamento_servicos(agendamento_id);

create trigger trg_agendamentos_atualizado_em
before update on agendamentos
for each row execute function set_atualizado_em();

alter table agendamentos enable row level security;
alter table agendamento_servicos enable row level security;

-- ========== agendamentos ==========
-- Dono organiza o dia da barbearia inteira; barbeiro só a agenda dele.
-- Diferente de atendimentos (onde nem o dono registra em nome de outro), aqui
-- o insert aceita o dono marcando pra qualquer barbeiro: quem atende o
-- telefone no balcão costuma ser o dono, e ele marca pra quem estiver livre.
create policy "select agendamentos" on agendamentos
  for select using (
    barbearia_id = auth_barbearia_id()
    and (auth_papel() = 'dono' or barbeiro_id = auth.uid())
  );

create policy "insere agendamento" on agendamentos
  for insert with check (
    barbearia_id = auth_barbearia_id()
    and (auth_papel() = 'dono' or barbeiro_id = auth.uid())
  );

create policy "atualiza agendamento" on agendamentos
  for update using (
    barbearia_id = auth_barbearia_id()
    and (auth_papel() = 'dono' or barbeiro_id = auth.uid())
  );

create policy "remove agendamento" on agendamentos
  for delete using (
    barbearia_id = auth_barbearia_id()
    and (auth_papel() = 'dono' or barbeiro_id = auth.uid())
  );

-- ========== agendamento_servicos ==========
-- Sem barbearia_id direto — segue a visibilidade do agendamento pai, igual
-- atendimento_servicos segue atendimentos.
create policy "select servicos do agendamento" on agendamento_servicos
  for select using (
    exists (
      select 1 from agendamentos a
      where a.id = agendamento_servicos.agendamento_id
        and a.barbearia_id = auth_barbearia_id()
        and (auth_papel() = 'dono' or a.barbeiro_id = auth.uid())
    )
  );

create policy "insere servico no agendamento" on agendamento_servicos
  for insert with check (
    exists (
      select 1 from agendamentos a
      where a.id = agendamento_servicos.agendamento_id
        and a.barbearia_id = auth_barbearia_id()
        and (auth_papel() = 'dono' or a.barbeiro_id = auth.uid())
    )
  );

create policy "remove servico do agendamento" on agendamento_servicos
  for delete using (
    exists (
      select 1 from agendamentos a
      where a.id = agendamento_servicos.agendamento_id
        and a.barbearia_id = auth_barbearia_id()
        and (auth_papel() = 'dono' or a.barbeiro_id = auth.uid())
    )
  );
