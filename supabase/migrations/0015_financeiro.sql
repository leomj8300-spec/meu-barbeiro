-- Gestão financeira: forma de pagamento com taxa, contas a pagar/receber e
-- vale de barbeiro.
--
-- Até aqui o app sabia quanto entrou, mas não quanto sobrou. Faturamento não
-- é lucro: maquininha come 3% a 5%, aluguel e produto saem todo mês, e vale
-- adiantado ao barbeiro precisa descontar da comissão no fim do período.

create table formas_pagamento (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  nome text not null,
  -- Quanto a maquininha (ou o gateway) leva. Dinheiro e Pix ficam em 0.
  taxa_pct numeric(5,2) not null default 0 check (taxa_pct >= 0 and taxa_pct <= 100),
  ativa boolean not null default true,
  criado_em timestamptz not null default now()
);

create index formas_pagamento_barbearia_id_idx on formas_pagamento(barbearia_id);

alter table atendimentos
  add column forma_pagamento_id uuid references formas_pagamento(id) on delete set null,
  -- Taxa travada no momento do registro, igual o preço do serviço: se a
  -- barbearia renegociar a maquininha depois, o histórico não pode mudar.
  add column taxa_pct numeric(5,2) not null default 0
    check (taxa_pct >= 0 and taxa_pct <= 100);

-- Sugestões iniciais pra barbearia não começar com a lista vazia. Dinheiro e
-- Pix sem taxa; as de cartão ficam em 0 pra o dono preencher com a taxa real
-- da maquininha dele, que varia de contrato pra contrato.
insert into formas_pagamento (barbearia_id, nome, taxa_pct)
select b.id, f.nome, 0
from barbearias b
cross join (values ('Dinheiro'), ('Pix'), ('Débito'), ('Crédito')) as f(nome);

create table contas (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  tipo text not null check (tipo in ('pagar', 'receber')),
  descricao text not null,
  valor numeric(10,2) not null check (valor >= 0),
  vencimento date not null,
  pago boolean not null default false,
  pago_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index contas_barbearia_vencimento_idx on contas(barbearia_id, vencimento);
create index contas_em_aberto_idx on contas(barbearia_id, pago);

create trigger trg_contas_atualizado_em
before update on contas
for each row execute function set_atualizado_em();

-- Vale/adiantamento: dinheiro que o barbeiro pegou antes do fechamento e que
-- precisa sair da comissão dele no acerto.
create table vales (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  barbeiro_id uuid not null references usuarios(id) on delete cascade,
  valor numeric(10,2) not null check (valor > 0),
  descricao text,
  -- Vira false quando o vale já foi descontado num fechamento.
  em_aberto boolean not null default true,
  criado_em timestamptz not null default now()
);

create index vales_barbearia_idx on vales(barbearia_id, em_aberto);
create index vales_barbeiro_idx on vales(barbeiro_id, em_aberto);

alter table formas_pagamento enable row level security;
alter table contas enable row level security;
alter table vales enable row level security;

-- ========== formas_pagamento ==========
-- Todo mundo lê (o barbeiro escolhe a forma ao registrar); só o dono mexe na
-- lista e nas taxas.
create policy "select formas do tenant" on formas_pagamento
  for select using (barbearia_id = auth_barbearia_id());

create policy "dono cria forma" on formas_pagamento
  for insert with check (
    barbearia_id = auth_barbearia_id() and auth_papel() = 'dono'
  );

create policy "dono atualiza forma" on formas_pagamento
  for update using (
    barbearia_id = auth_barbearia_id() and auth_papel() = 'dono'
  );

create policy "dono remove forma" on formas_pagamento
  for delete using (
    barbearia_id = auth_barbearia_id() and auth_papel() = 'dono'
  );

-- ========== contas ==========
-- Aluguel, fornecedor e luz são coisa do dono: o barbeiro não vê nem mexe.
create policy "dono le contas" on contas
  for select using (
    barbearia_id = auth_barbearia_id() and auth_papel() = 'dono'
  );

create policy "dono cria conta" on contas
  for insert with check (
    barbearia_id = auth_barbearia_id() and auth_papel() = 'dono'
  );

create policy "dono atualiza conta" on contas
  for update using (
    barbearia_id = auth_barbearia_id() and auth_papel() = 'dono'
  );

create policy "dono remove conta" on contas
  for delete using (
    barbearia_id = auth_barbearia_id() and auth_papel() = 'dono'
  );

-- ========== vales ==========
-- O barbeiro precisa ver o que já pegou adiantado (é o que explica a comissão
-- menor no acerto), mas quem lança é o dono.
create policy "select vales" on vales
  for select using (
    barbearia_id = auth_barbearia_id()
    and (auth_papel() = 'dono' or barbeiro_id = auth.uid())
  );

create policy "dono cria vale" on vales
  for insert with check (
    barbearia_id = auth_barbearia_id() and auth_papel() = 'dono'
  );

create policy "dono atualiza vale" on vales
  for update using (
    barbearia_id = auth_barbearia_id() and auth_papel() = 'dono'
  );

create policy "dono remove vale" on vales
  for delete using (
    barbearia_id = auth_barbearia_id() and auth_papel() = 'dono'
  );
