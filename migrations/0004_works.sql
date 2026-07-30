-- 0004_works.sql
-- brigades, works, work_payments + отложенный FK expenses.work_payment_id

begin;

-- ---------------------------------------------------------------------------
-- brigades — справочник бригад
-- ---------------------------------------------------------------------------
create table public.brigades (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  is_archived boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) on delete set null,
  updated_by  uuid references auth.users(id) on delete set null,
  deleted_at  timestamptz
);

create index idx_brigades_deleted_at on public.brigades (deleted_at);

create trigger trg_brigades_updated_at
  before update on public.brigades
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- works — договорённости с бригадами
-- ---------------------------------------------------------------------------
create table public.works (
  id            uuid primary key default gen_random_uuid(),
  object_id     uuid        not null references public.objects(id)  on delete restrict,
  brigade_id    uuid references public.brigades(id) on delete restrict,  -- NULL = разовая
  brigade_name  text,                                                    -- имя разовой бригады
  title         text        not null,
  agreed_amount bigint check (agreed_amount is null or agreed_amount > 0), -- NULL = без договора
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id) on delete set null,
  updated_by    uuid references auth.users(id) on delete set null,
  deleted_at    timestamptz,
  constraint chk_works_brigade check (brigade_id is not null or brigade_name is not null)
);

create index idx_works_object_id  on public.works (object_id);
create index idx_works_brigade_id on public.works (brigade_id);
create index idx_works_deleted_at on public.works (deleted_at);

create trigger trg_works_updated_at
  before update on public.works
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- work_payments — выплаты по работам
-- Выплата создаёт expense с source='payment' и одной долей на объект работы
-- (логика в приложении). Себестоимость считается ТОЛЬКО по expenses/expense_splits.
-- ---------------------------------------------------------------------------
create table public.work_payments (
  id           uuid primary key default gen_random_uuid(),
  work_id      uuid        not null references public.works(id) on delete restrict,
  amount       bigint      not null check (amount > 0),
  payment_date date        not null default current_date,
  expense_id   uuid references public.expenses(id) on delete restrict,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id) on delete set null,
  updated_by   uuid references auth.users(id) on delete set null,
  deleted_at   timestamptz
);

create index idx_work_payments_work_id    on public.work_payments (work_id);
create index idx_work_payments_expense_id on public.work_payments (expense_id);
create index idx_work_payments_deleted_at on public.work_payments (deleted_at);

create trigger trg_work_payments_updated_at
  before update on public.work_payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Замыкаем цикл: expenses.work_payment_id -> work_payments.id
-- ---------------------------------------------------------------------------
alter table public.expenses
  add constraint fk_expenses_work_payment
  foreign key (work_payment_id) references public.work_payments(id) on delete restrict;

commit;
