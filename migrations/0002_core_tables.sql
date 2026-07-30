-- 0002_core_tables.sql
-- profiles, objects, stage_templates, stages, categories

begin;

-- ---------------------------------------------------------------------------
-- profiles — профили поверх auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text        not null,
  role         text        not null default 'partner' check (role in ('partner')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Автосоздание профиля при регистрации пользователя.
-- SECURITY DEFINER: триггер выполняется в контексте supabase_auth_admin,
-- у которого нет прав на public.profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Партнёр'),
    'partner'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- objects — объекты строительства
-- ---------------------------------------------------------------------------
create table public.objects (
  id              uuid primary key default gen_random_uuid(),
  name            text        not null,
  type            text        not null check (type in ('contract','spec')),
  client_name     text,
  contract_price  bigint,                       -- копейки
  sale_price      bigint,                       -- копейки
  status          text        not null default 'active' check (status in ('active','archived')),
  warn_threshold  int         not null default 85,
  is_public       boolean     not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id) on delete set null,
  updated_by      uuid references auth.users(id) on delete set null,
  deleted_at      timestamptz
);

create index idx_objects_deleted_at on public.objects (deleted_at);

create trigger trg_objects_updated_at
  before update on public.objects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- stage_templates — шаблон этапов по умолчанию
-- ---------------------------------------------------------------------------
create table public.stage_templates (
  id         uuid primary key default gen_random_uuid(),
  name       text        not null,
  sort_order int         not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  deleted_at timestamptz
);

create index idx_stage_templates_deleted_at on public.stage_templates (deleted_at);

create trigger trg_stage_templates_updated_at
  before update on public.stage_templates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- stages — этапы конкретного объекта
-- ---------------------------------------------------------------------------
create table public.stages (
  id         uuid primary key default gen_random_uuid(),
  object_id  uuid        not null references public.objects(id) on delete restrict,
  name       text        not null,
  sort_order int         not null,
  status     text        not null default 'future' check (status in ('done','current','future')),
  is_public  boolean     not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  deleted_at timestamptz
);

create index idx_stages_object_id  on public.stages (object_id);
create index idx_stages_deleted_at on public.stages (deleted_at);

create trigger trg_stages_updated_at
  before update on public.stages
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- categories — категории расходов
-- ---------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  sort_order  int         not null default 0,
  is_archived boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) on delete set null,
  updated_by  uuid references auth.users(id) on delete set null,
  deleted_at  timestamptz
);

create index idx_categories_deleted_at on public.categories (deleted_at);

create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

commit;
