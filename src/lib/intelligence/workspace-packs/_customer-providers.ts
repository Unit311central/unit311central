import type {
  IntelligenceDomainProvider,
  IntelligenceRecord,
} from "@/lib/intelligence/types";
import { briefingFromSections } from "@/lib/intelligence/workspace-packs/_helpers";

export function createCustomerIntelligenceSources(workspaceSlug: string) {
  return [
    {
      id: `${workspaceSlug}-src-company`,
      workspaceSlug,
      domainId: "company-intelligence",
      name: "Workspace operations",
      kind: "ops_derived" as const,
      refreshCadence: "P1D",
      description: "Company performance signals from your workspace modules.",
    },
    {
      id: `${workspaceSlug}-src-clients`,
      workspaceSlug,
      domainId: "client-intelligence",
      name: "Client & CRM data",
      kind: "crm_derived" as const,
      refreshCadence: "P1D",
      description: "Client health, pipeline, and support patterns.",
    },
    {
      id: `${workspaceSlug}-src-market`,
      workspaceSlug,
      domainId: "market-intelligence",
      name: "Market monitor",
      kind: "public_feed" as const,
      refreshCadence: "P7D",
      description: "Sector, competitive, and macro signals relevant to your business.",
    },
  ];
}

export function createEmptyIntelligenceProvider(
  workspaceSlug: string,
  domainId: string,
): IntelligenceDomainProvider {
  const sources = createCustomerIntelligenceSources(workspaceSlug);
  return {
    domainId,
    async listSources(ctx) {
      return sources.filter((source) => source.domainId === ctx.domainId);
    },
    async searchRecords() {
      return { records: [] as IntelligenceRecord[], total: 0 };
    },
    async getRecord() {
      return null;
    },
    async buildBriefing(ctx) {
      return briefingFromSections(
        ctx.workspaceSlug,
        domainId,
        "Intelligence briefing",
        [
          {
            id: "getting-started",
            title: "Getting started",
            bullets: [
              "Connect your operational modules to populate intelligence signals.",
              "Use Company, Client, and Market Intelligence views for structured briefings.",
            ],
          },
        ],
        {
          posture: "watch",
          postureReason:
            "Intelligence data will populate as your workspace modules gather activity.",
          recommendedActions: ["Open each Intelligence function to review available signals."],
        },
      );
    },
  };
}

export function createDashboardIntelligenceProvider(
  workspaceSlug: string,
  clientLabel: string,
): IntelligenceDomainProvider {
  return {
    domainId: "dashboard",
    async buildBriefing(ctx) {
      return briefingFromSections(ctx.workspaceSlug, "dashboard", "Intelligence overview", [
        {
          id: "areas",
          title: "Intelligence areas",
          bullets: [
            "Company Intelligence — operational and financial performance signals.",
            `${clientLabel} — relationship health, renewals, and portfolio posture.`,
            "Market Intelligence — sector, competitive, and macro signals.",
          ],
        },
      ], {
        posture: "watch",
        postureReason: "Review each intelligence area for detailed briefings and records.",
        recommendedActions: [
          "Open Company Intelligence for operational signals.",
          `Open ${clientLabel} for portfolio health.`,
          "Open Market Intelligence for external signals.",
        ],
      });
    },
  };
}
