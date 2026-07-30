-- 0003_expenses.sql
-- expenses, expense_splits
-- Внимание: expenses.work_payment_id создаётся БЕЗ внешнего ключа —
-- FK добавляется в 0004 после создания work_payments (циклическая зависимость).

begin;

create table public.expenses (
  id              uuid primary key default gen_random_uuid(),
  description     text        not null,
  amount          bigint      not null check (amount > 0),          -- копейки
  expense_date    date        not null default current_date,
  category_id     uuid references public.categories(id) on delete restrict,
  payment_status  text        not null default 'paid' check (payment_status in ('paid','due')),
  source          text        not null default 'manual' check (source in ('manual','payment','bank_import')),
  work_payment_id uuid,                                             -- FK см. 0004
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id) on delete set null,
  updated_by      uuid references auth.users(id) on delete set null,
  deleted_at      timestamptz
);

create index idx_expenses_category_id     on public.expenses (category_id);
create index idx_expenses_work_payment_id on public.expenses (work_payment_id);
create index idx_expenses_expense_date    on public.expenses (expense_date);
create index idx_expenses_deleted_at      on public.expenses (deleted_at);

create trigger trg_expenses_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- expense_splits — доли расхода по объектам
-- Обычный расход = одна строка на 100% суммы.
-- Себестоимость объекта = SUM(amount) по object_id с учётом deleted_at родителя.
-- ---------------------------------------------------------------------------
create table public.expense_splits (
  id         uuid primary key default gen_random_uuid(),
  expense_id uuid        not null references public.expenses(id) on delete cascade,
  object_id  uuid        not null references public.objects(id)  on delete restrict,
  amount     bigint      not null check (amount > 0),               -- копейки
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  deleted_at timestamptz,
  constraint uq_expense_splits_expense_object unique (expense_id, object_id)
);

create index idx_expense_splits_expense_id on public.expense_splits (expense_id);
create index idx_expense_splits_object_id  on public.expense_splits (object_id);
create index idx_expense_splits_deleted_at on public.expense_splits (deleted_at);

create trigger trg_expense_splits_updated_at
  before update on public.expense_splits
  for each row execute function public.set_updated_at();

commit;
