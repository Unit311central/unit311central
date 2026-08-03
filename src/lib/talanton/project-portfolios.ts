/**
 * Realistic Talanton Impact internal / external project fixtures.
 */

import type { PortfolioProject } from "@/lib/project-portfolios";

function project(
  partial: Omit<PortfolioProject, "createdAt" | "updatedAt"> & {
    createdAt?: string;
    updatedAt?: string;
  },
): PortfolioProject {
  return {
    createdAt: partial.createdAt ?? "2026-02-01T09:00:00.000Z",
    updatedAt: partial.updatedAt ?? "2026-07-28T14:30:00.000Z",
    ...partial,
  };
}

export const TALANTON_INTERNAL_PROJECT_PORTFOLIO: PortfolioProject[] = [
  project({
    id: "ti-int-portfolio-reporting",
    kind: "internal",
    name: "Portfolio Reporting Enhancement",
    clientId: null,
    clientName: "Talanton Impact",
    department: "Portfolio Operations",
    site: "Nairobi · Portfolio Ops",
    region: "East Africa · HQ",
    operator: "Iris Liang",
    projectManager: "Iris Liang",
    phase: "live",
    startDate: "2026-03-01",
    endDate: "2026-10-31",
    progressPct: 62,
    budgetLabel: "$180,000",
    stakeholders: ["Impact Director", "CFO", "Board Secretary"],
    notes:
      "Unify quarterly portfolio packs, company scorecards, and LP-ready narratives across all 19 holdings.",
    milestones: [
      { id: "m1", name: "Scorecard taxonomy agreed", dueDate: "2026-03-28", status: "done" },
      { id: "m2", name: "Pilot pack (ARC Ride + Pezesha)", dueDate: "2026-05-20", status: "done" },
      { id: "m3", name: "Full portfolio roll-out", dueDate: "2026-08-15", status: "upcoming" },
      { id: "m4", name: "Board pack automation live", dueDate: "2026-10-31", status: "upcoming" },
    ],
    risks: [
      {
        id: "r1",
        title: "Late company data submissions delaying pack freeze",
        severity: "medium",
        owner: "Iris Liang",
      },
    ],
  }),
  project({
    id: "ti-int-impact-framework",
    kind: "internal",
    name: "Impact Measurement Framework",
    clientId: null,
    clientName: "Talanton Impact",
    department: "Impact",
    site: "Impact Office · Hybrid",
    region: "Group · Impact",
    operator: "Michelle Ochieng",
    projectManager: "Michelle Ochieng",
    phase: "live",
    startDate: "2026-01-20",
    endDate: "2026-09-30",
    progressPct: 54,
    budgetLabel: "$145,000",
    stakeholders: ["Impact Director", "Investment Committee", "LP Relations"],
    notes:
      "Define jobs, people served, gender, and community metrics with audit-ready definitions for every holding.",
    milestones: [
      { id: "m1", name: "Metric dictionary v1", dueDate: "2026-02-28", status: "done" },
      { id: "m2", name: "Company self-report templates", dueDate: "2026-04-30", status: "done" },
      { id: "m3", name: "Health score model locked", dueDate: "2026-07-31", status: "at-risk" },
      { id: "m4", name: "LP impact annex published", dueDate: "2026-09-30", status: "upcoming" },
    ],
    risks: [
      {
        id: "r1",
        title: "Inconsistent field definitions across agri holdings",
        severity: "high",
        owner: "Michelle Ochieng",
      },
    ],
  }),
  project({
    id: "ti-int-board-governance",
    kind: "internal",
    name: "Board Governance Digitization",
    clientId: null,
    clientName: "Talanton Impact",
    department: "Governance",
    site: "Board Portal",
    region: "Group · Governance",
    operator: "Andy Moore",
    projectManager: "Andy Moore",
    phase: "upcoming",
    startDate: "2026-08-01",
    endDate: "2026-12-15",
    progressPct: 18,
    budgetLabel: "$95,000",
    stakeholders: ["Board Chair", "Company Secretary", "Impact Director"],
    notes: "Digitise board packs, minutes search, and risk register workflows for Talanton Board.",
    milestones: [
      { id: "m1", name: "Portal UX review", dueDate: "2026-08-20", status: "upcoming" },
      { id: "m2", name: "Pack section templates", dueDate: "2026-09-30", status: "upcoming" },
    ],
    risks: [
      {
        id: "r1",
        title: "Director adoption of digital pack review",
        severity: "low",
        owner: "Andy Moore",
      },
    ],
  }),
];

