-- BCN Drone Center: bcndrone login user + training course calendar events

insert into public.platform_users (
  username,
  display_name,
  password_hash,
  user_type,
  redirect_path,
  client_name
) values (
  'bcndrone',
  'BCN Operations',
  'bcndrone-salt-v1:c3823bd8361eefee6865f167cb2401831c15e3197015e006bb49cac2fa03a7dd79d170f982d54f89ac9bee440bbf947071b1d9905eb923534403ca2877055420',
  'internal',
  '/internaldashboard',
  null
) on conflict (username) do nothing;

-- Scheduled course editions (June 2026)
insert into public.internal_calendar_events (title, event_type, starts_at, ends_at, client_name, location, notes)
values
  (
    'UAS Applications Workshop',
    'onsite',
    '2026-06-01 09:00:00+02',
    '2026-06-05 17:00:00+02',
    'BCN Training',
    'BCN Drone Center Test Site',
    'Next edition: June 1–5, 2026 — applications, payloads, and hands-on flight sessions.'
  ),
  (
    'UAS Regulatory & SORA 2.5 Training',
    'onsite',
    '2026-06-08 09:00:00+02',
    '2026-06-12 17:00:00+02',
    'BCN Training',
    'BCN Drone Center Test Site',
    'Next edition: June 8–12, 2026 — EU regulatory framework and SORA 2.5 methodology.'
  ),
  (
    'Design & Construction Course',
    'onsite',
    '2026-06-15 09:00:00+02',
    '2026-06-19 17:00:00+02',
    'BCN Training',
    'BCN Drone Center Test Site',
    'Next edition: June 15–19, 2026 — UAS design, build, and airworthiness fundamentals.'
  ),
  (
    'Integrated Drone Pilot Training (STS-01 & STS-02)',
    'onsite',
    '2026-06-22 09:00:00+02',
    '2026-06-26 17:00:00+02',
    'BCN Training',
    'BCN Drone Center Test Site',
    'Next edition: June 22–26, 2026 — official pilot certification for standard scenarios.'
  ),
  (
    'UAS Pilot Training – Operational Authorisation',
    'meeting',
    '2026-07-07 09:00:00+02',
    '2026-07-07 17:00:00+02',
    'BCN Training',
    'BCN Drone Center',
    'On-demand Specific Category operational authorisation programme — scheduled intake.'
  ),
  (
    'UAS Radiophonist Course',
    'meeting',
    '2026-07-14 09:00:00+02',
    '2026-07-14 17:00:00+02',
    'BCN Training',
    'BCN Drone Center',
    'On-demand radiophonist certification — aeronautical radio procedures for UAS operations.'
  ),
  (
    'UAS Geographical Zones & Airspace Restrictions',
    'meeting',
    '2026-07-21 09:00:00+02',
    '2026-07-21 17:00:00+02',
    'BCN Training',
    'BCN Drone Center',
    'On-demand course covering EU geographical zones, U-space, and airspace restrictions.'
  ),
  (
    'Customized Training Programme',
    'meeting',
    '2026-08-04 09:00:00+02',
    '2026-08-08 17:00:00+02',
    'BCN Training',
    'BCN Drone Center Test Site',
    'Tailored corporate training — content and duration adapted to client requirements.'
  );
