-- 0001_extensions_and_helpers.sql
-- Расширения и общие вспомогательные функции/триггеры.

begin;

create extension if not exists pgcrypto;      -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Текущий пользователь из JWT (request.jwt.claims -> sub).
-- Аккуратно обрабатывает отсутствие настройки и невалидный JSON: возвращает NULL.
-- ---------------------------------------------------------------------------
create or replace function public.current_user_id()
returns uuid
language plpgsql
stable
as $$
declare
  v_claims text;
  v_uid    uuid;
begin
  begin
    v_claims := current_setting('request.jwt.claims', true);
  exception when others then
    return null;
  end;

  if v_claims is null or v_claims = '' then
    return null;
  end if;

  begin
    v_uid := nullif(v_claims::json ->> 'sub', '')::uuid;
  exception when others then
    return null;
  end;

  return v_uid;
end;
$$;

comment on function public.current_user_id() is
  'UUID текущего пользователя из JWT-клеймов PostgREST; NULL, если клеймов нет.';

-- ---------------------------------------------------------------------------
-- Автообновление updated_at.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

commit;
