import { customDetailCategoryId } from "@/lib/unit311-details-data";

export const CYBER_RESILIENCE_ACT_LABEL = "Cyber Resilience Act";
export const CYBER_RESILIENCE_ACT_CATEGORY_ID = customDetailCategoryId(
  CYBER_RESILIENCE_ACT_LABEL,
);

export type Unit311DetailDocPackEntry = {
  /** Stable id used in API/UI */
  id: string;
  /** Display title in the left document list */
  title: string;
  /** File name stored inside the Unit311 Details folder */
  fileName: string;
  /** Repo-relative path to the source Markdown */
  sourcePath: string;
  order: number;
};

export type Unit311DetailDocPack = {
  id: string;
  label: string;
  categoryIds: string[];
  folderNames: string[];
  documents: readonly Unit311DetailDocPackEntry[];
};

const CRA_DOCS: readonly Unit311DetailDocPackEntry[] = [
  {
    id: "01-overview",
    title: "01 - Overview",
    fileName: "01 - Overview.md",
    sourcePath: "docs/cyber-resilience-act/01-overview.md",
    order: 1,
  },
  {
    id: "02-cra-compliance-roadmap",
    title: "02 - CRA Compliance Roadmap",
    fileName: "02 - CRA Compliance Roadmap.md",
    sourcePath: "docs/cyber-resilience-act/02-cra-compliance-roadmap.md",
    order: 2,
  },
  {
    id: "03-secure-development-lifecycle",
    title: "03 - Secure Development Lifecycle",
    fileName: "03 - Secure Development Lifecycle.md",
    sourcePath: "docs/cyber-resilience-act/03-secure-development-lifecycle.md",
    order: 3,
  },
  {
    id: "04-secure-coding-standards",
    title: "04 - Secure Coding Standards",
    fileName: "04 - Secure Coding Standards.md",
    sourcePath: "docs/cyber-resilience-act/04-secure-coding-standards.md",
    order: 4,
  },
  {
    id: "05-authentication-access-control",
    title: "05 - Authentication & Access Control",
    fileName: "05 - Authentication & Access Control.md",
    sourcePath: "docs/cyber-resilience-act/05-authentication-access-control.md",
    order: 5,
  },
  {
    id: "06-cryptography-encryption",
    title: "06 - Cryptography & Encryption",
    fileName: "06 - Cryptography & Encryption.md",
    sourcePath: "docs/cyber-resilience-act/06-cryptography-encryption.md",
    order: 6,
  },
  {
    id: "07-dependency-supply-chain",
    title: "07 - Dependency & Supply Chain Security",
    fileName: "07 - Dependency & Supply Chain Security.md",
    sourcePath: "docs/cyber-resilience-act/07-dependency-supply-chain.md",
    order: 7,
  },
  {
    id: "08-sbom",
    title: "08 - Software Bill of Materials (SBOM)",
    fileName: "08 - Software Bill of Materials (SBOM).md",
    sourcePath: "docs/cyber-resilience-act/08-sbom.md",
    order: 8,
  },
  {
    id: "09-vulnerability-management",
    title: "09 - Vulnerability Management",
    fileName: "09 - Vulnerability Management.md",
    sourcePath: "docs/cyber-resilience-act/09-vulnerability-management.md",
    order: 9,
  },
  {
    id: "10-incident-response-plan",
    title: "10 - Incident Response Plan",
    fileName: "10 - Incident Response Plan.md",
    sourcePath: "docs/cyber-resilience-act/10-incident-response-plan.md",
    order: 10,
  },
  {
    id: "11-security-update-policy",
    title: "11 - Security Update Policy",
    fileName: "11 - Security Update Policy.md",
    sourcePath: "docs/cyber-resilience-act/11-security-update-policy.md",
    order: 11,
  },
  {
    id: "12-release-management",
    title: "12 - Release Management",
    fileName: "12 - Release Management.md",
    sourcePath: "docs/cyber-resilience-act/12-release-management.md",
    order: 12,
  },
  {
    id: "13-technical-security-architecture",
    title: "13 - Technical Security Architecture",
    fileName: "13 - Technical Security Architecture.md",
    sourcePath: "docs/cyber-resilience-act/13-technical-security-architecture.md",
    order: 13,
  },
  {
    id: "14-risk-assessment",
    title: "14 - Risk Assessment",
    fileName: "14 - Risk Assessment.md",
    sourcePath: "docs/cyber-resilience-act/14-risk-assessment.md",
    order: 14,
  },
  {
    id: "15-disaster-recovery",
    title: "15 - Disaster Recovery",
    fileName: "15 - Disaster Recovery.md",
    sourcePath: "docs/cyber-resilience-act/15-disaster-recovery.md",
    order: 15,
  },
  {
    id: "16-business-continuity",
    title: "16 - Business Continuity",
    fileName: "16 - Business Continuity.md",
    sourcePath: "docs/cyber-resilience-act/16-business-continuity.md",
    order: 16,
  },
  {
    id: "17-compliance-gap-analysis",
    title: "17 - Compliance Gap Analysis",
    fileName: "17 - Compliance Gap Analysis.md",
    sourcePath: "docs/cyber-resilience-act/17-compliance-gap-analysis.md",
    order: 17,
  },
  {
    id: "18-evidence-register",
    title: "18 - Evidence Register",
    fileName: "18 - Evidence Register.md",
    sourcePath: "docs/cyber-resilience-act/18-evidence-register.md",
    order: 18,
  },
  {
    id: "19-action-tracker",
    title: "19 - Action Tracker",
    fileName: "19 - Action Tracker.md",
    sourcePath: "docs/cyber-resilience-act/19-action-tracker.md",
    order: 19,
  },
  {
    id: "20-compliance-gaps-to-fix",
    title: "20 - Compliance gaps to fix",
    fileName: "20 - Compliance gaps to fix.md",
    sourcePath: "docs/cyber-resilience-act/20-compliance-gaps-to-fix.md",
    order: 20,
  },
] as const;

