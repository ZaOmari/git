-- 0009_storage.sql
-- Приватный бакет "attachments" + политики доступа.
-- Файлы отдаются только по подписанным ссылкам (public = false).

begin;

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- RLS на storage.objects включён самим Supabase; добавляем только политики.
drop policy if exists attachments_authenticated_select on storage.objects;
drop policy if exists attachments_authenticated_insert on storage.objects;
drop policy if exists attachments_authenticated_update on storage.objects;
drop policy if exists attachments_authenticated_delete on storage.objects;

create policy attachments_authenticated_select on storage.objects
  for select to authenticated
  using (bucket_id = 'attachments' and auth.uid() is not null);

create policy attachments_authenticated_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'attachments' and auth.uid() is not null);

create policy attachments_authenticated_update on storage.objects
  for update to authenticated
  using (bucket_id = 'attachments' and auth.uid() is not null)
  with check (bucket_id = 'attachments' and auth.uid() is not null);

create policy attachments_authenticated_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'attachments' and auth.uid() is not null);

commit;
