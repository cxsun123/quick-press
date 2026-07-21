-- ============================================
-- Create themes Storage bucket
-- ============================================
insert into storage.buckets (id, name, public)
values ('themes', 'themes', true)
on conflict (id) do update set public = excluded.public;

-- Storage RLS 策略
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'themes_upload' and tablename = 'objects' and schemaname = 'storage'
  ) then
    create policy "themes_upload" on storage.objects
      for insert to authenticated with check (bucket_id = 'themes');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'themes_read' and tablename = 'objects' and schemaname = 'storage'
  ) then
    create policy "themes_read" on storage.objects
      for select to public using (bucket_id = 'themes');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'themes_delete' and tablename = 'objects' and schemaname = 'storage'
  ) then
    create policy "themes_delete" on storage.objects
      for delete to authenticated using (bucket_id = 'themes');
  end if;
end;
$$;
