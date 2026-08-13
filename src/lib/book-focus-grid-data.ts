export type BookFocusGridEntry =
  | { kind: "item"; label: string }
  | { kind: "subheader"; label: string };

export type BookFocusGridColumn = {
  title: string;
  tone: "sky" | "emerald";
  items: readonly BookFocusGridEntry[];
};

export const BOOK_FOCUS_GRID_ROW_1: readonly BookFocusGridColumn[] = [
  {
    title: "HOME & GENERAL",
    tone: "sky",
    items: [
      { kind: "item", label: "Home Dashboard" },
      { kind: "item", label: "Onboarding" },
      { kind: "item", label: "Platform Security" },
    ],
  },
  {
    title: "BUSINESS CENTRAL",
    tone: "sky",
    items: [
      { kind: "item", label: "Dashboard" },
      { kind: "item", label: "Clients - Dashboard" },
      { kind: "item", label: "Clients - Client Directory" },
      { kind: "item", label: "CRM – Pipeline" },
      { kind: "item", label: "CRM - Client Onboarding" },
      { kind: "item", label: "Partners" },
      { kind: "item", label: "Grants" },
    ],
  },
  {
    title: "AI INTELLIGENCE",
    tone: "sky",
    items: [
      { kind: "item", label: "Dashboard" },
      { kind: "item", label: "Specific Intelligence" },
      { kind: "item", label: "Regulatory Intelligence" },
      { kind: "item", label: "Impact Intelligence" },
      { kind: "item", label: "Competitor Intelligence" },
    ],
  },
  {
    title: "FINANCIALS",
    tone: "emerald",
    items: [
      { kind: "item", label: "Dashboard" },
      { kind: "item", label: "General Ledger" },
      { kind: "item", label: "Accounts Receivable" },
      { kind: "item", label: "Accounts Payable" },
      { kind: "item", label: "Expense Mgmt" },
      { kind: "item", label: "Bank Integrations" },
    ],
  },
  {
    title: "FUNDRAISING",
    tone: "sky",
    items: [
      { kind: "item", label: "Dashboard" },
      { kind: "item", label: "Cap Table Mgmt" },
      { kind: "item", label: "Investors" },
      { kind: "item", label: "Pipeline" },
      { kind: "item", label: "Meetings" },
      { kind: "item", label: "Pitch deck" },
      { kind: "item", label: "Data rooms" },
    ],
  },
  {
    title: "BOARD",
    tone: "emerald",
    items: [
      { kind: "item", label: "Dashboard" },
      { kind: "item", label: "Meetings" },
      { kind: "item", label: "Decks" },
      { kind: "item", label: "Minutes & Actions" },
      { kind: "item", label: "Risk Register" },
      { kind: "item", label: "Board Members" },
      { kind: "item", label: "External Board Portal" },
    ],
  },
  {
    title: "CORPORATE INFORMATION",
    tone: "sky",
    items: [
      { kind: "item", label: "Dashboard" },
      { kind: "item", label: "Company details" },
      { kind: "item", label: "Bank Accounts" },
      { kind: "item", label: "Professional Advisors" },
      { kind: "item", label: "Contracts" },
      { kind: "item", label: "IP / Patents – Dashboard" },
      { kind: "item", label: "IP / Patents – Portfolio" },
    ],
  },
  {
    title: "OPERATIONS",
    tone: "sky",
    items: [
      { kind: "item", label: "Dashboard" },
      { kind: "item", label: "Assets" },
      { kind: "item", label: "Inventory" },
      { kind: "item", label: "Procurement" },
      { kind: "item", label: "Logistics" },
    ],
  },
  {
    title: "MARKETING & EVENTS",
    tone: "sky",
    items: [
      { kind: "item", label: "Dashboard" },
      { kind: "item", label: "Social Media Mgmt" },
      { kind: "item", label: "Digital Newsletter" },
      { kind: "item", label: "External Events" },
      { kind: "item", label: "Event Mgmt" },
      { kind: "item", label: "Mailing List Mgmt" },
      { kind: "item", label: "Field Stories" },
    ],
  },
  {
    title: "TECHNOLOGY MANAGEMENT",
    tone: "sky",
    items: [
      { kind: "item", label: "Dashboard" },
      { kind: "item", label: "Devices" },
      { kind: "item", label: "Software & SaaS" },
      { kind: "item", label: "Telecommunications" },
      { kind: "item", label: "Technology Assets" },
      { kind: "item", label: "Reports" },
    ],
  },
];

