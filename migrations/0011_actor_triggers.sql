-- 0011_actor_triggers.sql
-- Автозаполнение created_by / updated_by из JWT.
--
-- Почему триггер, а не DEFAULT: при офлайн-синке клиент присылает полные объекты,
-- поэтому «колонка не передана» — ненадёжный признак. Триггер ПЕРЕТИРАЕТ присланное
-- значение, что заодно исключает подделку авторства.
--
-- Исключение: если JWT нет (service_role, psql, миграции) — current_user_id() вернёт
-- NULL, и мы оставляем присланное значение как есть. Никаких падений.
--
-- Источник личности — public.current_user_id() (см. 0001), а не auth.uid():
-- у неё есть обработка отсутствующих/битых клеймов, и ровно её же использует аудит.

begin;

-- ---------------------------------------------------------------------------
-- BEFORE INSERT: автор строки
-- ---------------------------------------------------------------------------
create or replace function public.set_created_by()
returns trigger
language plpgsql
as $$
declare
  v_uid uuid := public.current_user_id();
begin
  if v_uid is not null then
    new.created_by := v_uid;   -- перетираем присланное клиентом
    new.updated_by := v_uid;   -- на вставке автор = редактор
  end if;
  return new;
end;
$$;

comment on function public.set_created_by() is
  'BEFORE INSERT: проставляет created_by/updated_by из JWT, перетирая значение клиента. Без JWT не трогает строку.';

-- ---------------------------------------------------------------------------
-- BEFORE UPDATE: updated_at + кто правил
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
declare
  v_uid uuid := public.current_user_id();
begin
  new.updated_at := now();
  if v_uid is not null then
    new.updated_by := v_uid;   -- перетираем присланное клиентом
  end if;
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'BEFORE UPDATE: обновляет updated_at и updated_by. Без JWT updated_by не трогает.';

-- ---------------------------------------------------------------------------
-- Вешаем set_created_by на все таблицы, где есть created_by.
-- profiles и audit_log в список не входят: у них таких колонок нет.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'objects','stage_templates','stages','categories',
    'expenses','expense_splits','brigades','works','work_payments',
    'client_payments','client_payment_plan','notes','attachments',
    'acts','settings'
  ];
begin
  foreach t in array tables loop
    -- drop+create, чтобы полный прогон с нуля был воспроизводим
    execute format(
      'drop trigger if exists trg_%s_set_created_by on public.%I', t, t);
    execute format(
      'create trigger trg_%s_set_created_by before insert on public.%I
         for each row execute function public.set_created_by()', t, t);
  end loop;
end;
$$;

commit;
