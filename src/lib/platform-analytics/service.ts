import { createHash } from "node:crypto";

import {
  adoptionScore,
  DEFAULT_INTENSITY_WEIGHT,
  DEFAULT_REACH_WEIGHT,
  intensityFromEventsPerUser,
} from "@/lib/platform-analytics/adoption";
import { periodStartIso, priorPeriodWindow } from "@/lib/platform-analytics/period";
import {
  allModuleKeys,
  COMPARISON_WORKSPACES,
  moduleLabel,
  NAV_PAGE_NODES,
  pagesForModule,
  resolveTaxonomyForView,
  workspaceLabel,
  type WorkspaceFilterKey,
} from "@/lib/platform-analytics/taxonomy";
import type {
  EaTrendPoint,
  FeatureOpportunityRow,
  ModuleAdoptionRow,
  PageAdoptionRow,
  PlatformAnalyticsPeriod,
  PlatformAnalyticsSummary,
  PlatformUsageEventInput,
  SectionAdoptionRow,
  UsageTrendPoint,
  WorkspaceAdoptionRow,
} from "@/lib/platform-analytics/types";
import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";

const TABLE = "platform_usage_events";

type DbEvent = {
  id: string;
  workspace_id: string | null;
  workspace_key: string;
  module_key: string;
  page_key: string;
  user_role: string;
  user_hash: string | null;
  source: string;
  occurred_at: string;
};

