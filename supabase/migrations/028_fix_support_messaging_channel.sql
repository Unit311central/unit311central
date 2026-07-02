-- Ensure Support messaging channel exists with User 1 and User 2

insert into public.internal_message_channels (
  room,
  name,
  channel_type,
  client_key,
  created_by_operator_id,
  created_by_operator_name,
  member_operator_ids,
  member_client_usernames
)
values (
  'support-desk',
  'Support',
  'internal',
  null,
  'user-1',
  'User 1',
  array['user-1', 'user-2'],
  '{}'::text[]
)
on conflict (room) do update set
  name = excluded.name,
  channel_type = excluded.channel_type,
  member_operator_ids = excluded.member_operator_ids,
  created_by_operator_name = excluded.created_by_operator_name;

insert into public.internal_messages (
  room,
  operator_id,
  operator_name,
  username,
  content,
  message_type
)
select
  'support-desk',
  'system',
  'BCN Support',
  'system',
  'Support desk channel — WhatsApp tickets and operator claims appear here.',
  'system'
where not exists (
  select 1 from public.internal_messages where room = 'support-desk' limit 1
);
