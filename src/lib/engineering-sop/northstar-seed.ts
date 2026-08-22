import { createSeedEngineeringSops, type EngSop } from "@/lib/engineering-sop-data";

const PERSONNEL = {
  owner: "Jordan Blake",
  approver: "Paul Fotheringham (CTO)",
  ops: "Engineering Operations",
  security: "Alex Chen",
  qa: "Morgan Patel",
} as const;

export function buildNorthstarEngineeringSopCatalogue(): EngSop[] {
  const base = createSeedEngineeringSops();
  const templates: EngSop[] = [
    "Production Release",
    "Incident Response",
    "Secure Code Review",
    "Backup & Recovery",
    "Change Management",
  ].map((title, index) => ({
    id: `ns-tpl-${index + 1}`,
    number: `TPL-ENG-${String(index + 1).padStart(3, "0")}`,
    title,
    version: "1.0",
    status: "Approved" as const,
    category: "Template",
    owner: PERSONNEL.ops,
    approver: PERSONNEL.approver,
    audience: "internal" as const,
    effectiveDate: "2026-01-01",
    reviewDate: "2027-01-01",
    summary: `Template for ${title.toLowerCase()}.`,
    tags: ["template"],
    sections: base[0]!.sections.slice(0, 1),
    workflow: { pendingApprovals: [], lastReviewedBy: null, aiAssistEnabled: true },
    isTemplate: true,
    supersedesId: null,
    createdAt: "2026-01-01T09:00:00.000Z",
    updatedAt: "2026-01-01T09:00:00.000Z",
  }));

  const extras: EngSop[] = [
    {
      ...base[0]!,
      id: "ns-sop-retired",
      number: "SOP-ENG-050",
      title: "Software Deployment (Legacy)",
      status: "Retired",
      category: "Release",
      owner: PERSONNEL.ops,
    },
    {
      ...base[1]!,
      id: "ns-sop-review",
      title: "Security Incident Response",
      status: "In Review",
      category: "Security",
      owner: PERSONNEL.security,
    },
    {
      ...base[2]!,
      id: "ns-sop-draft",
      number: "SOP-ENG-060",
      title: "Hardware Bring-up Checklist",
      status: "Draft",
      category: "Hardware",
      owner: PERSONNEL.qa,
    },
    {
      ...base[0]!,
      id: "ns-sop-qa",
      number: "SOP-ENG-070",
      title: "Design Verification Test Protocol",
      status: "Approved",
      category: "Quality",
      owner: PERSONNEL.qa,
    },
    {
      ...base[0]!,
      id: "ns-sop-infra",
      number: "SOP-ENG-080",
      title: "Infrastructure Patching Window",
      status: "Approved",
      category: "Operations",
      owner: PERSONNEL.ops,
    },
    {
      ...base[0]!,
      id: "ns-sop-onboard",
      number: "SOP-ENG-090",
      title: "Engineer Onboarding",
      status: "Approved",
      category: "People",
      owner: PERSONNEL.ops,
    },
  ];

  return [...base, ...extras, ...templates];
}
