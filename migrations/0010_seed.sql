-- 0010_seed.sql
-- Демо-справочники. Идемпотентно: повторный запуск не создаёт дублей.

begin;

-- categories -----------------------------------------------------------------
insert into public.categories (name, sort_order)
select v.name, v.sort_order
from (values
  ('Материалы',      10),
  ('Работа',         20),
  ('Доставка',       30),
  ('Инструмент',     40),
  ('Аренда техники', 50),
  ('Прочее',         60)
) as v(name, sort_order)
where not exists (
  select 1 from public.categories c where c.name = v.name and c.deleted_at is null
);

-- stage_templates ------------------------------------------------------------
insert into public.stage_templates (name, sort_order)
select v.name, v.sort_order
from (values
  ('Подготовка участка',   10),
  ('Фундамент',            20),
  ('Стены',                30),
  ('Кровля',               40),
  ('Внутренняя отделка',   50),
  ('Наружная отделка',     60),
  ('Инженерка внутри',     70),
  ('Инженерка снаружи',    80),
  ('Сдача',                90)
) as v(name, sort_order)
where not exists (
  select 1 from public.stage_templates s where s.name = v.name and s.deleted_at is null
);

-- settings (singleton) --------------------------------------------------------
insert into public.settings (id)
values (1)
on conflict (id) do nothing;

commit;
