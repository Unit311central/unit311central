-- Kenya, Namibia, South Africa, and Congo competitor regions + seeds

alter table public.competitors drop constraint if exists competitors_region_check;

alter table public.competitors
  add constraint competitors_region_check
  check (region in ('uk', 'spain', 'portugal', 'kenya', 'namibia', 'southafrica', 'congo'));

insert into public.competitors (
  region, company_name, website, services, service_categories, drone_technology, last_revenue, notes, sort_order
)
select
  'kenya',
  seed.company_name,
  seed.website,
  seed.services,
  seed.service_categories,
  seed.drone_technology,
  seed.last_revenue,
  seed.notes,
  seed.sort_order
from (
  values
    ('Fahari Aviation', 'https://fahariaviation.com/', 'Infrastructure inspection, mapping, and logistics drone programmes for energy and transport.', 'inspection,surveying', 'DJI Matrice 350 RTK, Mavic 3 Enterprise', 'KES 420M (2024 est.)', 'Kenya Airways–backed operator with nationwide enterprise contracts.', 1),
    ('Astral Aerial Solutions', 'https://astralsolutions.co.ke/', 'Agricultural monitoring, conservation mapping, and humanitarian aerial survey.', 'surveying,inspection', 'DJI Mavic 3 Multispectral, Matrice 30T', 'KES 180M (2024 est.)', 'Strong NGO and agri-tech client base across East Africa.', 2),
    ('Kenya Flying Labs', 'https://kenyaflyinglabs.org/', 'Disaster response mapping, community drone training, and open geospatial programmes.', 'surveying,other', 'senseFly eBee X, DJI Phantom 4 RTK', 'KES 95M (2024 est.)', 'WeRobotics affiliate with public-sector and donor-funded projects.', 3),
    ('Ardhisaga Aerial', 'https://ardhisaga.co.ke/', 'Land administration support, cadastral mapping, and construction progress monitoring.', 'surveying', 'DJI Matrice 350 RTK, WingtraOne', 'KES 72M (2024 est.)', 'Nairobi and central Kenya developer pipeline.', 4),
    ('Drone Space Africa', 'https://dronospace.africa/', 'Mining survey, quarry volumetrics, and industrial asset inspections.', 'surveying,inspection', 'DJI Matrice 350, YellowScan LiDAR', 'KES 58M (2024 est.)', 'Expanding from Kenya into wider East African mining corridors.', 5)
) as seed(company_name, website, services, service_categories, drone_technology, last_revenue, notes, sort_order)
where not exists (
  select 1 from public.competitors existing
  where existing.region = 'kenya' and lower(existing.company_name) = lower(seed.company_name)
);

insert into public.competitors (
  region, company_name, website, services, service_categories, drone_technology, last_revenue, notes, sort_order
)
select
  'namibia',
  seed.company_name,
  seed.website,
  seed.services,
  seed.service_categories,
  seed.drone_technology,
  seed.last_revenue,
  seed.notes,
  seed.sort_order
from (
  values
    ('Aeronavis Namibia', 'https://aeronavis.com.na/', 'Mining, exploration, and environmental compliance aerial surveys.', 'surveying,inspection', 'DJI Matrice 350 RTK, senseFly eBee X', 'NAD 28M (2024 est.)', 'Leading Namibian operator for uranium and diamond sector clients.', 1),
    ('Namibian Drone Services', 'https://namibiandroneservices.com/', 'Solar farm inspection, wildlife monitoring, and tourism aerial media.', 'inspection,media', 'DJI Matrice 30T, Mavic 3 Thermal', 'NAD 14M (2024 est.)', 'Renewable and conservation portfolio across southern Namibia.', 2),
    ('Aeroworks Namibia', 'https://aeroworks.na/', 'Port, logistics, and coastal infrastructure visual inspections.', 'inspection', 'DJI Matrice 350, Skydio X10', 'NAD 11M (2024 est.)', 'Walvis Bay and corridor logistics operator.', 3),
    ('Sky Survey Namibia', 'https://skysurvey.na/', 'Topographic mapping, volumetrics, and cadastral support for developers.', 'surveying', 'DJI Phantom 4 RTK, Matrice 350 RTK', 'NAD 8.5M (2024 est.)', 'Windhoek and Erongo region civil engineering surveys.', 4),
    ('Desert Wing UAV', 'https://desertwinguav.com/', 'Pipeline patrol, remote asset inspection, and emergency response mapping.', 'inspection,surveying', 'DJI Matrice 300 RTK, Zenmuse H20T', 'NAD 6.2M (2024 est.)', 'Remote-site operations specialist for energy and mining.', 5)
) as seed(company_name, website, services, service_categories, drone_technology, last_revenue, notes, sort_order)
where not exists (
  select 1 from public.competitors existing
  where existing.region = 'namibia' and lower(existing.company_name) = lower(seed.company_name)
);

