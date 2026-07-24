-- Integration Registry catalog (UI Integration Wizards framework).
-- Separate from integration_providers (connection framework). No OAuth / sync yet.

create table if not exists public.integrations (
  id text primary key,
  vendor text not null,
  category text not null,
  display_name text not null,
  description text not null,
  logo text not null,
  status text not null default 'work_in_progress',
  wizard_available boolean not null default false,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  future_auth_type text,
  future_api_provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integrations_status_check check (
    status in ('work_in_progress', 'available', 'coming_soon')
  ),
  constraint integrations_category_check check (
    category in (
      'project-management',
      'crm',
      'financials',
      'human-resources',
      'corporate-information',
      'business-productivity',
      'operations',
      'training'
    )
  )
);

create index if not exists integrations_category_sort_idx
  on public.integrations (category, sort_order asc, display_name asc);

create index if not exists integrations_enabled_idx
  on public.integrations (enabled);

alter table public.integrations enable row level security;

drop policy if exists "integrations_select_all" on public.integrations;
create policy "integrations_select_all" on public.integrations
  for select using (true);

drop policy if exists "integrations_all" on public.integrations;
create policy "integrations_all" on public.integrations
  for all using (true) with check (true);

alter table public.integrations replica identity full;

-- Seed catalog (idempotent).
insert into public.integrations (
  id, vendor, category, display_name, description, logo, status,
  wizard_available, enabled, sort_order, future_auth_type, future_api_provider
)
values
  -- Project Management
  ('monday', 'Monday.com', 'project-management', 'Monday', 'Work OS for plans, boards and delivery tracking.', 'https://cdn.simpleicons.org/mondaydotcom/FF3D57', 'work_in_progress', false, true, 10, 'oauth2', 'monday'),
  ('asana', 'Asana', 'project-management', 'Asana', 'Task and portfolio management for cross-team delivery.', 'https://cdn.simpleicons.org/asana/F06A6A', 'work_in_progress', false, true, 20, 'oauth2', 'asana'),
  ('airtable', 'Airtable', 'project-management', 'Airtable', 'Flexible bases for project data and operational workflows.', 'https://cdn.simpleicons.org/airtable/18BFFF', 'work_in_progress', false, true, 30, 'oauth2', 'airtable'),
  ('microsoft-project', 'Microsoft', 'project-management', 'Microsoft Project', 'Enterprise scheduling, resource and programme controls.', 'https://cdn.simpleicons.org/microsoftproject/217346', 'work_in_progress', false, true, 40, 'oauth2', 'microsoft-graph'),
  ('microsoft-dynamics', 'Microsoft', 'project-management', 'Microsoft Dynamics', 'Dynamics 365 project operations and customer engagement.', 'https://cdn.simpleicons.org/dynamics365/002050', 'work_in_progress', false, true, 50, 'oauth2', 'dynamics365'),
  ('zoho-projects', 'Zoho', 'project-management', 'Zoho Projects', 'Project planning, milestones and team collaboration.', 'https://cdn.simpleicons.org/zoho/E42527', 'work_in_progress', false, true, 60, 'oauth2', 'zoho'),

  -- CRM
  ('hubspot', 'HubSpot', 'crm', 'HubSpot', 'CRM, marketing and pipeline automation for growth teams.', 'https://cdn.simpleicons.org/hubspot/FF7A59', 'work_in_progress', false, true, 10, 'oauth2', 'hubspot'),
  ('pipedrive', 'Pipedrive', 'crm', 'Pipedrive', 'Sales pipeline CRM focused on deal progression.', 'https://cdn.simpleicons.org/pipedrive/017737', 'work_in_progress', false, true, 20, 'oauth2', 'pipedrive'),
  ('salesforce', 'Salesforce', 'crm', 'Salesforce', 'Enterprise CRM for accounts, opportunities and service.', 'https://cdn.simpleicons.org/salesforce/00A1E0', 'work_in_progress', false, true, 30, 'oauth2', 'salesforce'),

  -- Financials
  ('xero', 'Xero', 'financials', 'Xero', 'Cloud accounting for ledgers, invoicing and reconciliation.', 'https://cdn.simpleicons.org/xero/13B5EA', 'work_in_progress', false, true, 10, 'oauth2', 'xero'),
  ('quickbooks', 'Intuit', 'financials', 'QuickBooks', 'Accounting, expenses and financial reporting for SMBs.', 'https://cdn.simpleicons.org/quickbooks/2CA01C', 'work_in_progress', false, true, 20, 'oauth2', 'quickbooks'),
  ('sage', 'Sage', 'financials', 'Sage', 'Accounting and finance suites for mid-market operations.', 'https://cdn.simpleicons.org/sage/00D639', 'work_in_progress', false, true, 30, 'oauth2', 'sage'),
  ('netsuite', 'Oracle', 'financials', 'NetSuite', 'ERP and financials for multi-entity organisations.', 'https://cdn.simpleicons.org/oracle/F80000', 'work_in_progress', false, true, 40, 'oauth2', 'netsuite'),
  ('stripe', 'Stripe', 'financials', 'Stripe', 'Payments, billing and revenue infrastructure.', 'https://cdn.simpleicons.org/stripe/635BFF', 'work_in_progress', false, true, 50, 'api_key', 'stripe'),
  ('dext', 'Dext', 'financials', 'Dext', 'Bookkeeping automation for receipts and supplier documents.', 'https://logo.clearbit.com/dext.com', 'work_in_progress', false, true, 60, 'oauth2', 'dext'),

  -- Human Resources
  ('peoplesoft', 'Oracle', 'human-resources', 'PeopleSoft', 'Enterprise HCM for workforce and HR administration.', 'https://cdn.simpleicons.org/oracle/F80000', 'work_in_progress', false, true, 10, 'oauth2', 'peoplesoft'),
  ('peoplehr', 'Access PeopleHR', 'human-resources', 'PeopleHR', 'HRIS for employee records, leave and people processes.', 'https://logo.clearbit.com/peoplehr.com', 'work_in_progress', false, true, 20, 'api_key', 'peoplehr'),
  ('bamboohr', 'BambooHR', 'human-resources', 'BambooHR', 'People data, onboarding and HR workflows.', 'https://cdn.simpleicons.org/bamboohr/73C41D', 'work_in_progress', false, true, 30, 'oauth2', 'bamboohr'),
  ('deel', 'Deel', 'human-resources', 'Deel', 'Global payroll, contractors and compliance.', 'https://cdn.simpleicons.org/deel/FFFFFF', 'work_in_progress', false, true, 40, 'oauth2', 'deel'),

  -- Corporate Information
  ('microsoft-sharepoint', 'Microsoft', 'corporate-information', 'Microsoft SharePoint', 'Corporate document libraries and knowledge repositories.', 'https://cdn.simpleicons.org/microsoftsharepoint/038387', 'work_in_progress', false, true, 10, 'oauth2', 'microsoft-graph'),
  ('google-drive', 'Google', 'corporate-information', 'Google Drive', 'Cloud file storage and shared drive collaboration.', 'https://cdn.simpleicons.org/googledrive/4285F4', 'work_in_progress', false, true, 20, 'oauth2', 'google'),
  ('amazon-aws', 'Amazon', 'corporate-information', 'Amazon AWS', 'Cloud infrastructure, storage and identity services.', 'https://cdn.simpleicons.org/amazonaws/FF9900', 'work_in_progress', false, true, 30, 'api_key', 'aws'),
  ('ledgy', 'Ledgy', 'corporate-information', 'Ledgy', 'Equity management, cap table and stakeholder reporting.', 'https://logo.clearbit.com/ledgy.com', 'work_in_progress', false, true, 40, 'oauth2', 'ledgy'),

  -- Business Productivity
  ('microsoft-365', 'Microsoft', 'business-productivity', 'Microsoft 365', 'Productivity suite — mail, files, identity and collaboration.', 'https://cdn.simpleicons.org/microsoftoffice/D83B01', 'work_in_progress', false, true, 10, 'oauth2', 'microsoft-graph'),
  ('google-workspace-mail', 'Google', 'business-productivity', 'Google Workspace (Mail)', 'Business email and calendar via Google Workspace.', 'https://cdn.simpleicons.org/gmail/EA4335', 'work_in_progress', false, true, 20, 'oauth2', 'google'),
  ('microsoft-sharepoint-productivity', 'Microsoft', 'business-productivity', 'Microsoft SharePoint', 'Team sites and shared content for daily collaboration.', 'https://cdn.simpleicons.org/microsoftsharepoint/038387', 'work_in_progress', false, true, 30, 'oauth2', 'microsoft-graph'),
  ('microsoft-teams', 'Microsoft', 'business-productivity', 'Microsoft Teams', 'Chat, meetings and workplace collaboration hubs.', 'https://cdn.simpleicons.org/microsoftteams/6264A7', 'work_in_progress', false, true, 40, 'oauth2', 'microsoft-graph'),
  ('zoom', 'Zoom', 'business-productivity', 'Zoom', 'Video meetings and webinar collaboration.', 'https://cdn.simpleicons.org/zoom/0B5CFF', 'work_in_progress', false, true, 50, 'oauth2', 'zoom'),
  ('zoho-support', 'Zoho', 'business-productivity', 'Zoho Support', 'Customer support desk and ticket workflows.', 'https://cdn.simpleicons.org/zoho/E42527', 'work_in_progress', false, true, 60, 'oauth2', 'zoho'),

  -- Operations
  ('asset-panda', 'Asset Panda', 'operations', 'Asset Panda', 'Asset tracking and inventory operations.', 'https://logo.clearbit.com/assetpanda.com', 'work_in_progress', false, true, 10, 'api_key', 'asset-panda'),
  ('zoho-inventory', 'Zoho', 'operations', 'Zoho Inventory', 'Inventory, orders and warehouse operations.', 'https://cdn.simpleicons.org/zoho/E42527', 'work_in_progress', false, true, 20, 'oauth2', 'zoho'),
  ('assettiger', 'AssetTiger', 'operations', 'AssetTiger', 'Fixed asset register and assignment tracking.', 'https://logo.clearbit.com/assettiger.com', 'work_in_progress', false, true, 30, 'api_key', 'assettiger'),
  ('sap', 'SAP', 'operations', 'SAP', 'Enterprise operations, supply chain and ERP processes.', 'https://cdn.simpleicons.org/sap/0FAAFF', 'work_in_progress', false, true, 40, 'oauth2', 'sap'),

  -- Training
  ('talentlms', 'Epignosis', 'training', 'TalentLMS', 'Learning management for courses and compliance training.', 'https://logo.clearbit.com/talentlms.com', 'work_in_progress', false, true, 10, 'api_key', 'talentlms'),
  ('docebo', 'Docebo', 'training', 'Docebo', 'Enterprise LMS for learning journeys and analytics.', 'https://logo.clearbit.com/docebo.com', 'work_in_progress', false, true, 20, 'oauth2', 'docebo'),
  ('workramp', 'WorkRamp', 'training', 'WorkRamp', 'Employee and customer training enablement platform.', 'https://logo.clearbit.com/workramp.com', 'work_in_progress', false, true, 30, 'oauth2', 'workramp')
on conflict (id) do update set
  vendor = excluded.vendor,
  category = excluded.category,
  display_name = excluded.display_name,
  description = excluded.description,
  logo = excluded.logo,
  status = excluded.status,
  wizard_available = excluded.wizard_available,
  enabled = excluded.enabled,
  sort_order = excluded.sort_order,
  future_auth_type = excluded.future_auth_type,
  future_api_provider = excluded.future_api_provider,
  updated_at = now();
