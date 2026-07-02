-- Shared info@dronecatalyst.com inbox (Egg Mail preview — no live mailbox yet)

create table if not exists public.internal_info_email_threads (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  from_name text not null,
  from_email text not null,
  received_at timestamptz not null default now(),
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.internal_info_email_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.internal_info_email_threads (id) on delete cascade,
  direction text not null,
  from_name text not null,
  from_email text not null,
  body text not null,
  replied_by_user_id text,
  replied_by_name text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists internal_info_email_threads_received_idx
  on public.internal_info_email_threads (received_at desc);

create index if not exists internal_info_email_messages_thread_idx
  on public.internal_info_email_messages (thread_id, sent_at asc);

alter table public.internal_info_email_threads enable row level security;
alter table public.internal_info_email_messages enable row level security;

create policy "internal_info_email_threads_all" on public.internal_info_email_threads
  for all using (true) with check (true);

create policy "internal_info_email_messages_all" on public.internal_info_email_messages
  for all using (true) with check (true);

alter table public.internal_info_email_threads replica identity full;
alter table public.internal_info_email_messages replica identity full;

-- Seed sample threads when empty
do $$
declare
  t1 uuid;
  t2 uuid;
  t3 uuid;
begin
  if exists (select 1 from public.internal_info_email_threads limit 1) then
    return;
  end if;

  insert into public.internal_info_email_threads (subject, from_name, from_email, received_at, status)
  values (
    'Quote request — solar farm thermal survey (Zaragoza)',
    'Elena Morales',
    'e.morales@cataloniaenergy.es',
    now() - interval '2 hours',
    'open'
  )
  returning id into t1;

  insert into public.internal_info_email_messages (thread_id, direction, from_name, from_email, body, sent_at)
  values (
    t1,
    'inbound',
    'Elena Morales',
    'e.morales@cataloniaenergy.es',
    E'Hi team,\n\nWe need a thermal inspection of roughly 120 MW across two blocks near Zaragoza before end of Q2. Can you share availability and a ballpark day rate for Matrice 4T with radiometric payload?\n\nBest,\nElena',
    now() - interval '2 hours'
  );

  insert into public.internal_info_email_threads (subject, from_name, from_email, received_at, status)
  values (
    'Re: Oxford campus mapping — phase 2 schedule',
    'James Whitfield',
    'j.whitfield@oxfordheritage.co.uk',
    now() - interval '1 day',
    'replied'
  )
  returning id into t2;

  insert into public.internal_info_email_messages (thread_id, direction, from_name, from_email, body, sent_at)
  values (
    t2,
    'inbound',
    'James Whitfield',
    'j.whitfield@oxfordheritage.co.uk',
    E'Hello,\n\nFollowing our call last week — can we confirm the week of 24 June for the quad and chapel orthomosaic? We need deliverables within 10 working days.\n\nThanks,\nJames',
    now() - interval '1 day'
  );

  insert into public.internal_info_email_messages (thread_id, direction, from_name, from_email, body, replied_by_user_id, replied_by_name, sent_at)
  values (
    t2,
    'outbound',
    'Ashley Pursglove',
    'info@dronecatalyst.com',
    E'Hi James,\n\nConfirmed for the week of 24 June. Ashley will lead the Oxford capture with Matrice 4T + P1. We will share the flight plan draft by Friday.\n\nKind regards,\nAshley Pursglove\nDrone Catalyst',
    'user-2',
    'Ashley Pursglove',
    now() - interval '20 hours'
  );

  insert into public.internal_info_email_threads (subject, from_name, from_email, received_at, status)
  values (
    'Partnership enquiry — Douro logistics corridor',
    'Rui Ferreira',
    'rui.ferreira@dourologistics.pt',
    now() - interval '3 days',
    'replied'
  )
  returning id into t3;

  insert into public.internal_info_email_messages (thread_id, direction, from_name, from_email, body, sent_at)
  values (
    t3,
    'inbound',
    'Rui Ferreira',
    'rui.ferreira@dourologistics.pt',
    E'Bom dia,\n\nWe operate weekly berth surveys in Porto and would like to discuss a retainer for Q3–Q4. Do you cover ANAC-compliant night ops?\n\nRui Ferreira\nDouro Logistics',
    now() - interval '3 days'
  );

  insert into public.internal_info_email_messages (thread_id, direction, from_name, from_email, body, replied_by_user_id, replied_by_name, sent_at)
  values (
    t3,
    'outbound',
    'Daniel Houlton',
    'info@dronecatalyst.com',
    E'Olá Rui,\n\nThank you for reaching out. Yes — Daniel holds ANAC A2 and we can support night ops with prior NOTAM coordination. I have attached our Porto rate card and will call you tomorrow morning.\n\nDaniel Houlton\nDrone Catalyst',
    'user-3',
    'Daniel Houlton',
    now() - interval '2 days 6 hours'
  );

  insert into public.internal_info_email_messages (thread_id, direction, from_name, from_email, body, sent_at)
  values (
    t3,
    'inbound',
    'Rui Ferreira',
    'rui.ferreira@dourologistics.pt',
    E'Perfect — speak tomorrow. Can you CC paul.fotheringham@dronecatalyst.com on the proposal?\n\nRui',
    now() - interval '2 days'
  );
end $$;
