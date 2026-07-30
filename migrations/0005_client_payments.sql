-- 0005_client_payments.sql
-- client_payments, client_payment_plan
-- Ограничение «только для договорных объектов» — на стороне приложения:
-- в базе objects.type может меняться, и CHECK через подзапрос в Postgres невозможен.

begin;

create table public.client_payments (
  id           uuid primary key default gen_random_uuid(),
  object_id    uuid        not null references public.objects(id) on delete restrict,
  amount       bigint      not null check (amount > 0),
  payment_date date        not null default current_date,
  is_escrow    boolean     not null default false,
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id) on delete set null,
  updated_by   uuid references auth.users(id) on delete set null,
  deleted_at   timestamptz
);

create index idx_client_payments_object_id  on public.client_payments (object_id);
create index idx_client_payments_deleted_at on public.client_payments (deleted_at);

create trigger trg_client_payments_updated_at
  before update on public.client_payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- client_payment_plan — план ожидаемых поступлений
-- ---------------------------------------------------------------------------
create table public.client_payment_plan (
  id            uuid primary key default gen_random_uuid(),
  object_id     uuid        not null references public.objects(id) on delete restrict,
  title         text        not null,
  amount        bigint      not null check (amount > 0),
  expected_date date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id) on delete set null,
  updated_by    uuid references auth.users(id) on delete set null,
  deleted_at    timestamptz
);

create index idx_client_payment_plan_object_id  on public.client_payment_plan (object_id);
create index idx_client_payment_plan_deleted_at on public.client_payment_plan (deleted_at);

create trigger trg_client_payment_plan_updated_at
  before update on public.client_payment_plan
  for each row execute function public.set_updated_at();

commit;
