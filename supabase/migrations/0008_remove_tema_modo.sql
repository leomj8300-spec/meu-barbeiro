-- O app passou a ter um único modo (sempre claro) — não existe mais escolha
-- de claro/escuro/sistema por usuário, só a cor de destaque (tema_cor).
alter table usuarios drop column tema_modo;
