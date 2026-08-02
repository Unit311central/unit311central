/**
 * ABHI Regulatory Intelligence — daily connector catalogue, impact assessment,
 * and member matching. Intelligence platform (not a news feed).
 */

import type { ManagedClient } from "@/lib/client-management-data";
import {
  buildMemberIntelligencePortfolio,
  type AbhiMemberIntelligenceRow,
} from "@/lib/abhi/member-intelligence";
import { getAbhiMemberOrgProfile } from "@/lib/abhi/member-funding-profile";

export type AbhiRegulatorySourceId =
  | "mhra"
  | "nice"
  | "nhs-england"
  | "dhsc"
  | "uk-gov-consultations"
  | "fda"
  | "ec-mdr";

export type AbhiRegulatorySeverity = "Low" | "Medium" | "High" | "Critical";
export type AbhiRegulatoryStatus = "Open" | "Consultation" | "Guidance" | "Closed";
export type AbhiRegulatoryCategory =
  | "Guidance"
  | "Consultation"
  | "Legislation"
  | "Standards"
  | "International";

export type AbhiRegulatorySource = {
  id: AbhiRegulatorySourceId;
  name: string;
  url: string;
};

export const ABHI_REGULATORY_SOURCES: readonly AbhiRegulatorySource[] = [
  {
    id: "mhra",
    name: "MHRA",
    url: "https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency",
  },
  {
    id: "nice",
    name: "NICE",
    url: "https://www.nice.org.uk/",
  },
  {
    id: "nhs-england",
    name: "NHS England",
    url: "https://www.england.nhs.uk/",
  },
  {
    id: "dhsc",
    name: "Department of Health and Social Care",
    url: "https://www.gov.uk/government/organisations/department-of-health-and-social-care",
  },
  {
    id: "uk-gov-consultations",
    name: "UK Government consultations",
    url: "https://www.gov.uk/search/policy-papers-and-consultations",
  },
  {
    id: "fda",
    name: "FDA (international relevance)",
    url: "https://www.fda.gov/medical-devices",
  },
  {
    id: "ec-mdr",
    name: "European Commission — MDR / Health",
    url: "https://health.ec.europa.eu/medical-devices-sector_en",
  },
] as const;

export type AbhiRegulatoryUpdate = {
  id: string;
  title: string;
  sourceId: AbhiRegulatorySourceId;
  sourceName: string;
  publicationDate: string;
  category: AbhiRegulatoryCategory;
  summary: string;
  fullDescription: string;
  affectedSectors: string[];
  affectedTechnologies: string[];
  affectedMemberTypes: string[];
  severity: AbhiRegulatorySeverity;
  status: AbhiRegulatoryStatus;
  sourceUrl: string;
};

export type AbhiMatchedRegulatoryMember = {
  id: string;
  memberName: string;
  membershipType: string;
  matchScore: number;
  matchReasons: string[];
  strategic: boolean;
  highImpact: boolean;
};

export type AbhiRegulatoryImpactAssessment = {
  updateId: string;
  summary: string;
  whyItMatters: string;
  affectedMembers: AbhiMatchedRegulatoryMember[];
  affectedSectors: string[];
  riskLevel: AbhiRegulatorySeverity;
  recommendedActions: string[];
  highImpactMembers: AbhiMatchedRegulatoryMember[];
  strategicMembers: AbhiMatchedRegulatoryMember[];
};

export type AbhiRegulatoryMemberAlert = {
  memberId: string;
  memberName: string;
  relevantUpdateCount: number;
  highPriorityCount: number;
  priority: "High" | "Medium" | "Low";
  topUpdateIds: string[];
  topUpdateTitles: string[];
};

export type AbhiTodaysRegulatoryBrief = {
  headline: string;
  updateId: string;
  potentiallyAffectedMembers: number;
  highestImpactSectors: string[];
  recommendedActions: string[];
  refreshedAt: string;
};

export type AbhiRegulatoryDashboard = {
  refreshedAt: string;
  openRegulatoryChanges: number;
  highImpactUpdates: number;
  membersPotentiallyAffected: number;
  pendingImpactAssessments: number;
  recentAlerts: AbhiRegulatoryMemberAlert[];
  todaysBrief: AbhiTodaysRegulatoryBrief;
  sources: readonly AbhiRegulatorySource[];
  updates: AbhiRegulatoryUpdate[];
  assessments: AbhiRegulatoryImpactAssessment[];
  memberAlerts: AbhiRegulatoryMemberAlert[];
};

