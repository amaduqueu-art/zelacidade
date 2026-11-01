-- =============================================================================
-- ZelaCidade — Esquema completo do Supabase
-- Execute este arquivo no SQL Editor do seu projeto Supabase (uma única vez).
-- =============================================================================
-- O que este script cria:
--   1. Tipos enumerados (categoria e status)
--   2. Tabelas `reports` e `upvotes` (com validações e índices)
--   3. Triggers: updated_at e contador de apoios
--   4. Row Level Security (RLS): leitura pública, escrita autenticada
--   5. Bucket público `report-images` no Storage + políticas de acesso
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. Tipos enumerados
-- -----------------------------------------------------------------------------
do $$
begin
  create type public.report_category as enum (
    'iluminacao',
    'asfalto',
    'acessibilidade',
    'saneamento'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.report_status as enum (
    'aberto',
    'em_analise',
    'resolvido'
  );
exception
  when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Tabelas
-- -----------------------------------------------------------------------------
create table if not exists public.reports (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  title           text not null,
  description     text not null,
  category        public.report_category not null,
  status          public.report_status not null default 'aberto',
  neighborhood    text,
  image_path      text,
  upvotes_count   integer not null default 0 check (upvotes_count >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint reports_title_length
    check (char_length(btrim(title)) between 5 and 120),
  constraint reports_description_length
    check (char_length(btrim(description)) between 10 and 1200),
  constraint reports_neighborhood_length
    check (neighborhood is null or char_length(btrim(neighborhood)) <= 80),
  constraint reports_image_path_length
    check (image_path is null or char_length(image_path) <= 512)
);

create table if not exists public.upvotes (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references public.reports (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint upvotes_unique_user_report unique (report_id, user_id)
);

-- Índices para o feed (ordenação por data e por apoios) e filtros.
create index if not exists reports_created_at_idx
  on public.reports (created_at desc);

create index if not exists reports_upvotes_count_idx
  on public.reports (upvotes_count desc, created_at desc);

create index if not exists reports_category_idx
  on public.reports (category);

create index if not exists reports_user_id_idx
  on public.reports (user_id, created_at desc);

create index if not exists upvotes_user_id_idx
  on public.upvotes (user_id);

create index if not exists upvotes_report_id_idx
  on public.upvotes (report_id);

-- -----------------------------------------------------------------------------
-- 3. Triggers
-- -----------------------------------------------------------------------------

-- Mantém `updated_at` sempre atualizado.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
  before update on public.reports
  for each row
  execute function public.set_updated_at();

-- Mantém `reports.upvotes_count` sincronizado com a tabela `upvotes`.
-- SECURITY DEFINER: o cidadão não tem permissão de UPDATE em `reports`,
-- mas o trigger pode atualizar o contador com segurança.
create or replace function public.sync_report_upvotes_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    update public.reports
       set upvotes_count = upvotes_count + 1
     where id = new.report_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.reports
       set upvotes_count = greatest(upvotes_count - 1, 0)
     where id = old.report_id;
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists upvotes_sync_count on public.upvotes;
create trigger upvotes_sync_count
  after insert or delete on public.upvotes
  for each row
  execute function public.sync_report_upvotes_count();

-- -----------------------------------------------------------------------------
-- 4. Row Level Security (RLS)
-- -----------------------------------------------------------------------------
alter table public.reports enable row level security;
alter table public.upvotes enable row level security;

-- Remove políticas antigas para permitir reexecução segura do script.
drop policy if exists "reports_select_public" on public.reports;
drop policy if exists "reports_insert_own" on public.reports;
drop policy if exists "reports_delete_own" on public.reports;
drop policy if exists "upvotes_select_public" on public.upvotes;
drop policy if exists "upvotes_insert_own" on public.upvotes;
drop policy if exists "upvotes_delete_own" on public.upvotes;

-- RELATOS: qualquer pessoa (inclusive visitante sem sessão) pode ler.
create policy "reports_select_public"
  on public.reports
  for select
  to anon, authenticated
  using (true);

-- RELATOS: só usuários autenticados (inclui sessão anônima) podem criar,
-- e o `user_id` precisa ser o próprio usuário.
create policy "reports_insert_own"
  on public.reports
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- RELATOS: o autor pode excluir o próprio relato.
create policy "reports_delete_own"
  on public.reports
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Não existe política de UPDATE para `reports`: status e contador são
-- alterados apenas pelo painel/service_role (que ignoram RLS) e pelo trigger.

-- APOIOS: leitura pública (permite saber se o visitante já apoiou).
create policy "upvotes_select_public"
  on public.upvotes
  for select
  to anon, authenticated
  using (true);

-- APOIOS: um usuário autenticado pode apoiar uma única vez cada relato e
-- não pode apoiar o próprio relato.
create policy "upvotes_insert_own"
  on public.upvotes
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
        from public.reports r
       where r.id = report_id
         and r.user_id <> auth.uid()
    )
  );

-- APOIOS: o usuário pode remover o próprio apoio.
create policy "upvotes_delete_own"
  on public.upvotes
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 5. Permissões (defesa em profundidade)
-- -----------------------------------------------------------------------------
revoke all on public.reports from anon, authenticated;
grant select on public.reports to anon, authenticated;
grant insert, delete on public.reports to authenticated;

revoke all on public.upvotes from anon, authenticated;
grant select on public.upvotes to anon, authenticated;
grant insert, delete on public.upvotes to authenticated;

-- -----------------------------------------------------------------------------
-- 6. Storage: bucket público de imagens
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 7. Verificação rápida (opcional)
-- -----------------------------------------------------------------------------
-- select tablename, rowsecurity from pg_tables where schemaname = 'public';
-- select id, public from storage.buckets where id = 'report-images';
-- select policyname, cmd, roles from pg_policies where schemaname = 'public';
--
-- Atualizar o status de um relato (execute no SQL Editor, como owner):
-- update public.reports set status = 'em_analise' where id = 'UUID-DO-RELATO';
-- update public.reports set status = 'resolvido'  where id = 'UUID-DO-RELATO';

-- Garante que a API REST (PostgREST) enxergue as tabelas imediatamente.
notify pgrst, 'reload schema';
