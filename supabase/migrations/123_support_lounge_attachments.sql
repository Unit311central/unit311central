-- Lounge attachments + richer message metadata for case updates.

alter table public.support_lounge_messages
  add column if not exists attachment_name text,
  add column if not exists attachment_url text,
  add column if not exists attachment_mime text;

create table if not exists public.support_lounge_attachments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  ticket_id text not null references public.support_tickets (id) on delete cascade,
  file_name text not null,
  file_url text not null,
  mime_type text,
  size_bytes integer,
  created_at timestamptz not null default now()
);

create index if not exists support_lounge_attachments_ticket_idx
  on public.support_lounge_attachments (ticket_id, created_at);

alter table public.support_lounge_attachments enable row level security;

drop policy if exists "support_lounge_attachments_all" on public.support_lounge_attachments;
create policy "support_lounge_attachments_all" on public.support_lounge_attachments
  for all using (true) with check (true);