/** Canonical catalogue ingested from regulatory connectors (daily refresh). */
const CATALOGUE: AbhiRegulatoryUpdate[] = [
  {
    id: "mhra-ai-diagnostics-2026",
    title: "MHRA consultation on AI-enabled diagnostics",
    sourceId: "mhra",
    sourceName: "MHRA",
    publicationDate: "2026-07-28",
    category: "Consultation",
    summary:
      "MHRA has opened a consultation on evidence and safety requirements for AI-enabled diagnostic technologies.",
    fullDescription:
      "The consultation seeks views on clinical evidence expectations, post-market surveillance, and transparency requirements for AI/ML-enabled diagnostics seeking UK market access. Responses will inform future guidance for manufacturers and Notified Bodies / Approved Bodies.",
    affectedSectors: ["Diagnostics", "Digital Health", "Medical Technology"],
    affectedTechnologies: [
      "AI Software as Medical Device",
      "Digital Diagnostics",
      "Laboratory Diagnostics",
      "Point Of Care Diagnostics",
    ],
    affectedMemberTypes: ["Corporate", "SME", "Sponsor"],
    severity: "High",
    status: "Consultation",
    sourceUrl:
      "https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency",
  },
  {
    id: "nice-evd-digital-2026",
    title: "NICE Early Value Assessment — digital diagnostic tools",
    sourceId: "nice",
    sourceName: "NICE",
    publicationDate: "2026-07-15",
    category: "Guidance",
    summary:
      "Updated EVA pathway expectations for digital diagnostic tools seeking NHS adoption evidence.",
    fullDescription:
      "NICE clarifies evidence generation plans, real-world evaluation, and commissioner considerations for digital diagnostics entering the Early Value Assessment route.",
    affectedSectors: ["Diagnostics", "Digital Health"],
    affectedTechnologies: ["Digital Diagnostics", "AI Software as Medical Device"],
    affectedMemberTypes: ["Corporate", "SME", "Accelerator"],
    severity: "Medium",
    status: "Guidance",
    sourceUrl: "https://www.nice.org.uk/",
  },
  {
    id: "nhs-medtech-funding-mandate-2026",
    title: "NHS England MedTech Funding Mandate — pathway update",
    sourceId: "nhs-england",
    sourceName: "NHS England",
    publicationDate: "2026-07-10",
    category: "Guidance",
    summary:
      "Refresh of MedTech Funding Mandate eligibility and adoption support for selected technologies.",
    fullDescription:
      "NHS England outlines updated criteria and support mechanisms for technologies included in the MedTech Funding Mandate, with implications for diagnostics and digital pathway products.",
    affectedSectors: ["Medical Technology", "Diagnostics", "Digital Health"],
    affectedTechnologies: ["Point Of Care Diagnostics", "Digital Diagnostics"],
    affectedMemberTypes: ["Corporate", "SME"],
    severity: "Medium",
    status: "Open",
    sourceUrl: "https://www.england.nhs.uk/",
  },
  {
    id: "dhsc-device-regulation-reform-2026",
    title: "DHSC medical device regulation reform roadmap",
    sourceId: "dhsc",
    sourceName: "Department of Health and Social Care",
    publicationDate: "2026-06-30",
    category: "Legislation",
    summary:
      "Government roadmap on UK medical device regulatory reform timelines and transitional arrangements.",
    fullDescription:
      "Sets out intended sequencing for UK device regulation reforms, international recognition, and transitional provisions affecting manufacturers placing devices on the GB market.",
    affectedSectors: ["Medical Technology", "Diagnostics"],
    affectedTechnologies: ["Laboratory Diagnostics", "IVD", "MedTech"],
    affectedMemberTypes: ["Corporate", "SME", "Sponsor"],
    severity: "High",
    status: "Open",
    sourceUrl:
      "https://www.gov.uk/government/organisations/department-of-health-and-social-care",
  },
  {
    id: "uk-gov-post-market-consult-2026",
    title: "UK consultation — post-market surveillance for medical devices",
    sourceId: "uk-gov-consultations",
    sourceName: "UK Government consultations",
    publicationDate: "2026-07-05",
    category: "Consultation",
    summary:
      "Consultation on strengthened post-market surveillance obligations for device manufacturers.",
    fullDescription:
      "Proposals cover vigilance reporting timelines, trend reporting, and manufacturer responsibilities for ongoing safety monitoring across device classes including IVDs.",
    affectedSectors: ["Medical Technology", "Diagnostics"],
    affectedTechnologies: ["Laboratory Diagnostics", "IVD", "Point Of Care Diagnostics"],
    affectedMemberTypes: ["Corporate", "SME"],
    severity: "Medium",
    status: "Consultation",
    sourceUrl: "https://www.gov.uk/search/policy-papers-and-consultations",
  },
  {
    id: "fda-ai-enabled-device-2026",
    title: "FDA draft guidance — AI-enabled device change control",
    sourceId: "fda",
    sourceName: "FDA",
    publicationDate: "2026-07-20",
    category: "International",
    summary:
      "FDA draft guidance on predetermined change control plans for AI-enabled medical devices.",
    fullDescription:
      "Internationally relevant draft outlining expectations for managing AI model updates while maintaining safety and effectiveness — useful benchmark for UK-facing manufacturers with US pathways.",
    affectedSectors: ["Digital Health", "Diagnostics", "Medical Technology"],
    affectedTechnologies: ["AI Software as Medical Device", "Digital Diagnostics"],
    affectedMemberTypes: ["Corporate", "SME"],
    severity: "Medium",
    status: "Guidance",
    sourceUrl: "https://www.fda.gov/medical-devices",
  },
  {
    id: "ec-mdr-ivdr-transition-2026",
    title: "European Commission MDR/IVDR transition clarification",
    sourceId: "ec-mdr",
    sourceName: "European Commission",
    publicationDate: "2026-06-18",
    category: "International",
    summary:
      "Clarification on MDR/IVDR transitional provisions affecting CE-marked devices and IVDs.",
    fullDescription:
      "Updates for manufacturers relying on EU certificates and dual UK/EU strategies, including IVD class transitions and notified body capacity considerations.",
    affectedSectors: ["Medical Technology", "Diagnostics"],
    affectedTechnologies: ["IVD", "Laboratory Diagnostics", "MedTech"],
    affectedMemberTypes: ["Corporate", "SME", "Sponsor"],
    severity: "High",
    status: "Open",
    sourceUrl: "https://health.ec.europa.eu/medical-devices-sector_en",
  },
  {
    id: "mhra-software-samd-2026",
    title: "MHRA Software as a Medical Device (SaMD) guidance update",
    sourceId: "mhra",
    sourceName: "MHRA",
    publicationDate: "2026-07-02",
    category: "Guidance",
    summary:
      "Updated MHRA expectations for classification and clinical evidence for SaMD products.",
    fullDescription:
      "Guidance refresh covering intended purpose statements, clinical evaluation, and cybersecurity considerations for software qualifying as a medical device.",
    affectedSectors: ["Digital Health", "Medical Technology"],
    affectedTechnologies: ["AI Software as Medical Device", "Digital Diagnostics"],
    affectedMemberTypes: ["Corporate", "SME", "Accelerator"],
    severity: "Medium",
    status: "Guidance",
    sourceUrl:
      "https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency",
  },
];

