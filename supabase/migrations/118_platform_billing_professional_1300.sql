-- Align Professional plan seed/live rows to canonical pricing ($1,300 MRR / $15,600 ARR).
update public.platform_customer_subscriptions
set
  mrr_usd = 1300,
  arr_usd = 15600,
  updated_at = now()
where lower(company_name) = 'fotheringham'
   or (plan_name ilike '%professional%' and mrr_usd = 999);
