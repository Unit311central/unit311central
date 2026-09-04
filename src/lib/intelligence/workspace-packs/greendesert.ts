import { GREENDESERT_SLUG } from "@/lib/greendesert-surface";
import {
  GREENDESERT_CLIENT_INTELLIGENCE,
  GREENDESERT_COMPANY_INTELLIGENCE,
  GREENDESERT_MARKET_INTELLIGENCE,
  type GreenDesertIntelligenceRecord,
} from "@/lib/greendesert/greendesert-intelligence-data";
import { INTELLIGENCE_WORKSPACE_NAV_LABELS } from "@/lib/intelligence/intelligence-nav-labels";
import type { IntelligenceDomainProvider, IntelligenceRecord } from "@/lib/intelligence/types";
import { buildStandardIntelligencePack } from "@/lib/intelligence/workspace-packs/_standard-pack";
import {
  briefingFromSections,
  paginateRecords,
} from "@/lib/intelligence/workspace-packs/_helpers";

function toRecord(row: GreenDesertIntelligenceRecord, domainId: string): IntelligenceRecord {
  return {
    id: `${domainId}:${row.id}`,
    workspaceSlug: GREENDESERT_SLUG,
    domainId,
    title: row.title,
    summary: row.summary,
    severity: row.severity === "priority" ? "high" : row.severity === "watch" ? "medium" : "info",
    categories: [{ id: row.category, label: row.category }],
    tags: row.tags.map((tag) => ({ id: tag, label: tag })),
    entityRefs: [],
    metadata: {},
  };
}

function buildProvider(
  domainId: string,
  rows: GreenDesertIntelligenceRecord[],
): IntelligenceDomainProvider {
  return {
    domainId,
    async searchRecords(_ctx, query) {
      const q = query.filter?.search?.trim().toLowerCase() ?? "";
      const items = q
        ? rows.filter(
            (row) =>
              row.title.toLowerCase().includes(q) ||
              row.summary.toLowerCase().includes(q) ||
              row.tags.some((tag) => tag.toLowerCase().includes(q)),
          )
        : rows;
      return paginateRecords(items, (row) => toRecord(row, domainId), query.limit, query.offset);
    },
    async getRecord(_ctx, recordId) {
      const id = recordId.replace(`${domainId}:`, "");
      const row = rows.find((item) => item.id === id);
      return row ? toRecord(row, domainId) : null;
    },
    async buildBriefing(ctx) {
      return briefingFromSections(ctx.workspaceSlug, domainId, "Green Desert intelligence briefing", [
        {
          id: "highlights",
          title: "Key signals",
          bullets: rows.slice(0, 4).map((row) => `${row.title} — ${row.summary}`),
        },
      ]);
    },
  };
}

const companyProvider = buildProvider("company-intelligence", GREENDESERT_COMPANY_INTELLIGENCE);
const marketProvider = buildProvider("market-intelligence", GREENDESERT_MARKET_INTELLIGENCE);
const clientProvider = buildProvider("client-intelligence", GREENDESERT_CLIENT_INTELLIGENCE);

export const greenDesertIntelligencePack = buildStandardIntelligencePack({
  id: "greendesert-intelligence",
  slug: GREENDESERT_SLUG,
  label: INTELLIGENCE_WORKSPACE_NAV_LABELS[GREENDESERT_SLUG],
  hostSurface: "customer",
  companyProvider,
  marketProvider,
  clientProvider,
  clientDomainId: "client-intelligence",
  clientLabel: "Client Intelligence",
});
