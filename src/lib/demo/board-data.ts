/**
 * Northstar Demo — generic board governance data (not ABHI/Talanton/OA).
 */

export type DemoBoardMeeting = {
  id: string;
  title: string;
  date: string;
  status: "completed" | "scheduled" | "draft";
  location: string;
  agenda: string[];
  decisions: string[];
  minutesSummary: string;
  packAvailable: boolean;
};

export type DemoBoardAction = {
  id: string;
  meetingId: string;
  title: string;
  owner: string;
  dueDate: string;
  status: "open" | "in_progress" | "closed";
  priority: "high" | "medium" | "low";
};

export type DemoBoardRisk = {
  id: string;
  title: string;
  rating: "Critical" | "High" | "Medium" | "Low";
  owner: string;
  mitigation: string;
  trend: "up" | "stable" | "down";
};

export const NORTHSTAR_BOARD_MEETINGS: readonly DemoBoardMeeting[] = [
  {
    id: "bm-2025-09",
    title: "Board Meeting — Growth Round Approval",
    date: "2025-09-18",
    status: "completed",
    location: "Manchester HQ",
    agenda: [
      "Approve £2m growth round term sheet",
      "US expansion hiring plan",
      "Atlas programme status",
      "Supplier concentration review",
    ],
    decisions: [
      "Approved growth round subject to final legal docs",
      "Authorised US sales hire plan (2 FTE Austin)",
      "Deferred Atlas GA to Q1 2026",
    ],
    minutesSummary:
      "Board approved the growth round and US expansion plan. Atlas delay acknowledged; CTO to present supplier diversification plan next meeting.",
    packAvailable: true,
  },
  {
    id: "bm-2025-11",
    title: "Board Meeting — Q3 Review",
    date: "2025-11-14",
    status: "completed",
    location: "Manchester HQ / video",
    agenda: [
      "Q3 financial results",
      "Meridian expansion contract",
      "Voltex supply delay impact",
      "Margin recovery actions",
    ],
    decisions: [
      "Approved Q4 opex freeze on non-critical hires",
      "Meridian QBR to be monthly until Atlas stabilises",
      "Engage backup supplier for edge controllers",
    ],
    minutesSummary:
      "Revenue ahead of plan but margin compressed. Voltex delays cited as primary delivery risk. CFO to model margin recovery scenarios.",
    packAvailable: true,
  },
  {
    id: "bm-2026-01",
    title: "Board Meeting — Annual & 2026 Budget",
    date: "2026-01-16",
    status: "completed",
    location: "Manchester HQ",
    agenda: [
      "2025 annual results",
      "2026 budget (£5.2m revenue target)",
      "Board committee updates",
      "Risk register refresh",
    ],
    decisions: [
      "Approved 2026 budget",
      "Approved Meridian executive QBR cadence",
      "Risk: supplier concentration elevated to High",
    ],
    minutesSummary:
      "Strong Dec 2025 close. 2026 budget approved with focus on margin recovery and controlled US burn.",
    packAvailable: true,
  },
  {
    id: "bm-2026-03",
    title: "Board Meeting — Q1 2026 Review",
    date: "2026-03-20",
    status: "scheduled",
    location: "Manchester HQ",
    agenda: [
      "Margin recovery progress",
      "Cash runway & AR ageing",
      "Atlas go-live readiness",
      "US pipeline update",
      "People: open roles & PIP status",
    ],
    decisions: [],
    minutesSummary: "Agenda circulated. Pack draft under CFO review.",
    packAvailable: true,
  },
];

export const NORTHSTAR_BOARD_ACTIONS: readonly DemoBoardAction[] = [
  {
    id: "act-1",
    meetingId: "bm-2025-11",
    title: "Present supplier diversification plan",
    owner: "James Okonkwo",
    dueDate: "2025-12-15",
    status: "closed",
    priority: "high",
  },
  {
    id: "act-2",
    meetingId: "bm-2025-11",
    title: "Model US unit economics for board",
    owner: "Priya Shah",
    dueDate: "2026-01-10",
    status: "closed",
    priority: "high",
  },
  {
    id: "act-3",
    meetingId: "bm-2026-01",
    title: "Schedule monthly Meridian QBR",
    owner: "Elena Hart",
    dueDate: "2026-02-01",
    status: "closed",
    priority: "medium",
  },
  {
    id: "act-4",
    meetingId: "bm-2026-01",
    title: "Complete Atlas UAT sign-off",
    owner: "James Okonkwo",
    dueDate: "2026-03-01",
    status: "in_progress",
    priority: "high",
  },
  {
    id: "act-5",
    meetingId: "bm-2026-01",
    title: "Review AR >60 days ageing",
    owner: "Priya Shah",
    dueDate: "2026-03-15",
    status: "open",
    priority: "high",
  },
  {
    id: "act-6",
    meetingId: "bm-2026-03",
    title: "Present margin recovery dashboard",
    owner: "Priya Shah",
    dueDate: "2026-03-18",
    status: "open",
    priority: "high",
  },
  {
    id: "act-7",
    meetingId: "bm-2026-03",
    title: "US pipeline forecast for board",
    owner: "Marcus Reed",
    dueDate: "2026-03-18",
    status: "open",
    priority: "medium",
  },
  {
    id: "act-8",
    meetingId: "bm-2025-09",
    title: "Finalize growth round legal docs",
    owner: "Elena Hart",
    dueDate: "2025-10-01",
    status: "closed",
    priority: "high",
  },
  {
    id: "act-9",
    meetingId: "bm-2025-09",
    title: "Approve Austin office lease terms",
    owner: "Marcus Reed",
    dueDate: "2025-10-15",
    status: "closed",
    priority: "medium",
  },
  {
    id: "act-10",
    meetingId: "bm-2026-01",
    title: "Update ISO 9001 surveillance schedule",
    owner: "Marcus Reed",
    dueDate: "2026-02-28",
    status: "in_progress",
    priority: "low",
  },
  {
    id: "act-11",
    meetingId: "bm-2026-03",
    title: "Brief board on Harbor Forge churn lessons",
    owner: "Elena Hart",
    dueDate: "2026-03-20",
    status: "open",
    priority: "low",
  },
  {
    id: "act-12",
    meetingId: "bm-2026-03",
    title: "Confirm backup supplier MOU with Siemens Industrial",
    owner: "James Okonkwo",
    dueDate: "2026-04-01",
    status: "open",
    priority: "medium",
  },
];

