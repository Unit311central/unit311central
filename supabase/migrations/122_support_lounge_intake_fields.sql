-- Support Lounge intake profile fields (Workflow 2).

alter table public.support_tickets
  add column if not exists requester_first_name text,
  add column if not exists requester_last_name text,
  add column if not exists requester_department text,
  add column if not exists requester_role text,
  add column if not exists ticket_kind text;

comment on column public.support_tickets.ticket_kind is
  'Lounge intake: new | existing';