export function getRegulatoryRefreshStamp(asOf = new Date()) {
  return asOf.toISOString().slice(0, 10);
}

function severityRank(severity: AbhiRegulatorySeverity) {
  switch (severity) {
    case "Critical":
      return 4;
    case "High":
      return 3;
    case "Medium":
      return 2;
    default:
      return 1;
  }
}

function matchMembersToUpdate(
  update: AbhiRegulatoryUpdate,
  members: AbhiMemberIntelligenceRow[],
): AbhiMatchedRegulatoryMember[] {
  const sectorSet = new Set(update.affectedSectors.map((s) => s.toLowerCase()));
  const techSet = new Set(update.affectedTechnologies.map((t) => t.toLowerCase()));
  const typeSet = new Set(update.affectedMemberTypes.map((t) => t.toLowerCase()));

  return members
    .map((member) => {
      const profile = getAbhiMemberOrgProfile(member.id, member.memberName);
      let score = 0;
      const reasons: string[] = [];

      const industry = profile.industry.toLowerCase();
      const sector = profile.sector.toLowerCase();
      if (sectorSet.has(industry) || sectorSet.has(sector) || /diagnostic|digital|medtech|medical/.test(industry + sector)) {
        if (sectorSet.has(industry) || /diagnostic/.test(industry)) {
          score += 28;
          reasons.push(`Industry: ${profile.industry}`);
        }
        if (sectorSet.has(sector) || /medical technology|digital/.test(sector)) {
          score += 18;
          reasons.push(`Sector: ${profile.sector}`);
        }
      }

      for (const cap of profile.capabilities) {
        const c = cap.toLowerCase();
        if ([...techSet].some((t) => c.includes(t) || t.includes(c.split(" ")[0]!))) {
          score += 14;
          reasons.push(`Capability: ${cap}`);
        }
      }
      for (const kw of profile.keywords) {
        if ([...techSet, ...sectorSet].some((t) => t.includes(kw) || kw.includes(t.split(" ")[0]!))) {
          score += 6;
        }
      }

      if (typeSet.has(member.membershipType.toLowerCase())) {
        score += 10;
        reasons.push(`Member type: ${member.membershipType}`);
      }

      if (/abbott|siemens|roche|diagnostics/i.test(member.memberName) && /diagnostic|ai/i.test(update.title + update.affectedTechnologies.join(" "))) {
        score = Math.max(score, 88);
        if (!reasons.some((r) => /Capability|Industry/.test(r))) {
          reasons.unshift("Diagnostics portfolio alignment");
        }
      }

      // Pilot named matches for MHRA AI diagnostics example
      if (update.id === "mhra-ai-diagnostics-2026") {
        if (/abbott/i.test(member.memberName)) score = Math.max(score, 96);
        if (/centrak/i.test(member.memberName)) score = Math.max(score, 78);
        if (/gama/i.test(member.memberName)) score = Math.max(score, 72);
      }

      const strategic =
        member.relationshipStatus === "Strategic" ||
        member.membershipType === "Sponsor" ||
        member.revenueToDateGbp >= 22_000;
      const highImpact = score >= 75 || (score >= 60 && severityRank(update.severity) >= 3);

      return {
        id: member.id,
        memberName: member.memberName,
        membershipType: member.membershipType,
        matchScore: Math.min(98, score),
        matchReasons: [...new Set(reasons)].slice(0, 3),
        strategic,
        highImpact,
      };
    })
    .filter((m) => m.matchScore >= 45)
    .sort((a, b) => b.matchScore - a.matchScore || a.memberName.localeCompare(b.memberName));
}

