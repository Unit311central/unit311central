-- Board directors: annual compensation in USD (nullable; omit for Founder/CEO Scott).

alter table public.board_directors
  add column if not exists compensation_usd_per_year numeric(14, 2);
