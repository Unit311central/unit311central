/** Marketing copy for homepage workspace explorer panels. */

export type MarketingCapabilityCopy = {
  label: string;
  detail: string;
};

export type MarketingIntegrationTool = {
  name: string;
  /** Filename under /images/integrations/ */
  logo: string;
};

export type MarketingIntegrationCategory = {
  name: string;
  /** Why this category of software connects into Unit311 Central. */
  outcome: string;
  tools: MarketingIntegrationTool[];
};

export type MarketingWorkspaceCopy = {
  id: string;
  title: string;
  /** One strong business outcome shown under the title. */
  outcome: string;
  description: string;
  /** 4–6 carefully chosen capabilities, each with a value explanation. */
  capabilities: MarketingCapabilityCopy[];
  integrationCategories?: MarketingIntegrationCategory[];
};

export const MARKETING_WORKSPACE_COPY: MarketingWorkspaceCopy[] = [
  {
    id: "business-central",
    title: "Business Central",
    outcome: "See the whole business clearly—and act with confidence.",
    description:
      "Executive oversight and enterprise-wide business management across clients, projects, grants and strategic planning.",
    capabilities: [
      {
        label: "Executive Dashboard",
        detail: "Live KPIs and strategic signals in one leadership view.",
      },
      {
        label: "Role-based Dashboards",
        detail: "Give every role the information they need—without noise.",
      },
      {
        label: "Client Management",
        detail: "Keep accounts, relationships and delivery context together.",
      },
      {
        label: "Portfolio Management",
        detail: "Track programmes and priorities across the organisation.",
      },
      {
        label: "Strategic Planning",
        detail: "Align ownership, priorities and delivery health.",
      },
      {
        label: "Approval Workflows",
        detail: "Route decisions through clear, auditable processes.",
      },
    ],
  },
  {
    id: "ai-executive-assistant",
    title: "AI Executive Assistant",
    outcome: "Ask questions, generate reports and take action across the business.",
    description:
      "Ask questions, generate reports and execute workflows across your connected business data with an AI assistant built for leadership.",
    capabilities: [
      {
        label: "Executive Briefings",
        detail: "Concise, current summaries that keep leadership aligned.",
      },
      {
        label: "Business-wide Search",
        detail: "Find answers across workspaces without switching tools.",
      },
      {
        label: "Rapid Report Generation",
        detail: "Produce operating reports from live business data.",
      },
      {
        label: "Board Pack Generation",
        detail: "Assemble board-ready packs without spreadsheet chase.",
      },
      {
        label: "Workflow Execution",
        detail: "Turn decisions into actions inside connected processes.",
      },
      {
        label: "Intelligent Recommendations",
        detail: "Surface what needs attention before it becomes friction.",
      },
    ],
  },
  {
    id: "clients-projects",
    title: "Clients & Projects",
    outcome: "Manage customers from first contact through long-term relationships.",
    description:
      "Run commercial pipeline and project delivery in one connected workspace—from opportunity through close-out.",
    capabilities: [
      {
        label: "Customer Management",
        detail: "Keep every account relationship visible and owned.",
      },
      {
        label: "Sales Pipeline",
        detail: "Move opportunities from first contact through close.",
      },
      {
        label: "Account Management",
        detail: "Coordinate delivery and commercial context in one place.",
      },
      {
        label: "Projects",
        detail: "Plan and track delivery across internal and client work.",
      },
      {
        label: "Portfolio Management",
        detail: "See project health across the commercial book of work.",
      },
      {
        label: "Reporting",
        detail: "Understand pipeline, delivery and account performance.",
      },
    ],
  },
  {
    id: "financials",
    title: "Financials",
    outcome: "Run finance as a live command centre—not a month-end scramble.",
    description:
      "Run the full finance stack—from ledger and payables through cashflow, forecasting and live bank connections—in one place.",
    capabilities: [
      {
        label: "Executive Dashboard",
        detail: "Board-ready financial visibility without spreadsheet sprawl.",
      },
      {
        label: "General Ledger",
        detail: "Keep the books of record connected to day-to-day operations.",
      },
      {
        label: "Accounts Payable & Receivable",
        detail: "Manage payables and receivables with clear ownership.",
      },
      {
        label: "Cashflow",
        detail: "See runway, receivables and payables as one picture.",
      },
      {
        label: "Budgeting & Forecasting",
        detail: "Plan ahead against live operating signals.",
      },
      {
        label: "Bank Connections",
        detail: "Reconcile against live bank feeds and balances.",
      },
    ],
  },
  {
    id: "hr-people",
    title: "HR & People",
    outcome: "Build and develop the workforce that grows the business.",
    description:
      "Manage employees, payroll, leave, performance, recruitment, partners—and give training the prominence growing teams need.",
    capabilities: [
      {
        label: "Training",
        detail: "Plan learning paths and keep workforce skills current.",
      },
      {
        label: "Employees",
        detail: "Maintain records, roles and organisational structure.",
      },
      {
        label: "Payroll",
        detail: "Run payroll with workforce data already in context.",
      },
      {
        label: "Recruitment",
        detail: "Move hiring from requisition through offer with clarity.",
      },
      {
        label: "Performance",
        detail: "Track goals, reviews and development conversations.",
      },
      {
        label: "Partners",
        detail: "Coordinate contractors alongside employees in one view.",
      },
    ],
  },
  {
    id: "technology-engineering",
    title: "Technology & Engineering",
    outcome: "Govern the technology estate and engineering delivery together.",
    description:
      "Govern engineering delivery, capacity and the full technology estate—from devices and software to cloud, telecoms and reporting.",
    capabilities: [
      {
        label: "Engineering Portfolio",
        detail: "Coordinate engineering delivery inside the operating platform.",
      },
      {
        label: "Capacity Planning",
        detail: "Balance demand, utilisation and delivery capacity.",
      },
      {
        label: "IT Asset Management",
        detail: "Track hardware, licences and the technology estate.",
      },
      {
        label: "Infrastructure & Cloud",
        detail: "Operate platforms, networks and cloud footprint.",
      },
      {
        label: "Devices & Software",
        detail: "Know what is deployed, licensed and accountable.",
      },
      {
        label: "Reporting",
        detail: "See technology health and delivery performance clearly.",
      },
    ],
  },
  {
    id: "corporate",
    title: "Corporate",
    outcome: "Keep ownership, governance and corporate obligations under control.",
    description:
      "Corporate information in one place—cap table, board, shareholders, contracts, advisors, legal, insurance and governance.",
    capabilities: [
      {
        label: "Cap Table Management",
        detail: "Keep ownership, equity and stakeholder records accurate.",
      },
      {
        label: "Board Management",
        detail: "Coordinate board materials, decisions and cadence.",
      },
      {
        label: "Shareholders",
        detail: "Maintain a clear view of ownership and stakeholder context.",
      },
      {
        label: "Governance",
        detail: "Keep accountability, structure and oversight clear.",
      },
      {
        label: "Contracts",
        detail: "Store and manage agreements with operational context.",
      },
      {
        label: "Legal & Insurance",
        detail: "Hold legal and insurance obligations in one place.",
      },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    outcome: "Run assets, inventory and logistics as one operational system.",
    description:
      "Run assets, inventory, procurement, warehousing, logistics, fleet and maintenance from one workspace.",
    capabilities: [
      {
        label: "Asset Management",
        detail: "Know what you own, where it sits and who is accountable.",
      },
      {
        label: "Inventory",
        detail: "Monitor stock levels and movement across locations.",
      },
      {
        label: "Procurement",
        detail: "Run purchasing with visibility from request to receipt.",
      },
      {
        label: "Warehousing",
        detail: "Coordinate storage and fulfilment across sites.",
      },
      {
        label: "Logistics & Fleet",
        detail: "Move goods and manage fleet activity with clear status.",
      },
      {
        label: "Maintenance",
        detail: "Plan upkeep and keep critical assets reliable.",
      },
    ],
  },
  {
    id: "business-productivity",
    title: "Business Productivity",
    outcome: "One hub for communications, documents and institutional knowledge.",
    description:
      "The central business communications and information hub—email, calendar, voice, video, documents, knowledge, social and support in one place.",
    capabilities: [
      {
        label: "Email",
        detail: "Operate shared inboxes with full business context.",
      },
      {
        label: "Video Meetings",
        detail: "Meet, transcribe and link discussions to customers, projects and actions.",
      },
      {
        label: "Central Document Repository",
        detail: "Keep institutional files searchable and structured.",
      },
      {
        label: "Knowledge Management",
        detail: "Capture how your business actually operates.",
      },
      {
        label: "Calendar & Collaboration",
        detail: "Coordinate schedules and work without leaving context.",
      },
      {
        label: "Support Desk",
        detail: "Handle internal and external requests in one operating layer.",
      },
    ],
  },
  {
    id: "business-app-integrations",
    title: "Business App Integrations (Examples)",
    outcome: "Connect the specialist systems you already use—without rip-and-replace.",
    description:
      "Connect the specialist systems you already use—organised by business function—so Unit311 Central becomes the operating layer without rip-and-replace.",
    capabilities: [],
    integrationCategories: [
      {
        name: "Project Management",
        outcome: "Connect projects, tasks and delivery workflows.",
        tools: [
          { name: "Monday", logo: "monday.svg" },
          { name: "Asana", logo: "asana.svg" },
          { name: "Airtable", logo: "airtable.svg" },
        ],
      },
      {
        name: "CRM",
        outcome: "Synchronise customers, opportunities and activities.",
        tools: [
          { name: "HubSpot", logo: "hubspot.svg" },
          { name: "Salesforce", logo: "salesforce.svg" },
          { name: "Pipedrive", logo: "pipedrive.svg" },
        ],
      },
      {
        name: "Financials",
        outcome: "Connect accounting and financial data.",
        tools: [
          { name: "Xero", logo: "xero.svg" },
          { name: "QuickBooks", logo: "quickbooks.svg" },
          { name: "Sage", logo: "sage.svg" },
          { name: "NetSuite", logo: "netsuite.svg" },
        ],
      },
      {
        name: "Communications",
        outcome: "Connect conversations and meetings.",
        tools: [
          { name: "Microsoft 365", logo: "microsoft365.svg" },
          { name: "Teams", logo: "teams.svg" },
          { name: "Zoom", logo: "zoom.svg" },
        ],
      },
      {
        name: "Documents",
        outcome: "Centralise documents and business knowledge.",
        tools: [
          { name: "SharePoint", logo: "sharepoint.svg" },
          { name: "Google Drive", logo: "google-drive.svg" },
          { name: "AWS", logo: "aws.svg" },
        ],
      },
    ],
  },
];
