-- Competitor drone technology, service categories, Spain/Portugal seeds, UK backfill
-- Run in Supabase SQL Editor or via scripts/seed-competitors.mjs

alter table public.competitors
  add column if not exists drone_technology text,
  add column if not exists service_categories text;

-- Backfill UK competitors with drone stack and service categories
update public.competitors set drone_technology = 'DJI Matrice 350 RTK, Mavic 3 Thermal', service_categories = 'inspection' where region = 'uk' and company_name = 'Critical Asset';
update public.competitors set drone_technology = 'Custom multirotor, DJI Matrice 300 RTK', service_categories = 'inspection' where region = 'uk' and company_name = 'Cyberhawk';
update public.competitors set drone_technology = 'Mixed enterprise fleet, DJI Dock 2', service_categories = 'other' where region = 'uk' and company_name = 'Consortiq';
update public.competitors set drone_technology = 'DJI Matrice 350, Mavic 3 Enterprise', service_categories = 'surveying,other' where region = 'uk' and company_name = 'Coptrz';
update public.competitors set drone_technology = 'DJI Matrice 300 RTK, Inspire 3', service_categories = 'inspection,media,other' where region = 'uk' and company_name = 'Heliguy';
update public.competitors set drone_technology = 'DJI Mavic 3 Enterprise, Matrice 30', service_categories = 'inspection,other' where region = 'uk' and company_name = 'RUAS';
update public.competitors set drone_technology = 'DJI Matrice 30T, Zenmuse H20T', service_categories = 'inspection' where region = 'uk' and company_name = 'iRed';
update public.competitors set drone_technology = 'DJI Matrice 350, LiDAR payloads', service_categories = 'surveying' where region = 'uk' and company_name = 'Plowman Craven';
update public.competitors set drone_technology = 'DJI Matrice 350 RTK, YellowScan LiDAR', service_categories = 'surveying,inspection' where region = 'uk' and company_name = 'Terra Drone UK';
update public.competitors set drone_technology = 'DJI Mavic 3 Thermal, Matrice 300', service_categories = 'inspection,media' where region = 'uk' and company_name = 'Balmore Aerial Services';
update public.competitors set drone_technology = 'DJI Phantom 4 RTK, Matrice 300', service_categories = 'surveying' where region = 'uk' and company_name = 'Halo Photogrammetry';
update public.competitors set drone_technology = 'DJI Matrice 350, Skydio X10', service_categories = 'inspection' where region = 'uk' and company_name = 'OpenWorks Engineering';
update public.competitors set drone_technology = 'DJI Mini 4 Enterprise, Mavic 3E', service_categories = 'inspection' where region = 'uk' and company_name = 'Inspect Air';
update public.competitors set drone_technology = 'Mixed OEM fleet, DJI Dock', service_categories = 'other' where region = 'uk' and company_name = 'Drone Major Group';
update public.competitors set drone_technology = 'DJI Inspire 3, Air 3', service_categories = 'media' where region = 'uk' and company_name = 'Urban Vision';
update public.competitors set drone_technology = 'DJI Phantom 4 RTK, Matrice 350', service_categories = 'surveying' where region = 'uk' and company_name = 'GeoSky Surveys';
update public.competitors set drone_technology = 'DJI Matrice 300 RTK, Zenmuse P1', service_categories = 'inspection,surveying' where region = 'uk' and company_name = 'Skyhook Services';
update public.competitors set drone_technology = 'DJI Matrice 350 RTK, Mavic 3E', service_categories = 'surveying,media' where region = 'uk' and company_name = 'Aerial CM';
update public.competitors set drone_technology = 'DJI Matrice 350, YellowScan Mapper', service_categories = 'surveying' where region = 'uk' and company_name = 'LM Survey Partnership';
update public.competitors set drone_technology = 'DJI Matrice 30T, M350 RTK', service_categories = 'inspection,surveying' where region = 'uk' and company_name = 'Nationwide Drones';

