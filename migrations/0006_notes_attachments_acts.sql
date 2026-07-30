-- 0006_notes_attachments_acts.sql
-- notes, attachments, acts

begin;

-- ---------------------------------------------------------------------------
-- notes — заметки по объекту
-- ---------------------------------------------------------------------------
create table public.notes (
  id         uuid primary key default gen_random_uuid(),
  object_id  uuid        not null references public.objects(id) on delete restrict,
  body       text        not null,
  pinned     boolean     not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  deleted_at timestamptz
);

create index idx_notes_object_id  on public.notes (object_id);
create index idx_notes_deleted_at on public.notes (deleted_at);

-- не больше одной закреплённой живой заметки на объект
create unique index uq_notes_one_pinned_per_object
  on public.notes (object_id)
  where pinned and deleted_at is null;

create trigger trg_notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- attachments — вложения (полиморфная ссылка, FK нет по построению)
-- ---------------------------------------------------------------------------
create table public.attachments (
  id           uuid primary key default gen_random_uuid(),
  parent_type  text        not null check (parent_type in ('expense','note','act_pdf','act_signature')),
  parent_id    uuid        not null,
  storage_path text        not null,
  mime_type    text        not null,
  size_bytes   bigint      not null,
  is_public    boolean     not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id) on delete set null,
  updated_by   uuid references auth.users(id) on delete set null,
  deleted_at   timestamptz
);

create index idx_attachments_parent     on public.attachments (parent_type, parent_id);
create index idx_attachments_deleted_at on public.attachments (deleted_at);

create trigger trg_attachments_updated_at
  before update on public.attachments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- acts — акты приёма работ
-- ---------------------------------------------------------------------------
create table public.acts (
  id               uuid primary key default gen_random_uuid(),
  object_id        uuid        not null references public.objects(id) on delete restrict,
  act_number       int         not null,
  act_year         int         not null default extract(year from now())::int,
  title            text        not null,
  amount           bigint      not null check (amount > 0),
  status           text        not null default 'draft' check (status in ('draft','signed')),
  executor_details jsonb       not null,          -- снимок реквизитов исполнителя
  customer_details jsonb       not null default '{}'::jsonb,
  signed_at        timestamptz,
  sent_to_email    text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references auth.users(id) on delete set null,
  updated_by       uuid references auth.users(id) on delete set null,
  deleted_at       timestamptz,
  constraint uq_acts_year_number unique (act_year, act_number)
);

create index idx_acts_object_id  on public.acts (object_id);
create index idx_acts_deleted_at on public.acts (deleted_at);

create trigger trg_acts_updated_at
  before update on public.acts
  for each row execute function public.set_updated_at();

commit;
