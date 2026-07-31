-- Unique client-facing lounge URL for Support Lounge tickets.

alter table public.support_tickets
  add column if not exists ticket_public_url text;

comment on column public.support_tickets.ticket_public_url is
  'Absolute unique resume URL for the requester Support Lounge case view.';
