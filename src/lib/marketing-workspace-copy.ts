/** Marketing copy for homepage workspace explorer panels. */

export type MarketingCapabilityCopy = {
  label: string;
  detail: string;
};

export type MarketingIntegrationCategory = {
  name: string;
  tools: string[];
};

export type MarketingWorkspaceCopy = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  /** Four highlighted cards shown in the panel. */
  featured: [MarketingCapabilityCopy, MarketingCapabilityCopy, MarketingCapabilityCopy, MarketingCapabilityCopy];
  /** Full capability set for this workspace (includes featured labels). */
  capabilities: string[];
  integrationCategories?: MarketingIntegrationCategory[];
};

export const MARKETING_WORKSPACE_COPY: MarketingWorkspaceCopy[] = [
  {
    id: "business-central",
    title: "Business Central",
    subtitle: "Executive oversight",
    description:
      "Executive oversight and enterprise-wide business management across clients, projects, grants and strategic planning.",
    featured: [
      {
        label: "Executive Dashboard",
        detail: "Live KPIs, operational insights and strategic reporting in one view.",
      },
      {
        label: "Role-based Dashboards",
        detail: "Give every role the signals they need without noise.",
      },
      {
        label: "Client Management",
        detail: "Manage accounts, relationships and delivery context together.",
      },
      {
        label: "Strategic Planning",
        detail: "Keep priorities, ownership and delivery health aligned.",
      },
    ],
    capabilities: [
      "Executive Dashboard",
      "Role-based Dashboards",
      "Client Management",
      "CRM",
      "Portfolio Management",
      "Projects",
      "Grants",
      "Strategic Planning",
      "Approval Workflow Management",
    ],
  },
  {
    id: "ai-executive-assistant",
    title: "AI Executive Assistant",
    subtitle: "AI that acts across the business",
    description:
      "Ask questions, generate reports and execute workflows across your connected business data with an AI assistant built for leadership.",
    featured: [
      {
        label: "Executive Briefings",
        detail: "Concise, current summaries that keep leadership aligned.",
      },
      {
        label: "Natural Language Business Queries",
        detail: "Ask business questions in plain language and get grounded answers.",
      },
      {
        label: "Board Pack Generation",
        detail: "Assemble board-ready packs from live operating data.",
      },
      {
        label: "Intelligent Recommendations",
        detail: "Surface what needs attention before it becomes friction.",
      },
    ],
    capabilities: [
      "Executive Briefings",
      "Business-wide Search",
      "Rapid Report Generation",
      "Board Pack Generation",
      "Workflow Execution",
      "Natural Language Business Queries",
      "Intelligent Recommendations",
    ],
  },
  {
    id: "clients-projects",
    title: "Clients & Projects",
    subtitle: "CRM, sales and delivery",
    description:
      "Run commercial pipeline and project delivery in one connected workspace—from opportunity through close-out.",
    featured: [
      {
        label: "CRM",
        detail: "Qualify demand and advance opportunities with clear ownership.",
      },
      {
        label: "Sales",
        detail: "Move commercial work from pipeline through close.",
      },
      {
        label: "Projects",
        detail: "Plan and track delivery across internal and external work.",
      },
      {
        label: "Delivery",
        detail: "Keep account and delivery teams aligned through close-out.",
      },
    ],
    capabilities: ["CRM", "Sales", "Projects", "Delivery", "Account Management", "Pipeline Tracking"],
  },
  {
    id: "financials",
    title: "Financials",
    subtitle: "Finance command centre",
    description:
      "Run the full finance stack—from ledger and payables through cashflow, forecasting and live bank connections—in one place.",
    featured: [
      {
        label: "Executive Dashboard",
        detail: "Board-ready financial visibility without spreadsheet sprawl.",
      },
      {
        label: "General Ledger",
        detail: "Keep the books of record connected to day-to-day operations.",
      },
      {
        label: "Cashflow",
        detail: "See runway, receivables and payables as one picture.",
      },
      {
        label: "Real-time Bank Connections",
        detail: "Reconcile against live bank feeds and balances.",
      },
    ],
    capabilities: [
      "Executive Dashboard",
      "General Ledger",
      "Accounts Payable",
      "Accounts Receivable",
      "Journals",
      "Expense Management",
      "Cashflow",
      "Budgeting",
      "Forecasting",
      "Multi-Currency",
      "Real-time Bank Connections",
      "Bank Reconciliation",
      "Approval Workflow Management",
    ],
  },
  {
    id: "hr-people",
    title: "HR & People",
    subtitle: "Workforce and partners",
    description:
      "Manage employees, payroll, leave, performance, recruitment, partners—and give training the prominence growing teams need.",
    featured: [
      {
        label: "Training",
        detail: "Plan learning paths and keep workforce skills current.",
      },
      {
        label: "Executive Dashboard",
        detail: "Workforce health, capacity and people signals at a glance.",
      },
      {
        label: "Employees",
        detail: "Maintain records, roles and organisational structure.",
      },
      {
        label: "Partners",
        detail: "Coordinate contractors and external people alongside staff.",
      },
    ],
    capabilities: [
      "Executive Dashboard",
      "Employees",
      "Payroll",
      "Leave Management",
      "Organisation Chart",
      "Performance",
      "Recruitment",
      "Training",
      "Partners",
    ],
  },
  {
    id: "technology-engineering",
    title: "Technology & Engineering",
    subtitle: "Technology estate and delivery",
    description:
      "Govern engineering delivery, capacity and the full technology estate—from devices and software to cloud, telecoms and reporting.",
    featured: [
      {
        label: "Executive Dashboard",
        detail: "Technology health, capacity and delivery in one view.",
      },
      {
        label: "Engineering Portfolio",
        detail: "Coordinate engineering work inside the operating platform.",
      },
      {
        label: "IT Asset Management",
        detail: "Track hardware, licences and the technology estate.",
      },
      {
        label: "Capacity Planning",
        detail: "Balance demand, utilisation and delivery capacity.",
      },
    ],
    capabilities: [
      "Executive Dashboard",
      "Engineering Portfolio",
      "Resource Utilisation",
      "Capacity Planning",
      "Infrastructure",
      "Devices",
      "Software Assets",
      "IT Asset Management",
      "Telecommunications",
      "Cloud Resources",
      "Reporting",
    ],
  },
  {
    id: "corporate",
    title: "Corporate",
    subtitle: "Governance and ownership",
    description:
      "Corporate information in one place—cap table, board, shareholders, contracts, advisors, legal, insurance and governance.",
    featured: [
      {
        label: "Cap Table Management",
        detail: "Keep ownership, equity and stakeholder records accurate.",
      },
      {
        label: "Executive Dashboard",
        detail: "Corporate structure and obligations at leadership glance.",
      },
      {
        label: "Board Management",
        detail: "Coordinate board materials, decisions and cadence.",
      },
      {
        label: "Governance",
        detail: "Keep accountability, structure and oversight clear.",
      },
    ],
    capabilities: [
      "Executive Dashboard",
      "Cap Table Management",
      "Contracts",
      "Professional Advisors",
      "Governance",
      "Legal",
      "Insurance",
      "Board Management",
      "Shareholders",
    ],
  },
  {
    id: "operations",
    title: "Operations",
    subtitle: "Assets and field operations",
    description:
      "Run assets, inventory, procurement, warehousing, logistics, fleet, maintenance and field operations from one workspace.",
    featured: [
      {
        label: "Asset Management",
        detail: "Know what you own, where it sits and who is accountable.",
      },
      {
        label: "Inventory",
        detail: "Monitor stock levels and movement across locations.",
      },
      {
        label: "Logistics",
        detail: "Coordinate shipments, transfers and operational flow.",
      },
      {
        label: "Field Operations",
        detail: "Support teams working beyond the office with live context.",
      },
    ],
    capabilities: [
      "Asset Management",
      "Inventory",
      "Procurement",
      "Warehousing",
      "Logistics",
      "Fleet",
      "Maintenance",
      "Field Operations",
    ],
  },
  {
    id: "business-productivity",
    title: "Business Productivity",
    subtitle: "Communications and information hub",
    description:
      "The central business communications and information hub—email, calendar, voice, video, documents, knowledge, social and support in one place.",
    featured: [
      {
        label: "Email",
        detail: "Operate shared inboxes in full business context.",
      },
      {
        label: "Central Document Repository",
        detail: "Keep institutional files searchable and structured.",
      },
      {
        label: "Video Meetings",
        detail: "Meet with auto transcription and shared context.",
      },
      {
        label: "Knowledge Management",
        detail: "Capture and surface how the business actually works.",
      },
    ],
    capabilities: [
      "Email",
      "Calendar",
      "Voice",
      "Video Meetings",
      "Auto Transcription",
      "External Collaboration",
      "Central Document Repository",
      "Knowledge Management",
      "Social",
      "Support Desk",
      "WhatsApp",
    ],
  },
  {
    id: "business-app-integrations",
    title: "Business App Integrations",
    subtitle: "Connect by business function",
    description:
      "Connect the specialist systems you already use—organised by business function—so Unit311 Central becomes the operating layer without rip-and-replace.",
    featured: [
      {
        label: "Project Management",
        detail: "Monday, Asana, ClickUp, Jira and more.",
      },
      {
        label: "Accounting",
        detail: "Xero, QuickBooks, Sage, NetSuite and more.",
      },
      {
        label: "CRM",
        detail: "Salesforce, HubSpot, Zoho and more.",
      },
      {
        label: "Communications",
        detail: "Teams, Slack, Zoom, WhatsApp and more.",
      },
    ],
    capabilities: [
      "Project Management",
      "Accounting",
      "CRM",
      "Communications",
      "Storage",
    ],
    integrationCategories: [
      { name: "Project Management", tools: ["Monday", "Asana", "ClickUp", "Jira"] },
      { name: "Accounting", tools: ["Xero", "QuickBooks", "Sage", "NetSuite"] },
      { name: "CRM", tools: ["Salesforce", "HubSpot", "Zoho"] },
      { name: "Communications", tools: ["Teams", "Slack", "Zoom", "WhatsApp"] },
      { name: "Storage", tools: ["Google Drive", "OneDrive", "Dropbox", "SharePoint"] },
    ],
  },
];