insert into public.competitors (
  region, company_name, website, services, service_categories, drone_technology, last_revenue, notes, sort_order
)
select
  'spain',
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
    ('HEMAV Technology', 'https://hemav.com/', 'AI-enabled aerial analytics for agriculture, utilities, and infrastructure.', 'surveying,inspection', 'DJI Matrice 350 RTK, custom AI edge stack', '€14M (2024 est.)', 'One of Spain''s largest drone data platforms with EU utility contracts.', 1),
    ('Aerocamaras', 'https://aerocamaras.com/', 'National operator for industrial inspection, emergency response, and broadcast aerial capture.', 'inspection,media', 'DJI Matrice 350 RTK, Inspire 3', '€11M (2024 est.)', 'Long-established Spanish operator with nationwide pilot network.', 2),
    ('Catuav', 'https://catuav.com/', 'Precision photogrammetry, cadastral mapping, and quarry volumetrics.', 'surveying', 'senseFly eBee X, DJI Phantom 4 RTK', '€5.8M (2024 est.)', 'Catalonia-based survey specialist with strong construction pipeline.', 3),
    ('Elevon', 'https://elevon.aero/', 'Critical infrastructure inspection for energy, transport, and telecom assets.', 'inspection', 'DJI Matrice 30T, Skydio X10', '€5.2M (2024 est.)', 'Enterprise inspection workflows with digital twin deliverables.', 4),
    ('Horus Smart Provisioning', 'https://horus.es/', 'Asset inspection and predictive maintenance for solar, wind, and industrial plants.', 'inspection', 'DJI Matrice 300 RTK, thermal payloads', '€4.1M (2024 est.)', 'Strong renewable energy inspection footprint across Iberia.', 5),
    ('Dronoss', 'https://dronoss.com/', 'Mining, quarry, and earthworks survey programmes with stockpile analytics.', 'surveying', 'WingtraOne GEN II, DJI Matrice 350', '€3.6M (2024 est.)', 'Mining and aggregates sector specialist in northern Spain.', 6),
    ('Skying', 'https://skying.es/', 'Aerial filming, tourism promotion, and real-estate visual content.', 'media,inspection', 'DJI Inspire 3, Air 3', '€3.2M (2024 est.)', 'Media-first operator with growing inspection add-ons.', 7),
    ('GeoDrones Iberia', 'https://geodrones.es/', 'Topographic survey, orthomosaics, and cadastral support for developers.', 'surveying', 'DJI Phantom 4 RTK, Matrice 350 RTK', '€2.9M (2024 est.)', 'Regional survey teams across Madrid and central Spain.', 8),
    ('Aeroscan España', 'https://aeroscan.es/', 'Roof, facade, and industrial envelope inspections for FM providers.', 'inspection', 'DJI Matrice 300 RTK, Mavic 3 Thermal', '€2.5M (2024 est.)', 'FM and insurer referral network in urban markets.', 9),
    ('Catalana de Drones', 'https://catalanadedrones.com/', 'Construction progress monitoring and promotional aerial media.', 'surveying,media', 'DJI Matrice 350, Mavic 3 Classic', '€2.2M (2024 est.)', 'Barcelona construction and events client base.', 10),
    ('Andalucía UAV Services', 'https://andaluciadrons.es/', 'Solar farm inspection and agricultural crop monitoring.', 'inspection,surveying', 'DJI Matrice 30T, Mavic 3 Multispectral', '€1.9M (2024 est.)', 'Southern Spain solar and agri portfolio.', 11),
    ('Madrid GeoAerial', 'https://madridgeoaerial.es/', 'Land development surveys and volumetric reporting.', 'surveying', 'DJI Phantom 4 RTK, Matrice 350', '€1.7M (2024 est.)', 'Residential and logistics park survey specialist.', 12),
    ('Basque Drone Inspection', 'https://basquedroneinspection.com/', 'Industrial plant, port, and pipeline visual inspections.', 'inspection', 'DJI Matrice 350 RTK, Zenmuse H20T', '€1.5M (2024 est.)', 'Basque Country industrial corridor focus.', 13),
    ('Valencia Aerial Media', 'https://valenciaaerialmedia.es/', 'Broadcast, events, and hospitality aerial filming.', 'media', 'DJI Inspire 3, Mini 4 Pro', '€1.4M (2024 est.)', 'Mediterranean coast tourism and events niche.', 14),
    ('Galicia Survey Drones', 'https://galiciadrones.es/', 'Forestry, coastal erosion, and rural cadastral surveys.', 'surveying', 'DJI Matrice 350, Phantom 4 RTK', '€1.2M (2024 est.)', 'Atlantic coast public-sector survey work.', 15),
    ('Canary Islands Aerial', 'https://canarydrones.es/', 'Resort inspection, tourism media, and volcanic terrain mapping.', 'inspection,media', 'DJI Mavic 3 Enterprise, Matrice 30', '€1.1M (2024 est.)', 'Island logistics and tourism dual revenue streams.', 16),
    ('Aragón Topografía UAV', 'https://aragonuav.es/', 'Highway, rail, and civil engineering topographic support.', 'surveying', 'DJI Matrice 350 RTK, LiDAR pod', '€980K (2024 est.)', 'Transport infrastructure frameworks in north-east Spain.', 17),
    ('Baleares Drone Works', 'https://balearesdrones.com/', 'Marina, hotel, and luxury property aerial capture.', 'media,inspection', 'DJI Air 3, Mavic 3 Pro', '€850K (2024 est.)', 'Balearic islands hospitality and property market.', 18),
    ('Castilla Drone Academy', 'https://castilladrones.es/', 'CAA-equivalent training, fleet setup, and compliance advisory.', 'other', 'Mixed trainer fleet, DJI Mini 4 Enterprise', '€720K (2024 est.)', 'Training-led revenue with SME operator onboarding.', 19),
    ('Extremadura Aerial Services', 'https://extremaduraaerial.es/', 'Agricultural mapping, irrigation inspection, and rural surveys.', 'surveying,inspection', 'DJI Mavic 3 Multispectral, Matrice 30T', '€650K (2024 est.)', 'Agri and water infrastructure in western Spain.', 20)
) as seed(company_name, website, services, service_categories, drone_technology, last_revenue, notes, sort_order)
where not exists (
  select 1
  from public.competitors existing
  where existing.region = 'spain'
    and lower(existing.company_name) = lower(seed.company_name)
);

