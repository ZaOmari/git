-- 0008_rls.sql
-- RLS на всех таблицах приложения.
-- Политика одна для всех: любой аутентифицированный пользователь имеет полный доступ.
-- Роли пока не различаем — оба партнёра равноправны.
-- service_role в Supabase имеет атрибут BYPASSRLS, поэтому видит всё и без политик.

begin;

do $$
declare
  t text;
  tables text[] := array[
    'profiles','objects','stage_templates','stages','categories',
    'expenses','expense_splits','brigades','works','work_payments',
    'client_payments','client_payment_plan','notes','attachments',
    'acts','settings','audit_log'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security', t);

    execute format($f$
      create policy authenticated_all on public.%I
        for all
        to authenticated
        using (auth.uid() is not null)
        with check (auth.uid() is not null)
    $f$, t);
  end loop;
end;
$$;

-- Явные гранты (не полагаемся на default privileges схемы public).
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

-- anon (неаутентифицированный) не должен видеть ничего.
revoke all on all tables in schema public from anon;

-- audit_log пишется только триггерами (SECURITY DEFINER); прямую запись клиентам
-- закрываем на уровне грантов, чтение через политику выше остаётся доступным.
revoke insert, update, delete on public.audit_log from authenticated, anon;

commit;
