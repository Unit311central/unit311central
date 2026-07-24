-- Site-wide annual bonus pay date (default 31 Dec)

alter table public.payroll_settings
  add column if not exists bonus_pay_month integer not null default 12;

alter table public.payroll_settings
  add column if not exists bonus_pay_day integer not null default 31;
