-- Ficha do cliente.
--
-- Até aqui "cliente" era só um texto digitado em cada atendimento: dois
-- cortes do mesmo Joaquim não tinham nenhuma ligação entre si. Isso impede
-- tudo que depende de conhecer a pessoa — aniversário, histórico de quanto
-- gastou, fidelidade, pacote, lembrete de retorno.
--
-- A coluna de texto continua existindo em atendimentos e agendamentos: ela
-- guarda o nome como foi escrito naquele dia, e serve de histórico para os
-- registros antigos. A ligação nova (cliente_id) é o que passa a valer.

create table clientes (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  nome text not null,
  telefone text,
  -- Só dia e mês importam na prática, mas guardar a data inteira permite
  -- saber a idade se um dia fizer falta.
  aniversario date,
  observacao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index clientes_barbearia_id_idx on clientes(barbearia_id);
-- Busca por nome na tela de clientes e no autocompletar do atendimento.
create index clientes_nome_idx on clientes(barbearia_id, lower(nome));
-- Aniversariantes do mês.
create index clientes_aniversario_idx on clientes(barbearia_id, aniversario);

create trigger trg_clientes_atualizado_em
before update on clientes
for each row execute function set_atualizado_em();

-- Excluir a ficha não pode apagar o histórico de dinheiro: o atendimento
-- continua lá com o nome escrito na época, só perde o vínculo.
alter table atendimentos
  add column cliente_id uuid references clientes(id) on delete set null;
alter table agendamentos
  add column cliente_id uuid references clientes(id) on delete set null;

create index atendimentos_cliente_id_idx on atendimentos(cliente_id);
create index agendamentos_cliente_id_idx on agendamentos(cliente_id);

-- ---------- Aproveita quem já está no histórico ----------
-- Sem isso a tela de clientes nasceria vazia, mesmo com meses de atendimento
-- registrado. Um cliente por nome distinto (ignorando maiúsculas e espaços),
-- mantendo a grafia da primeira vez que apareceu.

insert into clientes (barbearia_id, nome)
select distinct on (barbearia_id, lower(trim(cliente)))
       barbearia_id, trim(cliente)
from atendimentos
where trim(cliente) <> ''
order by barbearia_id, lower(trim(cliente)), criado_em;

-- Nomes que só existem em agendamentos (marcado e ainda não atendido).
insert into clientes (barbearia_id, nome)
select distinct on (a.barbearia_id, lower(trim(a.cliente)))
       a.barbearia_id, trim(a.cliente)
from agendamentos a
where trim(a.cliente) <> ''
  and not exists (
    select 1 from clientes c
    where c.barbearia_id = a.barbearia_id
      and lower(c.nome) = lower(trim(a.cliente))
  )
order by a.barbearia_id, lower(trim(a.cliente)), a.criado_em;

update atendimentos a
set cliente_id = c.id
from clientes c
where c.barbearia_id = a.barbearia_id
  and lower(c.nome) = lower(trim(a.cliente));

update agendamentos a
set cliente_id = c.id
from clientes c
where c.barbearia_id = a.barbearia_id
  and lower(c.nome) = lower(trim(a.cliente));

alter table clientes enable row level security;

-- ========== clientes ==========
-- A ficha é da barbearia, não de um barbeiro: qualquer um do tenant vê e
-- cadastra (o barbeiro precisa cadastrar na hora de atender alguém novo).
-- Só o dono exclui, porque excluir desliga o histórico da pessoa.
create policy "select clientes do tenant" on clientes
  for select using (barbearia_id = auth_barbearia_id());

create policy "insere cliente no tenant" on clientes
  for insert with check (barbearia_id = auth_barbearia_id());

create policy "atualiza cliente do tenant" on clientes
  for update using (barbearia_id = auth_barbearia_id());

create policy "dono remove cliente" on clientes
  for delete using (
    barbearia_id = auth_barbearia_id() and auth_papel() = 'dono'
  );
