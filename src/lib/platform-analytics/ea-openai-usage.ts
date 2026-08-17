import { estimateModelCostUsd } from "@/lib/ai-operating-assistant/model-cost";
import { loadEaModelUsageRows } from "@/lib/ai-operating-assistant/model-usage-service";
import { workspaceLabel } from "@/lib/platform-analytics/taxonomy";
import type { WorkspaceFilterKey } from "@/lib/platform-analytics/taxonomy";
import type { EaOpenAiUsageSummary } from "@/lib/platform-analytics/types";

type UsageRow = Awaited<ReturnType<typeof loadEaModelUsageRows>>[number];

function tokenCount(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function rowCost(row: UsageRow): number {
  return estimateModelCostUsd(
    row.model,
    tokenCount(row.input_tokens),
    tokenCount(row.output_tokens),
  );
}

function bucketIndex(createdAt: string, start: number, span: number, buckets: number): number {
  const t = new Date(createdAt).getTime();
  return Math.min(buckets - 1, Math.max(0, Math.floor(((t - start) / span) * buckets)));
}

export async function buildEaOpenAiUsageSummary(
  fromIso: string | null,
  toIso: string,
  workspaceFilter: WorkspaceFilterKey,
  workspaceKeyById: Map<string, string>,
): Promise<EaOpenAiUsageSummary> {
  const rows = await loadEaModelUsageRows(fromIso, toIso);
  const scoped =
    workspaceFilter === "all"
      ? rows
      : rows.filter((row) => {
          const key =
            (row.workspace_id && workspaceKeyById.get(row.workspace_id)) || "unknown";
          return key === workspaceFilter;
        });

  const byModel = new Map<
    string,
    { calls: number; inputTokens: number; outputTokens: number; estimatedCostUsd: number }
  >();
  const byCallSite = new Map<string, { calls: number; estimatedCostUsd: number }>();
  const byWorkspace = new Map<
    string,
    { calls: number; inputTokens: number; outputTokens: number; estimatedCostUsd: number }
  >();

  let inputTokens = 0;
  let outputTokens = 0;
  let totalTokens = 0;
  let estimatedCostUsd = 0;
  let successfulCalls = 0;
  let failedCalls = 0;

  for (const row of scoped) {
    const inTok = tokenCount(row.input_tokens);
    const outTok = tokenCount(row.output_tokens);
    const totTok = tokenCount(row.total_tokens) || inTok + outTok;
    const cost = rowCost(row);

    inputTokens += inTok;
    outputTokens += outTok;
    totalTokens += totTok;
    estimatedCostUsd += cost;
    if (row.success) successfulCalls += 1;
    else failedCalls += 1;

    const modelAgg = byModel.get(row.model) ?? {
      calls: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
    };
    modelAgg.calls += 1;
    modelAgg.inputTokens += inTok;
    modelAgg.outputTokens += outTok;
    modelAgg.estimatedCostUsd += cost;
    byModel.set(row.model, modelAgg);

    const siteAgg = byCallSite.get(row.call_site) ?? { calls: 0, estimatedCostUsd: 0 };
    siteAgg.calls += 1;
    siteAgg.estimatedCostUsd += cost;
    byCallSite.set(row.call_site, siteAgg);

    const wsKey =
      (row.workspace_id && workspaceKeyById.get(row.workspace_id)) || "unknown";
    const wsAgg = byWorkspace.get(wsKey) ?? {
      calls: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
    };
    wsAgg.calls += 1;
    wsAgg.inputTokens += inTok;
    wsAgg.outputTokens += outTok;
    wsAgg.estimatedCostUsd += cost;
    byWorkspace.set(wsKey, wsAgg);
  }

  const buckets = 4;
  const end = new Date(toIso).getTime();
  const start = fromIso ? new Date(fromIso).getTime() : end - 30 * 24 * 60 * 60 * 1000;
  const span = Math.max(1, end - start);
  const trend = Array.from({ length: buckets }, (_, i) => ({
    bucket: `P${i + 1}`,
    calls: 0,
    totalTokens: 0,
    estimatedCostUsd: 0,
  }));

  for (const row of scoped) {
    const idx = bucketIndex(row.created_at, start, span, buckets);
    const inTok = tokenCount(row.input_tokens);
    const outTok = tokenCount(row.output_tokens);
    const totTok = tokenCount(row.total_tokens) || inTok + outTok;
    trend[idx]!.calls += 1;
    trend[idx]!.totalTokens += totTok;
    trend[idx]!.estimatedCostUsd += rowCost(row);
  }

  return {
    apiCalls: scoped.length,
    successfulCalls,
    failedCalls,
    inputTokens,
    outputTokens,
    totalTokens,
    estimatedCostUsd: Math.round(estimatedCostUsd * 1_000_000) / 1_000_000,
    costIsEstimate: true,
    byModel: [...byModel.entries()]
      .map(([model, agg]) => ({
        model,
        ...agg,
        estimatedCostUsd: Math.round(agg.estimatedCostUsd * 1_000_000) / 1_000_000,
      }))
      .sort((a, b) => b.estimatedCostUsd - a.estimatedCostUsd),
    byCallSite: [...byCallSite.entries()]
      .map(([callSite, agg]) => ({
        callSite,
        ...agg,
        estimatedCostUsd: Math.round(agg.estimatedCostUsd * 1_000_000) / 1_000_000,
      }))
      .sort((a, b) => b.estimatedCostUsd - a.estimatedCostUsd),
    byWorkspace: [...byWorkspace.entries()]
      .map(([workspaceKey, agg]) => ({
        workspaceKey,
        workspaceLabel: workspaceLabel(workspaceKey),
        ...agg,
        estimatedCostUsd: Math.round(agg.estimatedCostUsd * 1_000_000) / 1_000_000,
      }))
      .sort((a, b) => b.estimatedCostUsd - a.estimatedCostUsd),
    trend: trend.map((point) => ({
      ...point,
      estimatedCostUsd: Math.round(point.estimatedCostUsd * 1_000_000) / 1_000_000,
    })),
  };
}
