/**
 * OnwardAir IP & Patents register.
 *
 * VERIFIED records are sourced directly from Google Patents (patentNumber, dates,
 * inventors, and assignee chain match the public record). Everything else is marked
 * "Verification Required" — no patent numbers are invented for unverified claims.
 */

export type PatentVerificationStatus = "Verified" | "Verification Required";

export type PatentStatus =
  | "Active/Granted"
  | "Active"
  | "Application (unverified)"
  | "Unknown";

export type PatentRecord = {
  id: string;
  title: string;
  patentNumber: string;
  filingDate: string;
  publicationDate: string;
  grantDate: string;
  status: PatentStatus;
  jurisdiction: string;
  inventors: string[];
  assignee: string;
  patentFamily: string;
  aircraftSystem: string;
  description: string;
  supportingDocuments: { label: string; url: string }[];
  notes: string;
  verificationStatus: PatentVerificationStatus;
  sourceUrl?: string;
};

export const PATENT_RECORDS: PatentRecord[] = [
  {
    id: "us10198086b2",
    title: "Dynamically balanced, multi-degrees-of-freedom hand controller",
    patentNumber: "US10198086B2",
    filingDate: "2018-08-27",
    publicationDate: "2019-02-05",
    grantDate: "2019-02-05",
    status: "Active/Granted",
    jurisdiction: "US",
    inventors: [
      "Scott Edward Parazynski",
      "Jeffrey William Bull",
      "Nicholas Michael Degnan",
      "Alinda Mercedes Matson",
      "Brandon Tran",
    ],
    assignee:
      "OnwardAir, Inc. (current; assigned from Fluid Phoenix LLC effective 2025-08-14, recorded 2025-10-31 per Google Patents). Original assignee: Fluidity Technologies, Inc.",
    patentFamily: "Multi-DoF hand controller / Fluidity motion control",
    aircraftSystem: "Flight / vehicle motion control (4+ DoF hand controller)",
    description:
      "Single-hand controller generating control inputs in four or more degrees of freedom while limiting cross-coupling between axes.",
    supportingDocuments: [
      {
        label: "Google Patents — US10198086B2",
        url: "https://patents.google.com/patent/US10198086B2/en",
      },
    ],
    notes: "Application US16/114,190. Verified against Google Patents public record.",
    verificationStatus: "Verified",
    sourceUrl: "https://patents.google.com/patent/US10198086B2/en",
  },
  {
    id: "us10324540b1",
    title: "Multi-degrees-of-freedom hand controller",
    patentNumber: "US10324540B1",
    filingDate: "2019-01-15",
    publicationDate: "2019-06-18",
    grantDate: "2019-06-18",
    status: "Active/Granted",
    jurisdiction: "US",
    inventors: ["Scott Edward Parazynski"],
    assignee: "ONWARDAIR, INC. / Fluidity Technologies Inc (per Google Patents)",
    patentFamily: "Multi-DoF hand controller",
    aircraftSystem: "Remotely controlled vehicle / flight control interface",
    description:
      "Multi-degrees-of-freedom hand controller for generating control inputs across multiple axes for remotely controlled vehicles and flight interfaces.",
    supportingDocuments: [
      {
        label: "Google Patents — US10324540B1",
        url: "https://patents.google.com/patent/US10324540B1/en",
      },
    ],
    notes: "Application US16/248,597. Verified against Google Patents public record.",
    verificationStatus: "Verified",
    sourceUrl: "https://patents.google.com/patent/US10324540B1/en",
  },
  {
    id: "vertex-vtol-ip",
    title: "Vertex VTOL™ multi-mission aviation system IP",
    patentNumber: "Pending verification",
    filingDate: "",
    publicationDate: "",
    grantDate: "",
    status: "Unknown",
    jurisdiction: "",
    inventors: [],
    assignee: "OnwardAir, Inc. (claimed)",
    patentFamily: "Vertex VTOL",
    aircraftSystem: "Vertex VTOL",
    description:
      "OnwardAir markets the Vertex VTOL multi-mission aviation system as covered by patented technology. No specific patent numbers are referenced on the public marketing site.",
    supportingDocuments: [{ label: "OnwardAir — Vertex VTOL", url: "https://onwardair.tech/" }],
    notes:
      "Company markets Vertex VTOL as patented; specific USPTO/EPO numbers not independently verified in this register.",
    verificationStatus: "Verification Required",
    sourceUrl: "https://onwardair.tech/",
  },
  {
    id: "flex-pods-ip",
    title: "FLEX Pods™ modular logistics payload IP",
    patentNumber: "Pending verification",
    filingDate: "",
    publicationDate: "",
    grantDate: "",
    status: "Unknown",
    jurisdiction: "",
    inventors: [],
    assignee: "OnwardAir, Inc. (claimed)",
    patentFamily: "FLEX Pods",
    aircraftSystem: "FLEX Pods modular logistics payload",
    description:
      "OnwardAir markets FLEX Pods modular logistics payload systems as proprietary/patented technology. No specific patent numbers are referenced on the public marketing site.",
    supportingDocuments: [{ label: "OnwardAir — FLEX Pods", url: "https://onwardair.tech/" }],
    notes:
      "Company markets FLEX Pods as patented; specific USPTO/EPO numbers not independently verified in this register.",
    verificationStatus: "Verification Required",
    sourceUrl: "https://onwardair.tech/",
  },
  {
    id: "portfolio-25-plus",
    title: "Additional issued patents (portfolio claim: 25+)",
    patentNumber: "Multiple — numbers not publicly enumerated",
    filingDate: "",
    publicationDate: "",
    grantDate: "",
    status: "Unknown",
    jurisdiction: "",
    inventors: [],
    assignee: "OnwardAir, Inc. (claimed)",
    patentFamily: "Portfolio-wide claim",
    aircraftSystem: "Multiple",
    description:
      "OnwardAir states its portfolio includes 25+ issued patents across hand-controller, VTOL, and payload technologies.",
    supportingDocuments: [{ label: "OnwardAir — IP overview", url: "https://onwardair.tech/" }],
    notes:
      "OnwardAir states 25+ issued patents with provisionals and non-provisionals in queue. Only individually verified numbers are listed as Verified in this register.",
    verificationStatus: "Verification Required",
  },
  {
    id: "provisional-queue",
    title: "Provisional / non-provisional applications in queue",
    patentNumber: "Not disclosed",
    filingDate: "",
    publicationDate: "",
    grantDate: "",
    status: "Application (unverified)",
    jurisdiction: "",
    inventors: [],
    assignee: "OnwardAir, Inc. (claimed)",
    patentFamily: "Pipeline applications",
    aircraftSystem: "Multiple",
    description:
      "OnwardAir has referenced additional provisional and non-provisional patent applications in progress. Filing details are not publicly disclosed.",
    supportingDocuments: [{ label: "OnwardAir — IP overview", url: "https://onwardair.tech/" }],
    notes: "No public filing numbers or dates available for these pipeline applications.",
    verificationStatus: "Verification Required",
  },
];