insert into public.competitors (
  region, company_name, website, services, service_categories, drone_technology, last_revenue, notes, sort_order
)
select
  'southafrica',
  seed.company_name,
  seed.website,
  seed.services,
  seed.service_categories,
  seed.drone_technology,
  seed.last_revenue,
  seed.notes,
  seed.sort_order
from (
  values
    ('Rocketmine', 'https://www.rocketmine.com/', 'Mining survey, stockpile analytics, and enterprise aerial data programmes.', 'surveying', 'DJI Matrice 350 RTK, custom analytics stack', 'ZAR 180M (2024 est.)', 'Pan-African mining drone operator headquartered in Johannesburg.', 1),
    ('UAV & Drone Solutions', 'https://www.uavdronesolutions.co.za/', 'Industrial inspection, security overwatch, and agricultural monitoring.', 'inspection,surveying', 'DJI Matrice 350, Mavic 3 Enterprise', 'ZAR 62M (2024 est.)', 'Nationwide fleet with energy and agri clients.', 2),
    ('Endurance Drones', 'https://endurancedrones.co.za/', 'Telecom tower, solar, and wind asset inspections with thermal reporting.', 'inspection', 'DJI Matrice 30T, Zenmuse H20T', 'ZAR 38M (2024 est.)', 'Strong renewable and telecom repeat-contract base.', 3),
    ('Drone Services South Africa', 'https://droneservicessa.co.za/', 'Construction progress, BIM support, and promotional aerial media.', 'surveying,media', 'DJI Matrice 350, Inspire 3', 'ZAR 24M (2024 est.)', 'Cape Town and Gauteng construction programmes.', 4),
    ('Aerial Monitoring Solutions', 'https://aerialmonitoring.co.za/', 'Conservation, anti-poaching support, and protected-area mapping.', 'surveying,inspection', 'DJI Mavic 3 Thermal, Matrice 300 RTK', 'ZAR 18M (2024 est.)', 'Wildlife and conservation NGO partnerships.', 5)
) as seed(company_name, website, services, service_categories, drone_technology, last_revenue, notes, sort_order)
where not exists (
  select 1 from public.competitors existing
  where existing.region = 'southafrica' and lower(existing.company_name) = lower(seed.company_name)
);

insert into public.competitors (
  region, company_name, website, services, service_categories, drone_technology, last_revenue, notes, sort_order
)
select
  'congo',
  seed.company_name,
  seed.website,
  seed.services,
  seed.service_categories,
  seed.drone_technology,
  seed.last_revenue,
  seed.notes,
  seed.sort_order
from (
  values
    ('Katanga Aerial Survey', 'https://katangaaerial.cd/', 'Mining corridor mapping, stockpile survey, and haul-road monitoring.', 'surveying', 'DJI Matrice 350 RTK, WingtraOne GEN II', 'USD 4.2M (2024 est.)', 'Copperbelt and Katanga mining client focus.', 1),
    ('Congo UAV Services', 'https://congouav.cd/', 'Infrastructure inspection, humanitarian mapping, and logistics corridor surveys.', 'inspection,surveying', 'DJI Matrice 300 RTK, Mavic 3 Enterprise', 'USD 2.8M (2024 est.)', 'Kinshasa and eastern DRC operations with NGO partners.', 2),
    ('Kinshasa Drone Solutions', 'https://kinshasadrones.cd/', 'Urban development surveys, real-estate aerial media, and FM inspections.', 'surveying,media', 'DJI Phantom 4 RTK, Matrice 30', 'USD 1.9M (2024 est.)', 'Capital-city construction and property marketing niche.', 3),
    ('Central Africa Aerial Mapping', 'https://camaerial.cd/', 'Forestry, river basin, and environmental compliance mapping programmes.', 'surveying', 'senseFly eBee X, DJI Matrice 350', 'USD 1.4M (2024 est.)', 'Donor-funded conservation and hydrology projects.', 4),
    ('Congo Mining Drones', 'https://congominingdrones.cd/', 'Open-pit volumetrics, tailings monitoring, and site security overwatch.', 'surveying,inspection', 'DJI Matrice 350 RTK, LiDAR payloads', 'USD 3.1M (2024 est.)', 'Artisanal and industrial mining site analytics.', 5)
) as seed(company_name, website, services, service_categories, drone_technology, last_revenue, notes, sort_order)
where not exists (
  select 1 from public.competitors existing
  where existing.region = 'congo' and lower(existing.company_name) = lower(seed.company_name)
);
