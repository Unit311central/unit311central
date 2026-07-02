-- Link internal client records to file repository folders

alter table public.internal_clients
  add column if not exists files_folder_id text,
  add column if not exists files_folder_name text;

create index if not exists internal_clients_files_folder_idx
  on public.internal_clients (files_folder_id)
  where files_folder_id is not null;
