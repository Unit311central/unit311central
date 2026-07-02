-- Internal file repository: folders, files metadata, categories, storage bucket
-- Run in Supabase SQL Editor or via supabase db push

-- Categories
create table public.file_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#60a5fa',
  created_at timestamptz not null default now(),
  constraint file_categories_name_unique unique (name)
);

-- Folder hierarchy
create table public.file_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references public.file_folders (id) on delete cascade,
  category_id uuid references public.file_categories (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index file_folders_parent_id_idx on public.file_folders (parent_id);
create index file_folders_name_idx on public.file_folders (name);

-- File metadata (blobs live in storage)
create table public.file_objects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  folder_id uuid references public.file_folders (id) on delete cascade,
  category_id uuid references public.file_categories (id) on delete set null,
  storage_path text not null,
  mime_type text,
  extension text,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint file_objects_storage_path_unique unique (storage_path)
);

create index file_objects_folder_id_idx on public.file_objects (folder_id);
create index file_objects_name_idx on public.file_objects (name);
create index file_objects_category_id_idx on public.file_objects (category_id);

-- Seed default categories
insert into public.file_categories (name, color) values
  ('Documents', '#60a5fa'),
  ('Spreadsheets', '#34d399'),
  ('Presentations', '#f59e0b'),
  ('PDFs', '#f87171'),
  ('Images', '#a78bfa'),
  ('Archives', '#94a3b8'),
  ('General', '#64748b');

-- Storage bucket (private; served via API signed URLs)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'internal-files',
  'internal-files',
  false,
  52428800,
  null
)
on conflict (id) do nothing;

-- Permissive policies for internal tooling (tighten when auth is added)
alter table public.file_categories enable row level security;
alter table public.file_folders enable row level security;
alter table public.file_objects enable row level security;

create policy "file_categories_all" on public.file_categories for all using (true) with check (true);
create policy "file_folders_all" on public.file_folders for all using (true) with check (true);
create policy "file_objects_all" on public.file_objects for all using (true) with check (true);

create policy "internal_files_storage_select" on storage.objects
  for select using (bucket_id = 'internal-files');

create policy "internal_files_storage_insert" on storage.objects
  for insert with check (bucket_id = 'internal-files');

create policy "internal_files_storage_update" on storage.objects
  for update using (bucket_id = 'internal-files');

create policy "internal_files_storage_delete" on storage.objects
  for delete using (bucket_id = 'internal-files');
