alter table public.support_tickets
  add column if not exists client_priority_label text;