insert into public.competitors (
  region, company_name, website, services, service_categories, drone_technology, last_revenue, notes, sort_order
)
select
  'portugal',
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
    ('Tekever', 'https://www.tekever.com/', 'Maritime patrol, coastal surveillance, and defence-grade UAV programmes.', 'inspection,other', 'TEKEVER AR5, fixed-wing UAS fleet', '€28M (2024 est.)', 'Portugal''s largest UAV group with NATO and EU agency contracts.', 1),
    ('UAVision', 'https://uavision.com/', 'VTOL mapping platforms, OEM payloads, and enterprise survey delivery.', 'surveying,inspection', 'UAVision VTOL, Sony aerial payloads', '€8.5M (2024 est.)', 'Lisbon OEM with global survey and inspection partners.', 2),
    ('Flyebee', 'https://flyebee.com/', 'Solar, wind, and industrial asset inspection with thermal reporting.', 'inspection', 'DJI Matrice 350 RTK, M30T', '€6.2M (2024 est.)', 'Renewables inspection leader with Iberian utility clients.', 3),
    ('Beyond Vision', 'https://beyondvision.pt/', 'Power-line, telecom tower, and infrastructure inspection services.', 'inspection,surveying', 'DJI Matrice 350, custom LiDAR pods', '€4.8M (2024 est.)', 'Infrastructure inspection specialist headquartered near Porto.', 4),
    ('Helistrat Unmanned', 'https://www.helistore.pt/', 'Industrial inspection, aerial media, and enterprise drone supply.', 'inspection,media,other', 'DJI Matrice 300 RTK, Inspire 3', '€3.4M (2024 est.)', 'Distribution plus in-house operations model.', 5),
    ('Critical TechWorks UAV', 'https://criticaltechworks.com/', 'Automotive and smart-city UAV research with commercial pilots.', 'other', 'Custom quadcopter platforms, DJI enterprise', '€3.1M (2024 est.)', 'Tech venture studio with recurring enterprise pilots.', 6),
    ('Neadvance Drones', 'https://neadvance.com/', 'Precision agriculture analytics and topographic survey support.', 'surveying,other', 'DJI Phantom 4 RTK, Mavic 3 Multispectral', '€2.7M (2024 est.)', 'Agri-tech and survey crossover in northern Portugal.', 7),
    ('Lisbon Aerial Survey', 'https://lisbonaerialsurvey.pt/', 'Urban redevelopment surveys and construction volumetrics.', 'surveying', 'DJI Matrice 350 RTK, P4 RTK', '€2.3M (2024 est.)', 'Greater Lisbon construction and logistics projects.', 8),
    ('Porto Inspection Drones', 'https://portodrones.pt/', 'Building envelope, bridge, and industrial roof inspections.', 'inspection', 'DJI Matrice 30T, Mavic 3 Thermal', '€2.0M (2024 est.)', 'Northern Portugal FM and insurer programmes.', 9),
    ('Algarve Drone Media', 'https://algarvedronemedia.pt/', 'Tourism, hospitality, and golf resort aerial filming.', 'media', 'DJI Inspire 3, Air 3', '€1.8M (2024 est.)', 'Algarve tourism and real-estate media specialist.', 10),
    ('Coimbra GeoUAV', 'https://coimbrageouav.pt/', 'University-linked geospatial mapping and cadastral surveys.', 'surveying', 'DJI Phantom 4 RTK, Matrice 350', '€1.6M (2024 est.)', 'Central Portugal public-sector and academic projects.', 11),
    ('Setúbal Industrial Inspection', 'https://setubalinspection.pt/', 'Port, refinery, and heavy industry visual and thermal inspection.', 'inspection', 'DJI Matrice 350 RTK, Zenmuse H20T', '€1.4M (2024 est.)', 'Industrial corridor around Lisbon south bay.', 12),
    ('Braga Aerial Services', 'https://bragadrones.pt/', 'Corporate media, events, and light inspection work.', 'media,inspection', 'DJI Mini 4 Pro, Mavic 3 Classic', '€1.2M (2024 est.)', 'Minho region corporate and events client base.', 13),
    ('Aveiro Survey Fleet', 'https://aveirosurvey.pt/', 'Coastal erosion, aquaculture, and wetland mapping.', 'surveying', 'DJI Matrice 350, multispectral payloads', '€1.0M (2024 est.)', 'Atlantic coast environmental monitoring niche.', 14),
    ('Minho Drone Ops', 'https://minhodrones.pt/', 'Vineyard, forestry, and agricultural crop health mapping.', 'surveying,inspection', 'DJI Mavic 3 Multispectral, Matrice 30', '€920K (2024 est.)', 'Douro and Minho wine region agri contracts.', 15),
    ('Évora Agricultural UAV', 'https://evorauav.pt/', 'Irrigation, crop scouting, and rural estate surveys.', 'surveying,other', 'DJI Agras T50, Mavic 3M', '€780K (2024 est.)', 'Alentejo agri and estate monitoring.', 16),
    ('Madeira Aerial Capture', 'https://madeiraaerial.pt/', 'Island tourism promotion and resort inspection media.', 'media,inspection', 'DJI Air 3, Mini 4 Pro', '€700K (2024 est.)', 'Autonomous region tourism and hospitality focus.', 17),
    ('Azores Inspection UAV', 'https://azoresinspection.pt/', 'Wind farm, coastal cliff, and geothermal plant inspections.', 'inspection', 'DJI Matrice 30T, M350 RTK', '€650K (2024 est.)', 'Atlantic islands renewables and tourism assets.', 18),
    ('Santarém Mapping Drones', 'https://santaremdrones.pt/', 'Highway, rail, and logistics hub topographic surveys.', 'surveying', 'DJI Phantom 4 RTK, Matrice 350', '€580K (2024 est.)', 'Central corridor transport infrastructure work.', 19),
    ('Viseu Regional Drones', 'https://viseudrones.pt/', 'Municipal mapping, forestry, and rural inspection support.', 'surveying,inspection', 'DJI Mavic 3 Enterprise, Matrice 30', '€520K (2024 est.)', 'Interior Portugal municipal frameworks.', 20)
) as seed(company_name, website, services, service_categories, drone_technology, last_revenue, notes, sort_order)
where not exists (
  select 1
  from public.competitors existing
  where existing.region = 'portugal'
    and lower(existing.company_name) = lower(seed.company_name)
);
