-- Backfill company_country / company_city from legacy region labels
-- e.g. "Brisbane, QLD" → Australia / Brisbane; "United Kingdom" → United Kingdom / ''

alter table public.internal_clients
  add column if not exists company_city text not null default '',
  add column if not exists company_country text not null default '';

update public.internal_clients
set
  company_country = case region
    when 'Catalonia, Spain' then 'Spain'
    when 'Porto, Portugal' then 'Portugal'
    when 'Oxfordshire, UK' then 'United Kingdom'
    when 'Western Australia' then 'Australia'
    when 'Iberia' then 'Spain'
    when 'United Kingdom' then 'United Kingdom'
    when 'Europe-wide' then 'Europe'
    when 'Sydney, NSW' then 'Australia'
    when 'Melbourne, VIC' then 'Australia'
    when 'Brisbane, QLD' then 'Australia'
    when 'Perth, WA' then 'Australia'
    when 'Adelaide, SA' then 'Australia'
    when 'Canberra, ACT' then 'Australia'
    when 'Hobart, TAS' then 'Australia'
    when 'Darwin, NT' then 'Australia'
    when 'Newcastle, NSW' then 'Australia'
    when 'Gold Coast, QLD' then 'Australia'
    when 'Sunshine Coast, QLD' then 'Australia'
    when 'Wollongong, NSW' then 'Australia'
    when 'Geelong, VIC' then 'Australia'
    when 'Cairns, QLD' then 'Australia'
    when 'Broken Hill, NSW' then 'Australia'
    else company_country
  end,
  company_city = case region
    when 'Catalonia, Spain' then 'Catalonia'
    when 'Porto, Portugal' then 'Porto'
    when 'Oxfordshire, UK' then 'Oxfordshire'
    when 'Western Australia' then 'Perth'
    when 'Iberia' then ''
    when 'United Kingdom' then ''
    when 'Europe-wide' then ''
    when 'Sydney, NSW' then 'Sydney'
    when 'Melbourne, VIC' then 'Melbourne'
    when 'Brisbane, QLD' then 'Brisbane'
    when 'Perth, WA' then 'Perth'
    when 'Adelaide, SA' then 'Adelaide'
    when 'Canberra, ACT' then 'Canberra'
    when 'Hobart, TAS' then 'Hobart'
    when 'Darwin, NT' then 'Darwin'
    when 'Newcastle, NSW' then 'Newcastle'
    when 'Gold Coast, QLD' then 'Gold Coast'
    when 'Sunshine Coast, QLD' then 'Sunshine Coast'
    when 'Wollongong, NSW' then 'Wollongong'
    when 'Geelong, VIC' then 'Geelong'
    when 'Cairns, QLD' then 'Cairns'
    when 'Broken Hill, NSW' then 'Broken Hill'
    else company_city
  end
where coalesce(trim(company_country), '') = ''
  and coalesce(trim(company_city), '') = ''
  and coalesce(trim(region), '') <> '';
