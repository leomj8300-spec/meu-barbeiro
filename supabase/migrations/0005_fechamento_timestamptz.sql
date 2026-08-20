-- semana_inicio/semana_fim precisam de precisão de horário (não só data) para
-- que o corte de período não conte errado um atendimento registrado na
-- borda do dia do fechamento.
alter table fechamentos_semanais
  alter column semana_inicio type timestamptz using semana_inicio::timestamptz,
  alter column semana_fim type timestamptz using semana_fim::timestamptz;
