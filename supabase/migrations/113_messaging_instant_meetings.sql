-- Instant Communications meetings: external guests can join with a shareable token (no login).
alter table public.messaging_call_rooms
  add column if not exists allow_guest_join boolean not null default false;

alter table public.messaging_call_rooms
  add column if not exists guest_token text;

create unique index if not exists messaging_call_rooms_guest_token_uidx
  on public.messaging_call_rooms (guest_token)
  where guest_token is not null;
