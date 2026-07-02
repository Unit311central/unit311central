-- Venturi Aeronautical client portal login

insert into public.platform_users (
  username,
  display_name,
  password_hash,
  user_type,
  redirect_path,
  client_name
) values (
  'venturia',
  'Venturi Aeronautical',
  'venturia-salt-v1:743cdbbff8e37164afdcf154b51d6b2c85e443e9786ad82d7c7dc1cffbc6a35b1b8a1d0a1f3c8d09d403249c4c2f089806dce6bc2bca6434a3862cc7faebf361',
  'external',
  '/client/venturi',
  'Venturi Aeronautical'
) on conflict (username) do update set
  display_name = excluded.display_name,
  password_hash = excluded.password_hash,
  user_type = excluded.user_type,
  redirect_path = excluded.redirect_path,
  client_name = excluded.client_name,
  is_active = true,
  updated_at = now();
