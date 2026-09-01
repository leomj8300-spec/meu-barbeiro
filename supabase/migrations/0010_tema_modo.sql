-- Reintroduz o modo de tema (claro/escuro/automático) por usuário — a
-- coluna já existiu (0007) e foi removida (0008) antes de o CSS escuro
-- chegar a existir. Default 'claro' pra ninguém mudar de cor sem escolher.

alter table usuarios
  add column tema_modo text not null default 'claro'
    check (tema_modo in ('claro', 'escuro', 'automatico'));