export const CYBER_RESILIENCE_ACT_DOC_PACK: Unit311DetailDocPack = {
  id: "cyber-resilience-act",
  label: CYBER_RESILIENCE_ACT_LABEL,
  categoryIds: [CYBER_RESILIENCE_ACT_CATEGORY_ID],
  folderNames: [CYBER_RESILIENCE_ACT_LABEL, "Cyber Resilience Act"],
  documents: CRA_DOCS,
};

const EXECUTIVE_AI_DOCS: readonly Unit311DetailDocPackEntry[] = [
  {
    id: "01-architecture-report",
    title: "01 - Architecture Report",
    fileName: "01 - Architecture Report.md",
    sourcePath: "docs/executive-assistant-architecture/01-architecture-report.md",
    order: 1,
  },
  {
    id: "02-executive-ai-platform",
    title: "02 - Executive AI Platform",
    fileName: "02 - Executive AI Platform.md",
    sourcePath: "docs/executive-assistant-architecture/02-executive-ai-platform.md",
    order: 2,
  },
  {
    id: "03-diagram-high-level",
    title: "03 - Diagram: High-Level Architecture",
    fileName: "03 - Diagram High-Level Architecture.md",
    sourcePath: "docs/executive-assistant-architecture/03-diagram-high-level.md",
    order: 3,
  },
  {
    id: "04-diagram-knowledge-domains",
    title: "04 - Diagram: Knowledge Domains",
    fileName: "04 - Diagram Knowledge Domains.md",
    sourcePath: "docs/executive-assistant-architecture/04-diagram-knowledge-domains.md",
    order: 4,
  },
  {
    id: "05-diagram-ai-lifecycle",
    title: "05 - Diagram: AI Request Lifecycle",
    fileName: "05 - Diagram AI Request Lifecycle.md",
    sourcePath: "docs/executive-assistant-architecture/05-diagram-ai-lifecycle.md",
    order: 5,
  },
  {
    id: "06-diagram-write-path",
    title: "06 - Diagram: Write Path",
    fileName: "06 - Diagram Write Path.md",
    sourcePath: "docs/executive-assistant-architecture/06-diagram-write-path.md",
    order: 6,
  },
  {
    id: "07-diagram-auth-flow",
    title: "07 - Diagram: Auth Flow",
    fileName: "07 - Diagram Auth Flow.md",
    sourcePath: "docs/executive-assistant-architecture/07-diagram-auth-flow.md",
    order: 7,
  },
  {
    id: "08-diagram-database-er",
    title: "08 - Diagram: Database ER",
    fileName: "08 - Diagram Database ER.md",
    sourcePath: "docs/executive-assistant-architecture/08-diagram-database-er.md",
    order: 8,
  },
  {
    id: "09-diagram-component-hierarchy",
    title: "09 - Diagram: Component Hierarchy",
    fileName: "09 - Diagram Component Hierarchy.md",
    sourcePath: "docs/executive-assistant-architecture/09-diagram-component-hierarchy.md",
    order: 9,
  },
  {
    id: "10-diagram-module-dependencies",
    title: "10 - Diagram: Module Dependencies",
    fileName: "10 - Diagram Module Dependencies.md",
    sourcePath: "docs/executive-assistant-architecture/10-diagram-module-dependencies.md",
    order: 10,
  },
  {
    id: "11-diagram-folder-tree",
    title: "11 - Diagram: Folder Tree",
    fileName: "11 - Diagram Folder Tree.md",
    sourcePath: "docs/executive-assistant-architecture/11-diagram-folder-tree.md",
    order: 11,
  },
  {
    id: "12-diagram-state-flow",
    title: "12 - Diagram: State Flow",
    fileName: "12 - Diagram State Flow.md",
    sourcePath: "docs/executive-assistant-architecture/12-diagram-state-flow.md",
    order: 12,
  },
] as const;

export const EXECUTIVE_AI_PLATFORM_DOC_PACK: Unit311DetailDocPack = {
  id: "executive-ai-platform",
  label: "Executive AI Platform",
  categoryIds: ["ai-agent"],
  folderNames: ["Executive AI Platform", "AI Agent", "Executive Assistant"],
  documents: EXECUTIVE_AI_DOCS,
};

export const UNIT311_DETAIL_DOC_PACKS: readonly Unit311DetailDocPack[] = [
  CYBER_RESILIENCE_ACT_DOC_PACK,
  EXECUTIVE_AI_PLATFORM_DOC_PACK,
];

export function findDocPackForCategory(input: {
  categoryId?: string | null;
  label?: string | null;
  folderName?: string | null;
}): Unit311DetailDocPack | null {
  const categoryId = input.categoryId?.trim().toLowerCase() ?? "";
  const label = input.label?.trim().toLowerCase() ?? "";
  const folderName = input.folderName?.trim().toLowerCase() ?? "";

  for (const pack of UNIT311_DETAIL_DOC_PACKS) {
    if (pack.categoryIds.some((id) => id.toLowerCase() === categoryId)) return pack;
    if (pack.folderNames.some((name) => name.toLowerCase() === label)) return pack;
    if (pack.folderNames.some((name) => name.toLowerCase() === folderName)) return pack;
    if (pack.label.toLowerCase() === label || pack.label.toLowerCase() === folderName) {
      return pack;
    }
  }
  return null;
}