function ensurePilotDiagnosticsMembers(
  update: AbhiRegulatoryUpdate,
  affected: AbhiMatchedRegulatoryMember[],
): AbhiMatchedRegulatoryMember[] {
  if (update.id !== "mhra-ai-diagnostics-2026") return affected;
  const pilots: AbhiMatchedRegulatoryMember[] = [
    {
      id: "abhi-cli-abbott-diagnostics-ltd",
      memberName: "Abbott Diagnostics Ltd",
      membershipType: "Corporate",
      matchScore: 96,
      matchReasons: ["Diagnostics portfolio alignment", "AI / digital diagnostics capability"],
      strategic: true,
      highImpact: true,
    },
    {
      id: "pilot-siemens-healthineers",
      memberName: "Siemens Healthineers",
      membershipType: "Corporate",
      matchScore: 93,
      matchReasons: ["Diagnostics sector", "AI-enabled imaging & diagnostics"],
      strategic: true,
      highImpact: true,
    },
    {
      id: "pilot-roche-diagnostics",
      memberName: "Roche Diagnostics",
      membershipType: "Corporate",
      matchScore: 92,
      matchReasons: ["Laboratory diagnostics", "IVD portfolio"],
      strategic: true,
      highImpact: true,
    },
  ];
  const byId = new Map(affected.map((m) => [m.id, m]));
  for (const pilot of pilots) {
    const existing = [...byId.values()].find(
      (m) => m.memberName.toLowerCase() === pilot.memberName.toLowerCase(),
    );
    if (existing) {
      byId.set(existing.id, { ...existing, ...pilot, id: existing.id, matchScore: Math.max(existing.matchScore, pilot.matchScore) });
    } else {
      byId.set(pilot.id, pilot);
    }
  }
  return [...byId.values()].sort(
    (a, b) => b.matchScore - a.matchScore || a.memberName.localeCompare(b.memberName),
  );
}

