import {
  INTEGRATION_CATALOG_CATEGORIES,
  type IntegrationCatalogCategory,
  type IntegrationCategoryGroup,
  type IntegrationRegistryEntry,
} from "@/lib/integrations-registry";

function entry(
  id: string,
  vendor: string,
  category: IntegrationCatalogCategory,
  name: string,
  description: string,
  logo: string,
  sortOrder: number,
): IntegrationRegistryEntry {
  return {
    id,
    vendor,
    category,
    name,
    description,
    logo,
    status: "work_in_progress",
    wizardAvailable: false,
    enabled: true,
    sortOrder,
    futureAuthType: "oauth2",
    futureApiProvider: id,
  };
}

const NORTHSTAR_CATEGORY_LABELS: Record<IntegrationCatalogCategory, string> = {
  "project-management": "Project Management",
  crm: "CRM",
  financials: "Financials",
  "human-resources": "Human Resources",
  "corporate-information": "Corporate Data",
  "business-productivity": "Business Productivity",
  operations: "Operations",
  training: "Training",
};

/** Northstar demo integration catalog — trimmed and extended per product brief. */
export function getNorthstarIntegrations(): IntegrationRegistryEntry[] {
  return [
    // Project Management
    entry(
      "asana",
      "Asana",
      "project-management",
      "Asana",
      "Task and portfolio management for cross-team delivery.",
      "https://cdn.simpleicons.org/asana/F06A6A",
      10,
    ),
    entry(
      "airtable",
      "Airtable",
      "project-management",
      "Airtable",
      "Flexible bases for project data and operational workflows.",
      "https://cdn.simpleicons.org/airtable/18BFFF",
      20,
    ),
    entry(
      "microsoft-project",
      "Microsoft",
      "project-management",
      "Microsoft Project",
      "Enterprise scheduling, resource and programme controls.",
      "/images/integrations/microsoft-project.svg",
      30,
    ),
    entry(
      "microsoft-dynamics",
      "Microsoft",
      "project-management",
      "Microsoft Dynamics",
      "Dynamics 365 project operations and customer engagement.",
      "https://cdn.simpleicons.org/dynamics365/002050",
      40,
    ),

    // CRM
    entry(
      "pipedrive",
      "Pipedrive",
      "crm",
      "Pipedrive",
      "Sales pipeline CRM focused on deal progression.",
      "/images/integrations/pipedrive.svg",
      10,
    ),
    entry(
      "salesforce",
      "Salesforce",
      "crm",
      "Salesforce",
      "Enterprise CRM for accounts, opportunities and service.",
      "/images/integrations/salesforce.svg",
      20,
    ),

    // Financials
    entry(
      "xero",
      "Xero",
      "financials",
      "Xero",
      "Cloud accounting for ledgers, invoicing and reconciliation.",
      "https://cdn.simpleicons.org/xero/13B5EA",
      10,
    ),
    entry(
      "quickbooks",
      "Intuit",
      "financials",
      "QuickBooks",
      "Accounting, expenses and financial reporting for SMBs.",
      "/images/integrations/quickbooks.svg",
      20,
    ),
    entry(
      "sage",
      "Sage",
      "financials",
      "Sage",
      "Accounting and finance suites for mid-market operations.",
      "https://cdn.simpleicons.org/sage/00D639",
      30,
    ),
    entry(
      "stripe",
      "Stripe",
      "financials",
      "Stripe",
      "Payments, billing and revenue infrastructure.",
      "/images/integrations/stripe.svg",
      40,
    ),
    entry(
      "dext",
      "Dext",
      "financials",
      "Dext",
      "Bookkeeping automation for receipts and supplier documents.",
      "https://logo.clearbit.com/dext.com",
      50,
    ),

    // Human Resources
    entry(
      "peoplesoft",
      "Oracle",
      "human-resources",
      "PeopleSoft",
      "Enterprise HCM for workforce and HR administration.",
      "/images/integrations/peoplesoft.svg",
      10,
    ),
    entry(
      "bamboohr",
      "BambooHR",
      "human-resources",
      "BambooHR",
      "People data, onboarding and HR workflows.",
      "https://cdn.simpleicons.org/bamboohr/73C41D",
      20,
    ),
    entry(
      "deel",
      "Deel",
      "human-resources",
      "Deel",
      "Global payroll, contractors and compliance.",
      "https://cdn.simpleicons.org/deel/FFFFFF",
      30,
    ),

    // Corporate Data
    entry(
      "microsoft-sharepoint",
      "Microsoft",
      "corporate-information",
      "Microsoft SharePoint",
      "Corporate document libraries and knowledge repositories.",
      "https://cdn.simpleicons.org/microsoftsharepoint/038387",
      10,
    ),
    entry(
      "google-drive",
      "Google",
      "corporate-information",
      "Google Drive",
      "Cloud file storage and shared drive collaboration.",
      "/images/integrations/google-drive.svg",
      20,
    ),
    entry(
      "onedrive",
      "Microsoft",
      "corporate-information",
      "OneDrive",
      "Personal and team cloud storage within Microsoft 365.",
      "https://cdn.simpleicons.org/microsoftonedrive/0078D4",
      30,
    ),
    entry(
      "ledgy",
      "Ledgy",
      "corporate-information",
      "Ledgy",
      "Equity management, cap table and stakeholder reporting.",
      "https://logo.clearbit.com/ledgy.com",
      40,
    ),

    // Business Productivity
    entry(
      "microsoft-365",
      "Microsoft",
      "business-productivity",
      "Microsoft 365",
      "Productivity suite — mail, files, identity and collaboration.",
      "/images/integrations/microsoft365.svg",
      10,
    ),
    entry(
      "google-workspace-mail",
      "Google",
      "business-productivity",
      "Google Workspace (Mail)",
      "Business email via Google Workspace.",
      "https://cdn.simpleicons.org/gmail/EA4335",
      20,
    ),
    entry(
      "google-calendar",
      "Google",
      "business-productivity",
      "Google Calendar",
      "Shared calendars, room booking and meeting scheduling.",
      "https://cdn.simpleicons.org/googlecalendar/4285F4",
      30,
    ),
    entry(
      "microsoft-outlook",
      "Microsoft",
      "business-productivity",
      "Microsoft Outlook",
      "Business email, calendar and contacts via Microsoft 365.",
      "https://cdn.simpleicons.org/microsoftoutlook/0078D4",
      40,
    ),
    entry(
      "microsoft-teams",
      "Microsoft",
      "business-productivity",
      "Microsoft Teams",
      "Chat, meetings and workplace collaboration hubs.",
      "https://cdn.simpleicons.org/microsoftteams/6264A7",
      50,
    ),

    // Operations
    entry(
      "asset-panda",
      "Asset Panda",
      "operations",
      "Asset Panda",
      "Asset tracking and inventory operations.",
      "https://logo.clearbit.com/assetpanda.com",
      10,
    ),
    entry(
      "assettiger",
      "AssetTiger",
      "operations",
      "AssetTiger",
      "Fixed asset register and assignment tracking.",
      "https://logo.clearbit.com/assettiger.com",
      20,
    ),
    entry(
      "sap",
      "SAP",
      "operations",
      "SAP",
      "Enterprise operations, supply chain and ERP processes.",
      "https://cdn.simpleicons.org/sap/0FAAFF",
      30,
    ),

    // Training
    entry(
      "talentlms",
      "Epignosis",
      "training",
      "TalentLMS",
      "Learning management for courses and compliance training.",
      "https://logo.clearbit.com/talentlms.com",
      10,
    ),
    entry(
      "docebo",
      "Docebo",
      "training",
      "Docebo",
      "Enterprise LMS for learning journeys and analytics.",
      "https://logo.clearbit.com/docebo.com",
      20,
    ),
    entry(
      "workramp",
      "WorkRamp",
      "training",
      "WorkRamp",
      "Employee and customer training enablement platform.",
      "https://logo.clearbit.com/workramp.com",
      30,
    ),
  ];
}

export function groupNorthstarIntegrationsByCategory(
  entries: IntegrationRegistryEntry[],
): IntegrationCategoryGroup[] {
  const byCategory = new Map<IntegrationCatalogCategory, IntegrationRegistryEntry[]>();

  for (const category of INTEGRATION_CATALOG_CATEGORIES) {
    byCategory.set(category, []);
  }

  for (const entryRow of entries) {
    if (!entryRow.enabled) continue;
    const bucket = byCategory.get(entryRow.category);
    if (bucket) bucket.push(entryRow);
  }

  return INTEGRATION_CATALOG_CATEGORIES.map((category) => ({
    category,
    label: NORTHSTAR_CATEGORY_LABELS[category],
    integrations: (byCategory.get(category) ?? []).sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
    ),
  })).filter((group) => group.integrations.length > 0);
}