export const BOOK_FOCUS_GRID_ROW_2: readonly BookFocusGridColumn[] = [
  {
    title: "HUMAN RESOURCES",
    tone: "emerald",
    items: [
      { kind: "item", label: "Dashboard & Reports" },
      { kind: "item", label: "Employees" },
      { kind: "item", label: "Org Chart" },
      { kind: "item", label: "Recruitment" },
      { kind: "item", label: "Time & Attendance" },
      { kind: "item", label: "Payroll" },
      { kind: "item", label: "Performance" },
    ],
  },
  {
    title: "BUS PROD",
    tone: "sky",
    items: [
      { kind: "item", label: "Dashboard" },
      { kind: "item", label: "File Repository" },
      { kind: "item", label: "Email Integration" },
      { kind: "item", label: "Calendars" },
      { kind: "item", label: "Messaging" },
      { kind: "item", label: "Communications" },
      { kind: "item", label: "Whiteboard" },
    ],
  },
  {
    title: "SUPPORT DESK",
    tone: "emerald",
    items: [
      { kind: "item", label: "Overview" },
      { kind: "item", label: "Tickets" },
      { kind: "item", label: "My Tickets" },
      { kind: "item", label: "WhatsApp Integration" },
    ],
  },
  {
    title: "PROJECT MANAGEMENT",
    tone: "sky",
    items: [
      { kind: "item", label: "Dashboard" },
      { kind: "item", label: "Internal Projects" },
      { kind: "item", label: "External Projects" },
    ],
  },
  {
    title: "ENGINEERING",
    tone: "emerald",
    items: [
      { kind: "item", label: "Overview" },
      { kind: "item", label: "Programme Mgmt" },
      { kind: "item", label: "Team Capacity" },
      { kind: "item", label: "Utilisation Mgmt" },
      { kind: "item", label: "Assurance & Certification" },
      { kind: "item", label: "Engineering Risks" },
    ],
  },
  {
    title: "TRAINING",
    tone: "emerald",
    items: [
      { kind: "item", label: "Dashboard" },
      { kind: "item", label: "Courses - Staff courses" },
      { kind: "item", label: "Courses - Client courses" },
      { kind: "item", label: "Courses - QMS courses" },
      { kind: "item", label: "Auto Generate Courses" },
      { kind: "item", label: "Learning Library" },
    ],
  },
  {
    title: "QMS",
    tone: "emerald",
    items: [
      { kind: "item", label: "Dashboard" },
      { kind: "item", label: "Doc control" },
      { kind: "item", label: "CAPA" },
      { kind: "item", label: "Audits" },
      { kind: "item", label: "Mgmt Review" },
      { kind: "item", label: "Reporting" },
    ],
  },
  {
    title: "TOOLS",
    tone: "emerald",
    items: [
      { kind: "item", label: "Website Mgmt" },
      { kind: "item", label: "Integrations" },
    ],
  },
  {
    title: "EXTERNAL MGMT",
    tone: "emerald",
    items: [
      { kind: "item", label: "Dashboard" },
      { kind: "item", label: "External Mgmt" },
      { kind: "item", label: "External Client Portals" },
    ],
  },
  {
    title: "SETTINGS",
    tone: "sky",
    items: [
      { kind: "item", label: "Role Mgmt" },
      { kind: "item", label: "Access and Permissions" },
      { kind: "item", label: "General" },
      { kind: "item", label: "Billing Mgmt" },
      { kind: "item", label: "Appearance" },
    ],
  },
];

/** Stacked under HOME & GENERAL on module review (column 1). */
export const MODULE_REVIEW_EXECUTIVE_ASSISTANT_COLUMN: BookFocusGridColumn = {
  title: "EXECUTIVE ASSISTANT",
  tone: "sky",
  items: [{ kind: "item", label: "AI Executive Assistant" }],
};

export const BOOK_FOCUS_GRID_ROWS: readonly (readonly BookFocusGridColumn[])[] = [
  BOOK_FOCUS_GRID_ROW_1,
  BOOK_FOCUS_GRID_ROW_2,
];

export function bookFocusItemKey(columnTitle: string, itemLabel: string) {
  return `${columnTitle}::${itemLabel}`;
}

export function getAllBookFocusItemKeys(): string[] {
  const keys: string[] = [];
  for (const row of BOOK_FOCUS_GRID_ROWS) {
    for (const column of row) {
      for (const entry of column.items) {
        if (entry.kind === "item") {
          keys.push(bookFocusItemKey(column.title, entry.label));
        }
      }
    }
  }
  for (const entry of MODULE_REVIEW_EXECUTIVE_ASSISTANT_COLUMN.items) {
    if (entry.kind === "item") {
      keys.push(
        bookFocusItemKey(MODULE_REVIEW_EXECUTIVE_ASSISTANT_COLUMN.title, entry.label),
      );
    }
  }
  return keys;
}