export const TALANTON_EXTERNAL_PROJECT_PORTFOLIO: PortfolioProject[] = [
  project({
    id: "ti-ext-arc-ride",
    kind: "external",
    name: "ARC Ride Expansion Support",
    clientId: "ti-cli-arc-ride",
    clientName: "ARC Ride",
    site: "Nairobi · Swap hubs",
    region: "Kenya",
    operator: "James Kariuki",
    projectManager: "Iris Liang",
    accountManager: "Iris Liang",
    phase: "live",
    startDate: "2026-02-15",
    endDate: "2026-11-30",
    progressPct: 48,
    budgetLabel: "$220,000",
    contractValueLabel: "$220,000",
    deliveryStatus: "On track",
    billingStatus: "Milestone billing",
    customerContacts: ["James Kariuki"],
    notes:
      "Talanton value-add support for battery swap hub expansion, technician pathway, and city permit coordination.",
    milestones: [
      { id: "m1", name: "Hub site shortlist", dueDate: "2026-03-31", status: "done" },
      { id: "m2", name: "Two new hubs live", dueDate: "2026-06-30", status: "done" },
      { id: "m3", name: "Technician cohort #3 graduate", dueDate: "2026-09-15", status: "upcoming" },
      { id: "m4", name: "Expansion review with IC", dueDate: "2026-11-30", status: "upcoming" },
    ],
    risks: [
      {
        id: "r1",
        title: "Municipal permit delays in peri-urban wards",
        severity: "medium",
        owner: "James Kariuki",
      },
    ],
  }),
  project({
    id: "ti-ext-healthcare-review",
    kind: "external",
    name: "Healthcare Portfolio Review",
    clientId: "ti-cli-pharmakina",
    clientName: "Pharmakina",
    site: "Bukavu · Manufacturing",
    region: "DRC / Kenya",
    operator: "Jean Mukendi",
    projectManager: "Michelle Ochieng",
    accountManager: "Michelle Ochieng",
    phase: "live",
    startDate: "2026-04-01",
    endDate: "2026-09-15",
    progressPct: 41,
    budgetLabel: "$160,000",
    contractValueLabel: "$160,000",
    deliveryStatus: "Watch",
    billingStatus: "Retainer",
    customerContacts: ["Jean Mukendi", "Fatima Diallo"],
    notes:
      "Cross-holding healthcare review covering Pharmakina and OWP Pharmaceuticals: quality systems, jobs, and community reach.",
    milestones: [
      { id: "m1", name: "Baseline impact & ops audit", dueDate: "2026-05-15", status: "done" },
      { id: "m2", name: "Joint risk register", dueDate: "2026-07-01", status: "done" },
      { id: "m3", name: "Board healthcare brief", dueDate: "2026-08-20", status: "at-risk" },
      { id: "m4", name: "Action plan lock", dueDate: "2026-09-15", status: "upcoming" },
    ],
    risks: [
      {
        id: "r1",
        title: "Supply-chain FX pressure on API imports",
        severity: "high",
        owner: "Jean Mukendi",
      },
    ],
  }),
  project({
    id: "ti-ext-poa-connectivity",
    kind: "external",
    name: "poa! Internet Community Reach Programme",
    clientId: "ti-cli-poa-internet",
    clientName: "poa! Internet",
    site: "Nairobi · Network ops",
    region: "Kenya",
    operator: "Nancy Wanjiku",
    projectManager: "Andy Moore",
    accountManager: "Andy Moore",
    phase: "upcoming",
    startDate: "2026-08-10",
    endDate: "2027-02-28",
    progressPct: 12,
    budgetLabel: "$135,000",
    contractValueLabel: "$135,000",
    deliveryStatus: "Scheduled",
    billingStatus: "Not started",
    customerContacts: ["Nancy Wanjiku"],
    notes: "Support community Wi-Fi expansion measurement and LP storytelling for connectivity impact.",
    milestones: [
      { id: "m1", name: "Baseline people-served census", dueDate: "2026-09-30", status: "upcoming" },
      { id: "m2", name: "Impact dashboard live", dueDate: "2026-12-15", status: "upcoming" },
    ],
    risks: [
      {
        id: "r1",
        title: "Spectrum / last-mile partner capacity",
        severity: "medium",
        owner: "Nancy Wanjiku",
      },
    ],
  }),
];
