-- OHMIOS CMS — Configuración Supabase Storage
-- Ejecutar en: Supabase Dashboard → SQL Editor

-- Buckets públicos para medios y contenido JSON
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'media',
    'media',
    true,
    52428800,
    array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']
  ),
  (
    'content',
    'content',
    true,
    1048576,
    array['application/json']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Lectura pública
drop policy if exists "Public read media" on storage.objects;
create policy "Public read media"
  on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists "Public read content" on storage.objects;
create policy "Public read content"
  on storage.objects for select
  using (bucket_id = 'content');