function randomId() {
  return `pue_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function hashUserId(userId: string | null | undefined): string | null {
  if (!userId?.trim()) return null;
  return createHash("sha256").update(userId.trim()).digest("hex").slice(0, 24);
}

export async function insertPlatformUsageEvent(input: {
  workspaceId: string | null;
  workspaceKey: string;
  userRole: string;
  userHash: string | null;
  event: PlatformUsageEventInput;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseServiceRoleConfigured()) {
    return { ok: false, error: "Supabase service role is not configured." };
  }

  const taxonomy = resolveTaxonomyForView(input.event.pageKey);
  const moduleKey = input.event.moduleKey?.trim() || taxonomy?.moduleKey || "unknown";
  const pageKey = input.event.pageKey.trim();
  if (!pageKey) return { ok: false, error: "pageKey is required." };

  const row = {
    id: randomId(),
    workspace_id: input.workspaceId,
    workspace_key: input.workspaceKey,
    module_key: moduleKey,
    page_key: pageKey,
    user_role: input.userRole || "anonymous",
    user_hash: input.userHash,
    source: input.event.source ?? "nav",
    occurred_at: input.event.occurredAt ?? new Date().toISOString(),
  };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from(TABLE).insert(row);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function loadEvents(fromIso: string | null, toIso: string): Promise<DbEvent[]> {
  if (!isSupabaseServiceRoleConfigured()) return [];
  const supabase = createSupabaseServiceRoleClient();
  let query = supabase
    .from(TABLE)
    .select(
      "id, workspace_id, workspace_key, module_key, page_key, user_role, user_hash, source, occurred_at",
    )
    .lte("occurred_at", toIso)
    .order("occurred_at", { ascending: false })
    .limit(25000);

  if (fromIso) query = query.gte("occurred_at", fromIso);

  const { data, error } = await query;
  if (error) {
    console.warn("[platform-analytics] load events failed", error.message);
    return [];
  }
  return (data ?? []) as DbEvent[];
}

function userKey(e: DbEvent) {
  return e.user_hash || `anon:${e.user_role}:${e.workspace_key}`;
}

function scoreBundle(events: DbEvent[], universeUsers: number) {
  const users = new Set(events.map(userKey));
  const reach = universeUsers > 0 ? users.size / universeUsers : events.length > 0 ? 1 : 0;
  const epu = users.size > 0 ? events.length / users.size : 0;
  const intensity = intensityFromEventsPerUser(epu) / 100;
  return {
    reach,
    intensity,
    score: adoptionScore({ reach, intensity }),
    users: users.size,
    events: events.length,
  };
}

function filterByWorkspace(events: DbEvent[], workspaceFilter: WorkspaceFilterKey): DbEvent[] {
  if (workspaceFilter === "all") return events;
  return events.filter((e) => e.workspace_key === workspaceFilter);
}

function buildPageRow(
  pageKey: string,
  events: DbEvent[],
  universeUsers: number,
): PageAdoptionRow {
  const tax = resolveTaxonomyForView(pageKey);
  const node = tax ?? NAV_PAGE_NODES.find((n) => n.pageKey === pageKey);
  const scoped = events.filter((e) => e.page_key === pageKey);
  const bundle = scoreBundle(scoped, universeUsers);
  return {
    pageKey,
    pageLabel: node?.pageLabel ?? pageKey,
    moduleKey: node?.moduleKey ?? scoped[0]?.module_key ?? "unknown",
    moduleLabel: moduleLabel(node?.moduleKey ?? scoped[0]?.module_key ?? "unknown"),
    sectionKey: node?.sectionKey ?? null,
    sectionLabel: node?.sectionLabel ?? null,
    adoptionScore: bundle.score,
    reachPct: Math.round(bundle.reach * 100),
    intensityScore: Math.round(bundle.intensity * 100),
    users: bundle.users,
    neverUsed: bundle.events === 0,
  };
}

function buildModuleRow(moduleKey: string, events: DbEvent[], universeUsers: number): ModuleAdoptionRow {
  const nodes = pagesForModule(moduleKey);
  const pageKeys = [...new Set(nodes.map((n) => n.pageKey))];
  const moduleEvents = events.filter(
    (e) => e.module_key === moduleKey || pageKeys.includes(e.page_key),
  );
  const bundle = scoreBundle(moduleEvents, universeUsers);
  const pages = pageKeys
    .map((pageKey) => buildPageRow(pageKey, events, universeUsers))
    .sort((a, b) => b.adoptionScore - a.adoptionScore || a.pageLabel.localeCompare(b.pageLabel));

  const sectionMap = new Map<string, SectionAdoptionRow>();
  for (const p of pages) {
    if (!p.sectionKey || !p.sectionLabel) continue;
    const existing = sectionMap.get(p.sectionKey);
    if (!existing) {
      sectionMap.set(p.sectionKey, {
        sectionKey: p.sectionKey,
        sectionLabel: p.sectionLabel,
        moduleKey,
        adoptionScore: p.adoptionScore,
        pages: [p],
      });
    } else {
      existing.pages.push(p);
      existing.adoptionScore = Math.round(
        existing.pages.reduce((s, x) => s + x.adoptionScore, 0) / existing.pages.length,
      );
    }
  }

  const used = pages.filter((p) => !p.neverUsed);
  const unused = pages.filter((p) => p.neverUsed);

  return {
    moduleKey,
    moduleLabel: moduleLabel(moduleKey),
    adoptionScore: bundle.score,
    reachPct: Math.round(bundle.reach * 100),
    intensityScore: Math.round(bundle.intensity * 100),
    users: bundle.users,
    pageCount: pages.length,
    pagesUsed: used.length,
    topPages: used.slice(0, 3).map((p) => p.pageLabel),
    leastPages: [...unused, ...[...used].reverse()].slice(0, 3).map((p) => p.pageLabel),
    sections: [...sectionMap.values()].sort((a, b) => b.adoptionScore - a.adoptionScore),
    pages,
  };
}

function categorizeEaTopic(actionName: string, module: string): string {
  const text = `${actionName} ${module}`.toLowerCase();
  if (/train|course|lms|compliance/.test(text)) return "Training & LMS";
  if (/client|crm|pipeline|onboard|member/.test(text)) return "CRM / clients";
  if (/invoice|finance|ledger|receivable|payable|ar\b/.test(text)) return "Finance / AR";
  if (/ticket|support/.test(text)) return "Support";
  if (/hr|employee|payroll|recruit/.test(text)) return "People / HR";
  if (/open|navigate|view|goto|switch/.test(text)) return "Navigation & find";
  return "Other";
}

export async function buildPlatformAnalyticsSummary(
  period: PlatformAnalyticsPeriod,
  workspaceFilter: WorkspaceFilterKey = "all",
): Promise<PlatformAnalyticsSummary> {
  const now = new Date();
  const to = now.toISOString();
  const from = periodStartIso(period, now);
  const allEvents = await loadEvents(from, to);
  const events = filterByWorkspace(allEvents, workspaceFilter);
  const priorWindow = priorPeriodWindow(period, now);
  const priorAll = priorWindow ? await loadEvents(priorWindow.from, priorWindow.to) : [];
  const priorEvents = filterByWorkspace(priorAll, workspaceFilter);

  const universeUsers = new Set(events.map(userKey)).size || 1;

  const moduleKeys = allModuleKeys().filter((k) => k !== "settings" && k !== "home");
  const modules = moduleKeys
    .map((key) => buildModuleRow(key, events, universeUsers))
    .sort((a, b) => b.adoptionScore - a.adoptionScore || b.pagesUsed - a.pagesUsed);

  const modulesMost = modules.filter((m) => m.pagesUsed > 0 || m.adoptionScore > 0).slice(0, 12);
  const modulesLeast = [...modules]
    .sort((a, b) => a.adoptionScore - b.adoptionScore || a.pagesUsed - b.pagesUsed)
    .slice(0, 12);

  const allPages = NAV_PAGE_NODES.filter((n) => n.moduleKey !== "settings")
    .map((n) => n.pageKey)
    .filter((key, index, arr) => arr.indexOf(key) === index)
    .map((pageKey) => buildPageRow(pageKey, events, universeUsers));

  const pagesMost = [...allPages]
    .filter((p) => !p.neverUsed)
    .sort((a, b) => b.adoptionScore - a.adoptionScore)
    .slice(0, 15);
  const pagesLeast = [...allPages]
    .sort((a, b) => a.adoptionScore - b.adoptionScore || Number(a.neverUsed) - Number(b.neverUsed))
    .slice(0, 15);
  const neverUsedPages = allPages.filter((p) => p.neverUsed).slice(0, 25);

  const workspaceComparison: WorkspaceAdoptionRow[] = COMPARISON_WORKSPACES.map((ws) => {
    const scoped = allEvents.filter((e) => e.workspace_key === ws.key);
    const wsUsers = new Set(scoped.map(userKey)).size || 1;
    const wsModules = allModuleKeys()
      .filter((k) => k !== "settings" && k !== "home")
      .map((key) => buildModuleRow(key, scoped, wsUsers))
      .sort((a, b) => b.adoptionScore - a.adoptionScore);
    const wsPages = allPages
      .map((p) => buildPageRow(p.pageKey, scoped, wsUsers))
      .sort((a, b) => b.adoptionScore - a.adoptionScore);
    const overall = scoreBundle(
      scoped.filter((e) => e.module_key !== "settings"),
      wsUsers,
    );
    return {
      workspaceKey: ws.key,
      workspaceLabel: ws.label,
      adoptionScore: overall.score,
      topModules: wsModules
        .filter((m) => m.adoptionScore > 0)
        .slice(0, 3)
        .map((m) => m.moduleLabel),
      leastModules: [...wsModules]
        .reverse()
        .slice(0, 3)
        .map((m) => m.moduleLabel),
      topPages: wsPages
        .filter((p) => !p.neverUsed)
        .slice(0, 3)
        .map((p) => p.pageLabel),
      leastPages: [...wsPages]
        .filter((p) => p.neverUsed || p.adoptionScore < 20)
        .slice(0, 3)
        .map((p) => p.pageLabel),
      eaAdoption: buildModuleRow("executive-assistant", scoped, wsUsers).adoptionScore,
      trainingAdoption: buildModuleRow("training", scoped, wsUsers).adoptionScore,
      users: new Set(scoped.map(userKey)).size,
    };
  });

  // Ensure labels even when empty
  for (const row of workspaceComparison) {
    if (!row.topModules.length) row.topModules = ["—"];
    if (!row.leastModules.length) row.leastModules = ["—"];
    if (!row.topPages.length) row.topPages = ["—"];
    if (!row.leastPages.length) row.leastPages = ["—"];
  }

  const eaUsage = events.filter((e) => e.module_key === "executive-assistant");
  const eaAudit = await loadEaAudit(from, to, workspaceFilter);
  const eaConversations = await loadEaConversations(from, to, workspaceFilter);

  const actionCounts = new Map<string, number>();
  for (const row of eaAudit) {
    const name = row.action_name || row.action_id || "Unknown action";
    actionCounts.set(name, (actionCounts.get(name) ?? 0) + 1);
  }
  const mostUsedActions = [...actionCounts.entries()]
    .map(([actionName, count]) => ({ actionName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topicCounts = new Map<string, number>();
  for (const row of eaAudit) {
    const topic = categorizeEaTopic(row.action_name, row.module);
    topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
  }
  if (topicCounts.size === 0 && eaUsage.length > 0) {
    topicCounts.set("Navigation & find", eaUsage.length);
  }
  const topicTotal = [...topicCounts.values()].reduce((a, b) => a + b, 0) || 1;
  const topics = [...topicCounts.entries()]
    .map(([topic, count]) => ({
      topic,
      count,
      sharePct: Math.round((count / topicTotal) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const eaUsers = new Set([
    ...eaUsage.map(userKey),
    ...eaConversations.map((c) => c.user_id || c.id),
    ...eaAudit.map((a) => a.user_id),
  ]);

  const byWorkspace = COMPARISON_WORKSPACES.map((ws) => {
    const conv = eaConversations.filter((c) => c.workspace_key === ws.key);
    const actions = eaAudit.filter((a) => a.workspace_key === ws.key);
    const usage = allEvents.filter(
      (e) => e.workspace_key === ws.key && e.module_key === "executive-assistant",
    );
    const wsUsers = new Set(usage.map(userKey));
    for (const c of conv) if (c.user_id) wsUsers.add(c.user_id);
    for (const a of actions) if (a.user_id) wsUsers.add(a.user_id);
    return {
      workspaceKey: ws.key,
      workspaceLabel: ws.label,
      conversations: conv.length,
      actions: actions.length,
      users: wsUsers.size,
      adoptionScore:
        workspaceComparison.find((w) => w.workspaceKey === ws.key)?.eaAdoption ?? 0,
    };
  });

  const usageTrend = buildUsageTrend(events, from, now);
  const eaTrend = buildEaTrend(eaConversations, eaAudit, from, now);

  const featureOpportunities = buildOpportunities(modules, allPages, events, priorEvents);

  return {
    period,
    workspaceFilter,
    from,
    to,
    generatedAt: now.toISOString(),
    adoptionModel: {
      reachWeight: DEFAULT_REACH_WEIGHT,
      intensityWeight: DEFAULT_INTENSITY_WEIGHT,
      notes:
        "Tunable default: adoption ≈ reach×0.6 + intensity×0.4. Drill from module → section → page. Raw event counts are not shown.",
    },
    modules,
    modulesMost: modulesMost.length ? modulesMost : modules.slice(0, 8),
    modulesLeast,
    pagesMost,
    pagesLeast,
    neverUsedPages,
    workspaceComparison,
    usageTrend,
    executiveAssistant: {
      conversations: eaConversations.length,
      actions: eaAudit.length,
      users: eaUsers.size,
      workspacesActive: byWorkspace.filter(
        (w) => w.conversations > 0 || w.actions > 0 || w.adoptionScore > 0,
      ).length,
      mostUsedActions,
      topics,
      byWorkspace,
      trend: eaTrend,
    },
    featureOpportunities,
  };
}

async function loadEaAudit(
  fromIso: string | null,
  toIso: string,
  workspaceFilter: WorkspaceFilterKey,
) {
  if (!isSupabaseServiceRoleConfigured()) {
    return [] as Array<{
      action_id: string;
      action_name: string;
      module: string;
      user_id: string;
      workspace_id: string | null;
      workspace_key: string;
      created_at: string;
    }>;
  }
  const supabase = createSupabaseServiceRoleClient();
  let query = supabase
    .from("executive_assistant_action_audit")
    .select("action_id, action_name, module, user_id, workspace_id, created_at")
    .lte("created_at", toIso)
    .limit(5000);
  if (fromIso) query = query.gte("created_at", fromIso);
  const { data } = await query;
  const workspaceIds = [...new Set((data ?? []).map((r) => r.workspace_id).filter(Boolean))];
  const keyById = await mapWorkspaceIdsToKeys(workspaceIds as string[]);
  const rows = (data ?? []).map((r) => ({
    ...r,
    workspace_key: (r.workspace_id && keyById.get(r.workspace_id)) || "unknown",
  }));
  if (workspaceFilter === "all") return rows;
  return rows.filter((r) => r.workspace_key === workspaceFilter);
}

async function loadEaConversations(
  fromIso: string | null,
  toIso: string,
  workspaceFilter: WorkspaceFilterKey,
) {
  if (!isSupabaseServiceRoleConfigured()) {
    return [] as Array<{
      id: string;
      user_id: string | null;
      workspace_id: string | null;
      workspace_key: string;
      created_at: string;
    }>;
  }
  const supabase = createSupabaseServiceRoleClient();
  let query = supabase
    .from("executive_assistant_conversations")
    .select("id, user_id, workspace_id, created_at")
    .lte("created_at", toIso)
    .limit(5000);
  if (fromIso) query = query.gte("created_at", fromIso);
  const { data } = await query;
  const workspaceIds = [...new Set((data ?? []).map((r) => r.workspace_id).filter(Boolean))];
  const keyById = await mapWorkspaceIdsToKeys(workspaceIds as string[]);
  const rows = (data ?? []).map((r) => ({
    ...r,
    workspace_key: (r.workspace_id && keyById.get(r.workspace_id)) || "unknown",
  }));
  if (workspaceFilter === "all") return rows;
  return rows.filter((r) => r.workspace_key === workspaceFilter);
}

async function mapWorkspaceIdsToKeys(ids: string[]) {
  const map = new Map<string, string>();
  if (!ids.length || !isSupabaseServiceRoleConfigured()) return map;
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase.from("workspaces").select("id, slug").in("id", ids);
  for (const row of data ?? []) {
    const slug = String(row.slug ?? "").toLowerCase();
    if (slug === "unit311") map.set(String(row.id), "internal");
    else map.set(String(row.id), slug || "unknown");
  }
  return map;
}

function buildUsageTrend(events: DbEvent[], fromIso: string | null, now: Date): UsageTrendPoint[] {
  const buckets = 4;
  const end = now.getTime();
  const start = fromIso ? new Date(fromIso).getTime() : end - 30 * 24 * 60 * 60 * 1000;
  const span = Math.max(1, end - start);
  const points: UsageTrendPoint[] = Array.from({ length: buckets }, (_, i) => ({
    bucket: `P${i + 1}`,
    adoptionScore: 0,
    activeUsers: 0,
  }));
  for (let i = 0; i < buckets; i++) {
    const bStart = start + (span * i) / buckets;
    const bEnd = start + (span * (i + 1)) / buckets;
    const slice = events.filter((e) => {
      const t = new Date(e.occurred_at).getTime();
      return t >= bStart && t < bEnd;
    });
    const users = new Set(slice.map(userKey));
    const universe = users.size || 1;
    const bundle = scoreBundle(slice, universe);
    points[i] = {
      bucket: `P${i + 1}`,
      adoptionScore: bundle.score,
      activeUsers: users.size,
    };
  }
  return points;
}

function buildEaTrend(
  conversations: Array<{ created_at: string }>,
  actions: Array<{ created_at: string }>,
  fromIso: string | null,
  now: Date,
): EaTrendPoint[] {
  const buckets = 4;
  const end = now.getTime();
  const start = fromIso ? new Date(fromIso).getTime() : end - 30 * 24 * 60 * 60 * 1000;
  const span = Math.max(1, end - start);
  const points = Array.from({ length: buckets }, (_, i) => ({
    bucket: `P${i + 1}`,
    conversations: 0,
    actions: 0,
  }));
  const place = (iso: string, field: "conversations" | "actions") => {
    const t = new Date(iso).getTime();
    const idx = Math.min(buckets - 1, Math.max(0, Math.floor(((t - start) / span) * buckets)));
    points[idx]![field] += 1;
  };
  for (const c of conversations) place(c.created_at, "conversations");
  for (const a of actions) place(a.created_at, "actions");
  return points;
}

function buildOpportunities(
  modules: ModuleAdoptionRow[],
  pages: PageAdoptionRow[],
  current: DbEvent[],
  prior: DbEvent[],
): FeatureOpportunityRow[] {
  const out: FeatureOpportunityRow[] = [];
  const median =
    modules.length > 0
      ? [...modules].sort((a, b) => a.adoptionScore - b.adoptionScore)[
          Math.floor(modules.length / 2)
        ]!.adoptionScore
      : 0;

  for (const m of modules) {
    const core = NAV_PAGE_NODES.some((n) => n.moduleKey === m.moduleKey && n.core);
    if (core && m.adoptionScore < median && m.pagesUsed > 0) {
      out.push({
        type: "high_visibility_low_adoption",
        label: m.moduleLabel,
        detail: `Core module below median adoption (${m.adoptionScore}). Weak pages: ${m.leastPages.join(", ")}.`,
        moduleKey: m.moduleKey,
      });
    }
  }

  for (const p of pages) {
    if (!p.neverUsed) continue;
    const core = NAV_PAGE_NODES.some((n) => n.pageKey === p.pageKey && n.core);
    if (!core) continue;
    out.push({
      type: "never_used",
      label: `${p.moduleLabel} → ${p.pageLabel}`,
      detail: "No adoption in the selected period.",
      moduleKey: p.moduleKey,
      pageKey: p.pageKey,
    });
  }

  if (prior.length > 0) {
    for (const m of modules) {
      const cur = current.filter((e) => e.module_key === m.moduleKey).length;
      const prev = prior.filter((e) => e.module_key === m.moduleKey).length;
      if (cur >= 5 && prev > 0 && cur / prev >= 1.25) {
        out.push({
          type: "emerging",
          label: m.moduleLabel,
          detail: `Usage up ${Math.round((cur / prev - 1) * 100)}% vs prior window.`,
          moduleKey: m.moduleKey,
        });
      }
    }
  }

  for (const m of modules) {
    if (m.pagesUsed === 0 && m.pageCount > 0) {
      out.push({
        type: "needs_enablement",
        label: m.moduleLabel,
        detail: "No page adoption in scope — enablement recommended.",
        moduleKey: m.moduleKey,
      });
    }
  }

  const seen = new Set<string>();
  return out
    .filter((row) => {
      const key = `${row.type}:${row.moduleKey}:${row.pageKey ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 40);
}