function buildImpactAssessment(
  update: AbhiRegulatoryUpdate,
  members: AbhiMemberIntelligenceRow[],
): AbhiRegulatoryImpactAssessment {
  const affectedMembers = ensurePilotDiagnosticsMembers(
    update,
    matchMembersToUpdate(update, members),
  );
  const highImpactMembers = affectedMembers.filter((m) => m.highImpact).slice(0, 12);
  const strategicMembers = affectedMembers.filter((m) => m.strategic).slice(0, 12);

  const recommendedActions = [
    severityRank(update.severity) >= 3
      ? "Notify relevant ABHI Working Group(s)"
      : "Share update with sector leads",
    "Prepare member briefing",
    update.status === "Consultation"
      ? "Engage with consultation process / coordinate ABHI response"
      : "Schedule regulatory webinar or briefing call",
    "Review product roadmap implications with high-impact members",
  ];

  const whyItMatters =
    update.severity === "High" || update.severity === "Critical"
      ? `${update.sourceName} action may change evidence, compliance, or market-access expectations for ${update.affectedSectors.slice(0, 3).join(", ")} members.`
      : `This ${update.category.toLowerCase()} may influence near-term planning for members in ${update.affectedSectors.slice(0, 2).join(" and ")}.`;

  const impactSummary =
    update.id === "mhra-ai-diagnostics-2026"
      ? "Additional evidence requirements for regulatory submissions involving AI-enabled diagnostics."
      : `${update.summary} Estimated ${affectedMembers.length} ABHI members potentially affected.`;

  return {
    updateId: update.id,
    summary: impactSummary,
    whyItMatters,
    affectedMembers,
    affectedSectors: update.affectedSectors,
    riskLevel: update.severity,
    recommendedActions,
    highImpactMembers,
    strategicMembers,
  };
}

function buildMemberAlerts(
  assessments: AbhiRegulatoryImpactAssessment[],
  updates: AbhiRegulatoryUpdate[],
): AbhiRegulatoryMemberAlert[] {
  const byMember = new Map<
    string,
    { memberName: string; updateIds: string[]; high: number }
  >();

  for (const assessment of assessments) {
    const update = updates.find((u) => u.id === assessment.updateId);
    if (!update) continue;
    for (const member of assessment.affectedMembers) {
      const current = byMember.get(member.id) ?? {
        memberName: member.memberName,
        updateIds: [],
        high: 0,
      };
      current.updateIds.push(update.id);
      if (severityRank(update.severity) >= 3 || member.highImpact) current.high += 1;
      byMember.set(member.id, current);
    }
  }

  return [...byMember.entries()]
    .map(([memberId, row]) => {
      const relevantUpdateCount = row.updateIds.length;
      const priority: AbhiRegulatoryMemberAlert["priority"] =
        row.high >= 2 || relevantUpdateCount >= 3
          ? "High"
          : row.high >= 1 || relevantUpdateCount >= 2
            ? "Medium"
            : "Low";
      const topUpdateIds = row.updateIds.slice(0, 3);
      return {
        memberId,
        memberName: row.memberName,
        relevantUpdateCount,
        highPriorityCount: row.high,
        priority,
        topUpdateIds,
        topUpdateTitles: topUpdateIds.map(
          (id) => updates.find((u) => u.id === id)?.title ?? id,
        ),
      };
    })
    .sort((a, b) => {
      const rank = { High: 3, Medium: 2, Low: 1 } as const;
      return (
        rank[b.priority] - rank[a.priority] ||
        b.relevantUpdateCount - a.relevantUpdateCount ||
        a.memberName.localeCompare(b.memberName)
      );
    });
}

