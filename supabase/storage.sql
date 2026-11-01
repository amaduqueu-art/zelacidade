-- =============================================================================
-- ZelaCidade — Storage (PARTE 2 de 2: bucket + políticas de imagem)
-- Execute DEPOIS de `schema-core.sql`.
-- =============================================================================
-- ATENÇÃO: em projetos Supabase hospedados, o papel `postgres` do SQL Editor
-- normalmente NÃO é dono de `storage.objects`. Por isso, `create policy` em
-- `storage.objects` pode falhar com:
--
--   ERROR: 42501: must be owner of table objects
--
-- Este script tenta criar o bucket e as políticas, mas captura esse erro para
-- não abortar tudo. Se aparecer o aviso "POLÍTICAS DE STORAGE NÃO CRIADAS",
-- crie as 4 políticas pelo Dashboard:
--
--   Storage → Policies → New policy → For full customization
--   (ou Storage → report-images → Policies)
--
-- Políticas necessárias (bucket `report-images`):
--   1. SELECT  | role: public        | using: bucket_id = 'report-images'
--   2. INSERT  | role: authenticated | with check: bucket_id = 'report-images'
--        and (storage.foldername(name))[1] = auth.uid()::text
--   3. UPDATE  | role: authenticated | using/with check: o mesmo do INSERT
--   4. DELETE  | role: authenticated | using: o mesmo do INSERT
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Bucket público (8 MB, apenas imagens)
-- -----------------------------------------------------------------------------
do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'report-images',
    'report-images',
    true,
    8388608, -- 8 MB
    array['image/jpeg', 'image/png', 'image/webp']
  )
  on conflict (id) do update
    set public = excluded.public,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

  raise notice 'BUCKET OK: report-images (público, 8 MB)';
exception
  when insufficient_privilege then
    raise notice 'BUCKET NÃO CRIADO: sem permissão. Crie pelo Dashboard: Storage → New bucket → report-images (Public, 8 MB, image/jpeg, image/png, image/webp).';
end $$;

-- -----------------------------------------------------------------------------
-- 2. Políticas de acesso
-- -----------------------------------------------------------------------------
do $$
begin
  -- Leitura pública das imagens do bucket.
  drop policy if exists "report_images_select_public" on storage.objects;
  create policy "report_images_select_public"
    on storage.objects
    for select
    to anon, authenticated
    using (bucket_id = 'report-images');

  -- Upload apenas para usuários autenticados, dentro da própria pasta:
  -- caminho esperado: <user_id>/<report_id>/arquivo.jpg
  drop policy if exists "report_images_insert_own" on storage.objects;
  create policy "report_images_insert_own"
    on storage.objects
    for insert
    to authenticated
    with check (
      bucket_id = 'report-images'
      and (storage.foldername(name))[1] = auth.uid()::text
    );

  drop policy if exists "report_images_update_own" on storage.objects;
  create policy "report_images_update_own"
    on storage.objects
    for update
    to authenticated
    using (
      bucket_id = 'report-images'
      and (storage.foldername(name))[1] = auth.uid()::text
    )
    with check (
      bucket_id = 'report-images'
      and (storage.foldername(name))[1] = auth.uid()::text
    );

  drop policy if exists "report_images_delete_own" on storage.objects;
  create policy "report_images_delete_own"
    on storage.objects
    for delete
    to authenticated
    using (
      bucket_id = 'report-images'
      and (storage.foldername(name))[1] = auth.uid()::text
    );

  raise notice 'POLÍTICAS DE STORAGE OK';
exception
  when insufficient_privilege then
    raise notice 'POLÍTICAS DE STORAGE NÃO CRIADAS: must be owner of table objects. Crie as 4 políticas pelo Dashboard (Storage → Policies). Veja o cabeçalho deste arquivo.';
end $$;

-- -----------------------------------------------------------------------------
-- 3. Verificação
-- -----------------------------------------------------------------------------
-- select id, public, file_size_limit, allowed_mime_types
-- from storage.buckets where id = 'report-images';
--
-- select policyname, cmd, roles
-- from pg_policies
-- where schemaname = 'storage' and tablename = 'objects';