export const NORTHSTAR_BOARD_RISKS: readonly DemoBoardRisk[] = [
  {
    id: "risk-1",
    title: "Supplier concentration — Voltex Automation",
    rating: "High",
    owner: "James Okonkwo",
    mitigation: "Qualify Siemens Industrial as secondary source; safety stock policy",
    trend: "stable",
  },
  {
    id: "risk-2",
    title: "Atlas programme delay / reputational impact",
    rating: "High",
    owner: "Marcus Reed",
    mitigation: "Weekly steering with Meridian; phased go-live plan",
    trend: "down",
  },
  {
    id: "risk-3",
    title: "US expansion burn vs margin",
    rating: "Medium",
    owner: "Priya Shah",
    mitigation: "Monthly US P&L review; hiring gated on pipeline conversion",
    trend: "up",
  },
  {
    id: "risk-4",
    title: "Key-person dependency — CTO",
    rating: "Medium",
    owner: "Elena Hart",
    mitigation: "Deputy engineering lead programme; documentation sprint",
    trend: "stable",
  },
  {
    id: "risk-5",
    title: "Meridian revenue concentration (~22% ARR)",
    rating: "Medium",
    owner: "Elena Hart",
    mitigation: "Diversify enterprise pipeline; US/EU expansion",
    trend: "stable",
  },
  {
    id: "risk-6",
    title: "Cyber / IoT device security incident",
    rating: "Medium",
    owner: "James Okonkwo",
    mitigation: "ISO 27001 internal audit; pen test Q2",
    trend: "stable",
  },
  {
    id: "risk-7",
    title: "FX exposure on USD receivables",
    rating: "Low",
    owner: "Priya Shah",
    mitigation: "Natural hedge via US opex; forward cover policy review",
    trend: "stable",
  },
  {
    id: "risk-8",
    title: "Regulatory — EU machinery directive updates",
    rating: "Low",
    owner: "Marcus Reed",
    mitigation: "Monitor EU consultation; compliance workstream",
    trend: "up",
  },
  {
    id: "risk-9",
    title: "Talent retention in Bristol R&D",
    rating: "Medium",
    owner: "HR",
    mitigation: "Comp bench review; graduate programme",
    trend: "stable",
  },
  {
    id: "risk-10",
    title: "Competitor pricing pressure — SensorForge",
    rating: "Medium",
    owner: "Sales",
    mitigation: "Value-based selling; monitoring intelligence",
    trend: "up",
  },
  {
    id: "risk-11",
    title: "Cash collection — AR >60 days",
    rating: "Medium",
    owner: "Priya Shah",
    mitigation: "Collections sprint; credit terms review",
    trend: "down",
  },
  {
    id: "risk-12",
    title: "Quality escape — support engineer PIP",
    rating: "Low",
    owner: "Marcus Reed",
    mitigation: "CAPA process; additional QA checkpoint",
    trend: "down",
  },
  {
    id: "risk-13",
    title: "Brexit/customs delays on EU shipments",
    rating: "Low",
    owner: "Operations",
    mitigation: "DHL contract review; EU stock buffer",
    trend: "stable",
  },
  {
    id: "risk-14",
    title: "Patent dispute — legacy competitor claim",
    rating: "Low",
    owner: "Legal",
    mitigation: "Ashford Lane assessment; no material exposure identified",
    trend: "stable",
  },
  {
    id: "risk-15",
    title: "Insurance renewal — D&O premium increase",
    rating: "Low",
    owner: "Priya Shah",
    mitigation: "Broker RFP; board approval at March meeting",
    trend: "up",
  },
];

export const NORTHSTAR_BOARD_DIRECTORS = [
  { id: "dir-ceo", name: "Elena Hart", role: "Chief Executive Officer", type: "Executive" as const },
  { id: "dir-cto", name: "James Okonkwo", role: "Chief Technology Officer", type: "Executive" as const },
  { id: "dir-chair", name: "Sarah Pemberton", role: "Chair", type: "Non-Executive" as const },
  { id: "dir-ned-1", name: "David Chen", role: "Non-Executive Director", type: "Investor" as const },
  { id: "dir-ned-2", name: "Amira Hassan", role: "Non-Executive Director", type: "Independent" as const },
];
