/**
 * Server-only workspace pack extensions (board pack loaders, daily brief, snapshots).
 * Imported from server routes/tools only — not from client bundles.
 */

import type {
  EaBoardPackConfig,
  EaBusinessSnapshotEnricher,
  EaDailyBriefBuilder,
} from "./types";
type BoardPackLoader = () => Promise<EaBoardPackConfig>;

const boardPackLoaders: Record<string, BoardPackLoader> = {
  abhi: async () => (await import("./boardpack/abhi")).abhiBoardPackConfig,
  talanton: async () => (await import("./boardpack/talanton")).talantonBoardPackConfig,
  onwardair: async () => (await import("./boardpack/onwardair")).onwardAirBoardPackConfig,
  demo: async () => (await import("./boardpack/demo")).demoBoardPackConfig,
  greendesert: async () => (await import("./boardpack/greendesert")).greendesertBoardPackConfig,
};

const boardPackCache = new Map<string, EaBoardPackConfig>();

let serverDailyBriefBuilders: Record<string, EaDailyBriefBuilder> | null = null;
let serverSnapshotEnrichers: Record<string, EaBusinessSnapshotEnricher> | null = null;

async function loadServerDailyBriefBuilders(): Promise<Record<string, EaDailyBriefBuilder>> {
  if (serverDailyBriefBuilders) return serverDailyBriefBuilders;
  const { buildTalantonDailyExecutiveBrief } = await import(
    "@/lib/talanton/daily-executive-brief"
  );
  serverDailyBriefBuilders = {
    talanton: async (context) => buildTalantonDailyExecutiveBrief(context),
  };
  return serverDailyBriefBuilders;
}

async function loadServerSnapshotEnrichers(): Promise<Record<string, EaBusinessSnapshotEnricher>> {
  if (serverSnapshotEnrichers) return serverSnapshotEnrichers;
  const { queryOnwardAirModule } = await import("@/lib/onwardair/executive-intelligence");
  const { isOnwardAirSlug } = await import("@/lib/onwardair-surface");
  const { queryNorthstarModule } = await import("@/lib/demo/executive-intelligence");
  const { isNorthstarDemoSlug } = await import("@/lib/demo/northstar-surface");
  serverSnapshotEnrichers = {
    onwardair: async (context, domain, snapshot) => {
      if (
        !isOnwardAirSlug(context.workspace.slug) ||
        !(domain === "fundraising" || domain === "engineering" || domain === "intelligence")
      ) {
        return snapshot;
      }
      const moduleId =
        domain === "fundraising"
          ? "fundraising"
          : domain === "engineering"
            ? "engineering"
            : "intelligence";
      return {
        ...snapshot,
        onwardairModule: queryOnwardAirModule(moduleId),
      };
    },
    demo: async (context, domain, snapshot) => {
      if (!isNorthstarDemoSlug(context.workspace.slug)) return snapshot;
      if (
        !(
          domain === "fundraising" ||
          domain === "engineering" ||
          domain === "intelligence" ||
          domain === "finance"
        )
      ) {
        return snapshot;
      }
      const moduleId =
        domain === "fundraising"
          ? "fundraising"
          : domain === "engineering"
            ? "engineering"
            : domain === "finance"
              ? "financials"
              : "intelligence";
      return {
        ...snapshot,
        northstarModule: queryNorthstarModule(moduleId),
      };
    },
  };
  return serverSnapshotEnrichers;
}

export async function buildServerDailyBriefForPackId(
  packId: string | null | undefined,
  context: Parameters<EaDailyBriefBuilder>[0],
) {
  const builders = await loadServerDailyBriefBuilders();
  const builder = packId ? builders[packId] : null;
  return builder ? builder(context) : null;
}

export async function enrichServerBusinessSnapshotForPackId(
  packId: string | null | undefined,
  context: Parameters<EaBusinessSnapshotEnricher>[0],
  domain: Parameters<EaBusinessSnapshotEnricher>[1],
  snapshot: Record<string, unknown>,
) {
  const enrichers = await loadServerSnapshotEnrichers();
  const enricher = packId && enrichers ? enrichers[packId] : null;
  return enricher ? enricher(context, domain, snapshot) : snapshot;
}

export async function getServerBoardPackConfigForPackId(
  packId: string | null | undefined,
): Promise<EaBoardPackConfig | null> {
  if (!packId) return null;
  const cached = boardPackCache.get(packId);
  if (cached) return cached;
  const loader = boardPackLoaders[packId];
  if (!loader) return null;
  const config = await loader();
  boardPackCache.set(packId, config);
  return config;
}