export function listPatents(): PatentRecord[] {
  return PATENT_RECORDS;
}

export function getPatentById(id: string): PatentRecord | null {
  return PATENT_RECORDS.find((patent) => patent.id === id) ?? null;
}

export type PatentSummaryStats = {
  verified: number;
  applications: number;
  verificationRequired: number;
  total: number;
};

export function patentSummaryStats(): PatentSummaryStats {
  const verified = PATENT_RECORDS.filter((p) => p.verificationStatus === "Verified").length;
  const applications = PATENT_RECORDS.filter(
    (p) => p.status === "Application (unverified)",
  ).length;
  const verificationRequired = PATENT_RECORDS.filter(
    (p) => p.verificationStatus === "Verification Required",
  ).length;
  return {
    verified,
    applications,
    verificationRequired,
    total: PATENT_RECORDS.length,
  };
}

export function searchPatents(query: string): PatentRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return PATENT_RECORDS;
  return PATENT_RECORDS.filter((patent) => {
    const haystack = [
      patent.title,
      patent.patentNumber,
      patent.aircraftSystem,
      patent.patentFamily,
      patent.assignee,
      patent.description,
      patent.notes,
      ...patent.inventors,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export type PatentDocumentEntry = {
  patentId: string;
  patentTitle: string;
  label: string;
  url: string;
  verificationStatus: PatentVerificationStatus;
};

export function listPatentDocuments(): PatentDocumentEntry[] {
  return PATENT_RECORDS.flatMap((patent) =>
    patent.supportingDocuments.map((doc) => ({
      patentId: patent.id,
      patentTitle: patent.title,
      label: doc.label,
      url: doc.url,
      verificationStatus: patent.verificationStatus,
    })),
  );
}

export function groupPatentsByFamily(): { family: string; patents: PatentRecord[] }[] {
  const families = new Map<string, PatentRecord[]>();
  for (const patent of PATENT_RECORDS) {
    const key = patent.patentFamily || "Unclassified";
    const list = families.get(key) ?? [];
    list.push(patent);
    families.set(key, list);
  }
  return Array.from(families.entries()).map(([family, patents]) => ({ family, patents }));
}

export function groupPatentsBySystem(): { system: string; patents: PatentRecord[] }[] {
  const systems = new Map<string, PatentRecord[]>();
  for (const patent of PATENT_RECORDS) {
    const key = patent.aircraftSystem || "Unclassified";
    const list = systems.get(key) ?? [];
    list.push(patent);
    systems.set(key, list);
  }
  return Array.from(systems.entries()).map(([system, patents]) => ({ system, patents }));
}