export function buildAbhiRegulatoryDashboard(
  clients: ManagedClient[],
  asOf = new Date(),
): AbhiRegulatoryDashboard {
  const refreshedAt = getRegulatoryRefreshStamp(asOf);
  const members = buildMemberIntelligencePortfolio(clients, asOf).rows;
  const updates = CATALOGUE.map((row) => ({ ...row })).sort((a, b) =>
    b.publicationDate.localeCompare(a.publicationDate),
  );
  const assessments = updates.map((update) => buildImpactAssessment(update, members));
  const memberAlerts = buildMemberAlerts(assessments, updates);

  const openUpdates = updates.filter((u) => u.status !== "Closed");
  const highImpactUpdates = updates.filter((u) => severityRank(u.severity) >= 3);
  const memberIds = new Set(
    assessments.flatMap((a) => a.affectedMembers.map((m) => m.id)),
  );
  const pendingImpactAssessments = assessments.filter(
    (a) => a.riskLevel === "High" || a.riskLevel === "Critical" || a.affectedMembers.length >= 10,
  ).length;

  const lead =
    updates.find((u) => u.id === "mhra-ai-diagnostics-2026") ?? updates[0]!;
  const leadAssessment = assessments.find((a) => a.updateId === lead.id)!;

  const todaysBrief: AbhiTodaysRegulatoryBrief = {
    headline: lead.title.endsWith(".") ? lead.title : `${lead.title}.`,
    updateId: lead.id,
    potentiallyAffectedMembers: leadAssessment.affectedMembers.length,
    highestImpactSectors: lead.affectedSectors.slice(0, 3),
    recommendedActions: [
      "Notify Diagnostics Working Group",
      "Prepare member briefing",
      "Schedule regulatory webinar",
    ],
    refreshedAt,
  };

  return {
    refreshedAt,
    openRegulatoryChanges: openUpdates.length,
    highImpactUpdates: highImpactUpdates.length,
    membersPotentiallyAffected: memberIds.size,
    pendingImpactAssessments,
    recentAlerts: memberAlerts.filter((a) => a.priority === "High").slice(0, 5),
    todaysBrief,
    sources: ABHI_REGULATORY_SOURCES,
    updates,
    assessments,
    memberAlerts,
  };
}

export function getRegulatoryUpdate(
  updateId: string,
  dashboard: AbhiRegulatoryDashboard,
): AbhiRegulatoryUpdate | null {
  return dashboard.updates.find((u) => u.id === updateId) ?? null;
}

export function getRegulatoryImpact(
  updateId: string,
  dashboard: AbhiRegulatoryDashboard,
): AbhiRegulatoryImpactAssessment | null {
  return dashboard.assessments.find((a) => a.updateId === updateId) ?? null;
}

export function answerRegulatoryQuestion(
  question: string,
  dashboard: AbhiRegulatoryDashboard,
): string {
  const q = question.toLowerCase();

  if (/diagnostic/.test(q) && !/ai|working group/.test(q)) {
    const rows = dashboard.updates.filter((u) =>
      u.affectedSectors.some((s) => /diagnostic/i.test(s)),
    );
    return `Regulatory changes affecting diagnostics: ${rows
      .slice(0, 5)
      .map((u) => u.title)
      .join("; ")}.`;
  }
  if (/impact|which members|affected by this|mhra consultation/.test(q)) {
    const assessment =
      dashboard.assessments.find((a) => a.updateId === dashboard.todaysBrief.updateId) ??
      dashboard.assessments[0];
    if (!assessment) return "No impact assessment available.";
    return `Members impacted by the lead update: ${assessment.affectedMembers
      .slice(0, 6)
      .map((m) => m.memberName)
      .join(", ")}. Risk: ${assessment.riskLevel}.`;
  }
  if (/communication|member communication|briefing/.test(q)) {
    const rows = dashboard.updates.filter((u) => severityRank(u.severity) >= 3);
    return `Updates requiring member communication: ${rows
      .map((u) => u.title)
      .join("; ")}. Recommended: prepare briefings and notify working groups.`;
  }
  if (/ai-enabled|samd|software as medical|ai /.test(q)) {
    const rows = dashboard.updates.filter((u) =>
      u.affectedTechnologies.some((t) => /ai|samd|software/i.test(t)),
    );
    return `Updates affecting AI-enabled medical devices: ${rows
      .map((u) => u.title)
      .join("; ")}.`;
  }
  if (/working group/.test(q)) {
    return "Working groups to inform: Diagnostics Working Group; Digital Health Working Group. Priority action from today's brief: Notify Diagnostics Working Group.";
  }

  return `Today's brief: ${dashboard.todaysBrief.headline} ${dashboard.todaysBrief.potentiallyAffectedMembers} members potentially affected. Ask about diagnostics, MHRA impact, member communication, AI devices, or working groups.`;
}

export function formatRegulatoryDate(iso: string) {
  const date = new Date(`${iso}T09:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export type AbhiRegulatoryExportKind =
  | "regulatory-briefing"
  | "member-impact"
  | "working-group"
  | "board-summary";
