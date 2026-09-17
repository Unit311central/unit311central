import type { IntelligenceRecord } from "@/lib/intelligence/types";
import { ABHI_SLUG } from "@/lib/abhi-surface";

const SLUG = ABHI_SLUG;

export function abhiCompanyIntelligenceRecords(): IntelligenceRecord[] {
  return [
    {
      id: "abhi-ci-membership-ytd",
      workspaceSlug: SLUG,
      domainId: "company-intelligence",
      title: "Membership revenue YTD",
      summary:
        "£2.0M membership and services income recognised through August · renewals pipeline healthy ahead of MedTech Expo.",
      severity: "low",
      categories: [{ id: "financial", label: "Financial" }],
      tags: [{ id: "membership", label: "Membership" }],
      entityRefs: [],
    },
    {
      id: "abhi-ci-programmes",
      workspaceSlug: SLUG,
      domainId: "company-intelligence",
      title: "Programme delivery",
      summary:
        "US & Middle East accelerators on schedule · 12 working groups active with 94% session attendance.",
      severity: "low",
      categories: [{ id: "programmes", label: "Programmes" }],
      tags: [{ id: "accelerator", label: "Accelerator" }],
      entityRefs: [],
    },
    {
      id: "abhi-ci-renewals",
      workspaceSlug: SLUG,
      domainId: "company-intelligence",
      title: "Renewal concentration Q4",
      summary:
        "38 corporate renewals due in the next 90 days · member intelligence flags 6 accounts for executive outreach.",
      severity: "medium",
      categories: [{ id: "commercial", label: "Commercial" }],
      tags: [{ id: "renewals", label: "Renewals" }],
      entityRefs: [],
    },
    {
      id: "abhi-ci-governance",
      workspaceSlug: SLUG,
      domainId: "company-intelligence",
      title: "Board & governance cadence",
      summary:
        "Next board meeting scheduled · risk register shows two medium items with mitigations in progress.",
      severity: "low",
      categories: [{ id: "governance", label: "Governance" }],
      tags: [{ id: "board", label: "Board" }],
      entityRefs: [],
    },
    {
      id: "abhi-ci-events",
      workspaceSlug: SLUG,
      domainId: "company-intelligence",
      title: "Events & advocacy pipeline",
      summary:
        "UK Pavilion and MedTech Expo preparations on track · delegate registrations 12% above last year.",
      severity: "info",
      categories: [{ id: "events", label: "Events" }],
      tags: [{ id: "medtech", label: "MedTech Expo" }],
      entityRefs: [],
    },
  ];
}

export function abhiMarketIntelligenceRecords(): IntelligenceRecord[] {
  return [
    {
      id: "abhi-mi-diagnostics",
      workspaceSlug: SLUG,
      domainId: "market-intelligence",
      title: "UK diagnostics sector growth",
      summary:
        "NHS elective recovery and IVD innovation funding driving 6–8% sector growth · SMEs gaining share in point-of-care.",
      severity: "medium",
      categories: [{ id: "sector", label: "Sector" }],
      tags: [{ id: "diagnostics", label: "Diagnostics" }],
      entityRefs: [],
    },
    {
      id: "abhi-mi-regulatory",
      workspaceSlug: SLUG,
      domainId: "market-intelligence",
      title: "MHRA reform timeline",
      summary:
        "Updated UK medical device regulations entering consultation · members should review QMS transition plans.",
      severity: "high",
      categories: [{ id: "regulatory", label: "Regulatory" }],
      tags: [{ id: "mhra", label: "MHRA" }],
      entityRefs: [],
    },
    {
      id: "abhi-mi-competition",
      workspaceSlug: SLUG,
      domainId: "market-intelligence",
      title: "Trade association landscape",
      summary:
        "Peer associations expanding digital health programmes · ABHI differentiation strong on export advocacy.",
      severity: "low",
      categories: [{ id: "competitive", label: "Competitive" }],
      tags: [{ id: "advocacy", label: "Advocacy" }],
      entityRefs: [],
    },
    {
      id: "abhi-mi-export",
      workspaceSlug: SLUG,
      domainId: "market-intelligence",
      title: "US & GCC export demand",
      summary:
        "US hospital capital budgets stabilising · GCC health-tech procurement up ahead of regional expos.",
      severity: "medium",
      categories: [{ id: "export", label: "Export" }],
      tags: [{ id: "us", label: "United States" }],
      entityRefs: [],
    },
    {
      id: "abhi-mi-investment",
      workspaceSlug: SLUG,
      domainId: "market-intelligence",
      title: "Health-tech investment sentiment",
      summary:
        "Venture activity recovering in digital health · members reporting longer diligence cycles on Series A.",
      severity: "medium",
      categories: [{ id: "investment", label: "Investment" }],
      tags: [{ id: "funding", label: "Funding" }],
      entityRefs: [],
    },
  ];
}
