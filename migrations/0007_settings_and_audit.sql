-- 0007_settings_and_audit.sql
-- settings (singleton), audit_log + триггеры аудита

begin;

-- ---------------------------------------------------------------------------
-- settings — ровно одна строка (id = 1)
-- deleted_at сознательно нет: singleton не удаляется.
-- ---------------------------------------------------------------------------
create table public.settings (
  id                     int         primary key check (id = 1),
  executor_details       jsonb       not null default '{}'::jsonb,
  stage_template_version int         not null default 1,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  created_by             uuid references auth.users(id) on delete set null,
  updated_by             uuid references auth.users(id) on delete set null
);


create trigger trg_settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- audit_log — пишется только триггерами
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  table_name text        not null,
  row_id     uuid        not null,
  action     text        not null check (action in ('INSERT','UPDATE','DELETE')),
  old_data   jsonb,
  new_data   jsonb,
  changed_by uuid,
  changed_at timestamptz not null default now()
);

create index idx_audit_log_table_row  on public.audit_log (table_name, row_id);
create index idx_audit_log_changed_at on public.audit_log (changed_at);

-- ---------------------------------------------------------------------------
-- Функция аудита. SECURITY DEFINER, чтобы запись в audit_log не зависела от RLS.
-- ---------------------------------------------------------------------------
create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row_id uuid;
begin
  if tg_op = 'DELETE' then
    v_row_id := old.id;
  else
    v_row_id := new.id;
  end if;

  insert into public.audit_log (table_name, row_id, action, old_data, new_data, changed_by)
  values (
    tg_table_name,
    v_row_id,
    tg_op,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end,
    public.current_user_id()
  );

  return null;   -- AFTER-триггер, возвращаемое значение игнорируется
end;
$$;

-- ---------------------------------------------------------------------------
-- Вешаем аудит на бизнес-таблицы
-- ---------------------------------------------------------------------------
create trigger trg_audit_objects
  after insert or update or delete on public.objects
  for each row execute function public.audit_trigger();

create trigger trg_audit_expenses
  after insert or update or delete on public.expenses
  for each row execute function public.audit_trigger();

create trigger trg_audit_expense_splits
  after insert or update or delete on public.expense_splits
  for each row execute function public.audit_trigger();

create trigger trg_audit_works
  after insert or update or delete on public.works
  for each row execute function public.audit_trigger();

create trigger trg_audit_work_payments
  after insert or update or delete on public.work_payments
  for each row execute function public.audit_trigger();

create trigger trg_audit_client_payments
  after insert or update or delete on public.client_payments
  for each row execute function public.audit_trigger();

create trigger trg_audit_acts
  after insert or update or delete on public.acts
  for each row execute function public.audit_trigger();

create trigger trg_audit_notes
  after insert or update or delete on public.notes
  for each row execute function public.audit_trigger();

commit;
