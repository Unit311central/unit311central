-- CRM Connections network (global contacts map)

create table if not exists public.crm_connections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default 'Advisor',
  specialties text,
  background text,
  country_experience text,
  city text not null,
  country text not null,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_connections_city_country_idx
  on public.crm_connections (city, country);

alter table public.crm_connections enable row level security;

create policy "crm_connections_all" on public.crm_connections
  for all using (true) with check (true);

insert into public.crm_connections (name, role, specialties, background, country_experience, city, country, latitude, longitude)
select * from (values
  ('Dr. Ashley Pursglove', 'CTO', 'Pilot, engineering, machining, AI', 'xxxxx', 'UK, KSA, UAE, Portugal', 'Porto', 'Portugal', 41.1579, -8.6291),
  ('Daniel Houlton', 'CRO', 'Sales', 'xxxxx', '', 'Oxford', 'UK', 51.752, -1.2577),
  ('Stephen Saffin', 'COO', 'Landmine de-mining', 'xxxxx', 'South America, Africa, Middle East', 'Buenos Aires', 'Argentina', -34.6037, -58.3816),
  ('Francesco Pantealone', 'CSO', '3D Printing large scale sales', 'xxxxx', 'Europe, USA', 'Austin', 'USA', 30.2672, -97.7431),
  ('Steven Fotheringham', 'Advisor', 'Telecommunications', 'xxxxx', 'UK, Europe, ASIA', 'Jakarta', 'Indonesia', -6.2088, 106.8456),
  ('Nishad Khashad', 'Advisor', 'African Business', 'xxxxx', 'Africa', 'Nairobi', 'Kenya', -1.2921, 36.8219),
  ('John Magnay', 'Advisor', 'Agriculture', 'xxxxx', 'Africa', 'Kampala', 'Uganda', 0.3476, 32.5825),
  ('Luke Irving', 'Advisor', 'United', 'xxxxx', 'Europe, Africa, Middle East', 'Damascus', 'Syria', 33.5138, 36.2765),
  ('Prof Adam Arabian', 'Advisor', 'Engineering', 'xxxxx', 'Global', 'Seattle', 'USA', 47.6062, -122.3321),
  ('Harry Turner', 'Advisor', 'Business Strategic', 'xxxxx', 'Global', 'Melbourne', 'Australia', -37.8136, 144.9631),
  ('Paul Ormandy', 'Advisor', 'Online Digital Marketing, SEO', 'xxxxx', 'Global', 'London', 'UK', 51.5074, -0.1278),
  ('Keir', 'Advisor', 'Wind farms, renewable energy', 'xxxxx', 'Scotland', 'Edinburgh', 'UK', 55.9533, -3.1883),
  ('Joe Crosby', 'Advisor', 'All types of mines', 'xxxxx', 'Africa', 'Harare', 'Zimbabwe', -17.8252, 31.0522),
  ('Dr. Robert Keeley', 'Advisor', 'Explosive Ordnance, UN', 'xxxxx', 'Global', 'Lyon', 'France', 45.764, 4.8357),
  ('Alaisdar Graham', 'Advisor', 'Project Management, Govt contracts, Cybersecurity', 'xxxxx', 'North America & Africa', 'Montreal', 'Canada', 45.5017, -73.5673),
  ('Dr. Arjan Buis', 'Advisor', 'NGO Projects', 'University of Strathclyde', 'Global', 'Glasgow', 'Scotland', 55.8642, -4.2518)
) as seed(name, role, specialties, background, country_experience, city, country, latitude, longitude)
where not exists (select 1 from public.crm_connections limit 1);
