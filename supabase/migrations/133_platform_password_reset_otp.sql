-- Password reset OTP challenge (email code + link → verify OTP → set password)

alter table public.platform_password_reset_tokens
  add column if not exists otp_hash text;

alter table public.platform_password_reset_tokens
  add column if not exists otp_verified_at timestamptz;

alter table public.platform_password_reset_tokens
  add column if not exists otp_attempts integer not null default 0;
