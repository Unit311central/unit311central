-- Rebrand info@ inbox seed data from dronecatalyst.com to barcelonadronecenter.com

update public.internal_info_email_messages
set
  from_email = replace(from_email, '@dronecatalyst.com', '@barcelonadronecenter.com'),
  body = replace(
    replace(
      replace(body, 'info@dronecatalyst.com', 'info@barcelonadronecenter.com'),
      'paul.fotheringham@dronecatalyst.com',
      'paul.fotheringham@barcelonadronecenter.com'
    ),
    'Drone Catalyst',
    'BCN Drone Center'
  ),
  replied_by_name = case
    when replied_by_name = 'Ashley Pursglove' then 'Ashley Pursglove'
    when replied_by_name = 'Daniel Houlton' then 'Daniel Houlton'
    else replied_by_name
  end
where from_email like '%@dronecatalyst.com'
   or body like '%dronecatalyst.com%'
   or body like '%Drone Catalyst%';
