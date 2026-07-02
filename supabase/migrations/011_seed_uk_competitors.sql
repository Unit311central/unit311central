-- Seed 20 UK competitors (skips names already present for region uk)
-- Run in Supabase SQL Editor or via supabase db push

insert into public.competitors (region, company_name, website, services, last_revenue, notes, sort_order)
select
  'uk',
  seed.company_name,
  seed.website,
  seed.services,
  seed.last_revenue,
  seed.notes,
  seed.sort_order
from (
  values
    ('Critical Asset', 'https://criticalasset.co.uk/', 'Building, roof, solar, and industrial asset inspection with thermal and visual reporting.', '£3.2M (2024 est.)', 'Strong insurer and logistics park footprint across England.', 1),
    ('Cyberhawk', 'https://thecyberhawk.com/', 'Oil & gas, utilities, and industrial visual and thermal inspection programmes.', '£18M (2023)', 'Global operator with major UK energy sector contracts.', 2),
    ('Consortiq', 'https://consortiq.com/', 'Operational consultancy, PfCO/CAA training, fleet setup, and compliance support.', '£4.5M (2024 est.)', 'Consultancy-led model with enterprise and public-sector clients.', 3),
    ('Coptrz', 'https://coptrz.com/', 'Enterprise drone hardware, payloads, training, and managed survey workflows.', '£12M (2023)', 'DJI enterprise channel partner with strong construction pipeline.', 4),
    ('Heliguy', 'https://www.heliguy.com/', 'Drone sales, repairs, training, and in-house inspection/media delivery teams.', '£9M (2024 est.)', 'North-east base with national enterprise support desk.', 5),
    ('RUAS', 'https://www.ruas.co.uk/', 'CAA-approved training, operational support, and specialist inspection services.', '£2.1M (2024 est.)', 'Training academy model with recurring operator upskilling revenue.', 6),
    ('iRed', 'https://ired.co.uk/', 'Thermal roof, solar, and building envelope inspections for FM and insurers.', '£1.8M (2024 est.)', 'Thermal-first positioning with strong insurance referral network.', 7),
    ('Plowman Craven', 'https://www.plowmancraven.co.uk/', 'Measured building surveys, BIM capture, and heritage drone photogrammetry.', '£22M (2023)', 'Established surveying brand adding drone capture to traditional workflows.', 8),
    ('Terra Drone UK', 'https://www.terradrone.net/', 'Topographic survey, LiDAR, inspection, and digital twin deliverables.', '£6M (2024 est.)', 'Part of wider Terra Drone group with utility and infrastructure focus.', 9),
    ('Balmore Aerial Services', 'https://balmore.co.uk/', 'Roof surveys, thermal imaging, and aerial photography for commercial estates.', '£950K (2024 est.)', 'Scotland-heavy client base expanding into northern England.', 10),
    ('Halo Photogrammetry', 'https://halophotogrammetry.com/', 'High-accuracy 3D models, orthomosaics, and progress monitoring for construction.', '£1.4M (2024 est.)', 'Construction progress and heritage documentation specialist.', 11),
    ('OpenWorks Engineering', 'https://openworksengineering.com/', 'Critical infrastructure inspection, confined-space alternatives, and data analytics.', '£3.8M (2024 est.)', 'Infrastructure and transport sector repeat contracts.', 12),
    ('Inspect Air', 'https://inspectair.co.uk/', 'Roof, chimney, and building fabric inspections for housing associations.', '£720K (2024 est.)', 'Social housing and FM maintenance programmes.', 13),
    ('Drone Major Group', 'https://www.dronemajor.co.uk/', 'Strategy, procurement, and managed drone programmes for enterprise clients.', '£2.6M (2024 est.)', 'Advisory-led with public sector and defence adjacency.', 14),
    ('Urban Vision', 'https://www.urbanvision.co.uk/', 'Aerial filming, property marketing, and city-scale visual capture.', '£1.1M (2024 est.)', 'London-centric media and real-estate positioning.', 15),
    ('GeoSky Surveys', 'https://www.geoskysurveys.co.uk/', 'Topographic surveys, volumetrics, and quarry/stockpile analytics.', '£890K (2024 est.)', 'Quarry and earthworks monitoring in Midlands and south.', 16),
    ('Skyhook Services', 'https://skyhookservices.co.uk/', 'Mast, tower, and telecom infrastructure inspection with RTK workflows.', '£640K (2024 est.)', 'Telecoms and utilities niche with repeat tower portfolio work.', 17),
    ('Aerial CM', 'https://www.aerialcm.co.uk/', 'Construction site progress, 4D sequencing support, and stakeholder reporting.', '£1.3M (2024 est.)', 'Tier-1 contractor preferred supplier lists in London and south-east.', 18),
    ('LM Survey Partnership', 'https://www.lmgroup.co.uk/', 'Land surveying, drone LiDAR, and cadastral support for developers.', '£5.5M (2023)', 'Traditional survey firm with growing UAV capture division.', 19),
    ('Nationwide Drones', 'https://www.nationwide-drones.co.uk/', 'Nationwide inspection, surveying, and emergency response drone deployments.', '£2.0M (2024 est.)', 'Multi-region operator bidding on framework contracts.', 20)
) as seed(company_name, website, services, last_revenue, notes, sort_order)
where not exists (
  select 1
  from public.competitors existing
  where existing.region = 'uk'
    and lower(existing.company_name) = lower(seed.company_name)
);

-- Remove placeholder / typo duplicates so UK list stays at 20 seeded operators
delete from public.competitors
where region = 'uk'
  and company_name in ('New Company', 'Critlcal Asset');
