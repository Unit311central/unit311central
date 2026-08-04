/**
 * OnwardAir Competitor Intelligence — live weekly feed (certification race).
 *
 * Cadence: one competitive brief per ISO week (auto-created on Home / CI open).
 * Themes weighted Certification → Funding runway → Partnerships → cargo vs passenger.
 * Not a scraped news API. Blank / unknown fields stay blank.
 */

import { COMPETITOR_PROFILES, listCompetitors } from "@/lib/onwardair/competitor-intelligence-data";

export type CompetitorIntelSeverity = "critical" | "warning" | "info";

export type CompetitorIntelCategory =
  | "Weekly Brief"
  | "Certification"
  | "Funding"
  | "Partnership"
  | "Program";

export type CompetitorIntelItem = {
  id: string;
  weekKey: string;
  publishedAt: string;
  category: CompetitorIntelCategory;
  severity: CompetitorIntelSeverity;
  title: string;
  summary: string;
  competitorId?: string;
  competitorName?: string;
  sourceLabel: string;
  read: boolean;
  notified: boolean;
};

export type CompetitorIntelFeedState = {
  items: CompetitorIntelItem[];
  lastEnsuredWeekKey: string | null;
  lastEnsuredAt: string | null;
  updatedAt: string;
};

type Listener = () => void;

const STORAGE_KEY = "unit311.onwardair.competitor-intelligence-feed.v2";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

export function subscribeCompetitorIntelFeed(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** ISO week key e.g. 2026-W32 */
export function getIsoWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function weekStartIso(weekKey: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekKey);
  if (!match) return new Date().toISOString();
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7);
  return monday.toISOString();
}

function nextWeekLabel(from = new Date()): string {
  const next = new Date(from.getTime() + WEEK_MS);
  return next.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const WEEKLY_WATCH_THEMES = [
  {
    focusId: "joby-aviation",
    theme: "FAA certification stage language among US leaders",
    detail:
      "Watch TIA / stage progression and how FAA phrases means of compliance — inputs for Vertex pathway planning.",
  },
  {
    focusId: "beta-technologies",
    theme: "Cargo / utility cert race vs passenger vanity",
    detail:
      "Prioritize cargo-first flight hours and dual CTOL/VTOL tracks over passenger seat-count headlines.",
  },
  {
    focusId: "archer-aviation",
    theme: "Funding runway + manufacturing partnerships",
    detail:
      "Capital and OEM/airline partnerships that determine who survives a multi-year FAA slog.",
  },
  {
    focusId: "vertical-aerospace",
    theme: "EASA SC-VTOL credibility and capital stress",
    detail:
      "European dual-path watch: certification target dates only matter if funding runway holds.",
  },
  {
    focusId: "autoflight",
    theme: "Cargo variant certification ahead of passenger",
    detail:
      "CarryAll-style cargo TC signals reinforce middle-mile / utility-first certification strategy.",
  },
  {
    focusId: "volocopter",
    theme: "Certification without capital runway",
    detail:
      "Restructuring / funding stress cases — program credibility collapses when the balance sheet fails.",
  },
] as const;

function themeForWeek(weekKey: string) {
  const weekNum = Number(weekKey.split("-W")[1] ?? "1");
  return WEEKLY_WATCH_THEMES[(Math.max(1, weekNum) - 1) % WEEKLY_WATCH_THEMES.length]!;
}

function buildWeeklyBrief(weekKey: string): CompetitorIntelItem {
  const competitors = listCompetitors();
  const inCert = competitors.filter((c) => c.certificationCategory === "In Certification");
  const certified = competitors.filter(
    (c) => c.certificationCategory === "Certified / In Production",
  );
  const theme = themeForWeek(weekKey);
  const focus = competitors.find((c) => c.id === theme.focusId) ?? competitors[0]!;

  return {
    id: `weekly-brief-${weekKey}`,
    weekKey,
    publishedAt: weekStartIso(weekKey),
    category: "Weekly Brief",
    severity: "info",
    title: `Weekly cert-race brief · ${weekKey}`,
    summary: `${competitors.length} tracked competitors · ${inCert.length} in certification · ${certified.length} certified/in production. This week’s watch: ${theme.theme}. Focus: ${focus.companyName} (${focus.aircraftName || "program TBD"} · ${focus.certAuthority || "authority TBD"} · ${focus.missionFocus}) — ${theme.detail}`,
    competitorId: focus.id,
    competitorName: focus.companyName,
    sourceLabel: "OnwardAir Competitor Intelligence · cert-race cadence",
    read: false,
    notified: false,
  };
}

function buildSignalItems(weekKey: string): CompetitorIntelItem[] {
  const theme = themeForWeek(weekKey);
  const focus = COMPETITOR_PROFILES.find((c) => c.id === theme.focusId);
  const cargoMixed = COMPETITOR_PROFILES.filter(
    (c) => c.missionFocus === "Cargo / Utility" || c.missionFocus === "Mixed",
  ).slice(0, 2);
  const publishedAt = new Date(weekStartIso(weekKey));
  publishedAt.setUTCHours(10, 0, 0, 0);

  const items: CompetitorIntelItem[] = [];

  if (focus) {
    items.push({
      id: `signal-cert-${weekKey}-${focus.id}`,
      weekKey,
      publishedAt: publishedAt.toISOString(),
      category: "Certification",
      severity: focus.certificationCategory === "In Certification" ? "warning" : "info",
      title: `${focus.companyName} — certification watch`,
      summary: `${focus.certAuthority || "Authority TBD"} · ${focus.certificationStatus || focus.certificationCategory}. Next milestone: ${focus.nextCertMilestone || "—"}. OA relevance: ${focus.oaRelevance}`,
      competitorId: focus.id,
      competitorName: focus.companyName,
      sourceLabel: "Public certification / program reporting",
      read: false,
      notified: false,
    });

    if (focus.fundingRaised || focus.keyPartnerships) {
      const fundingTs = new Date(publishedAt);
      fundingTs.setUTCHours(14, 0, 0, 0);
      items.push({
        id: `signal-funding-${weekKey}-${focus.id}`,
        weekKey,
        publishedAt: fundingTs.toISOString(),
        category: focus.keyPartnerships ? "Partnership" : "Funding",
        severity: "info",
        title: `${focus.companyName} — runway & partners`,
        summary: `Funding: ${focus.fundingRaised || "—"}. Partnerships: ${focus.keyPartnerships || "—"}. Surviving the cert slog matters as much as stage language.`,
        competitorId: focus.id,
        competitorName: focus.companyName,
        sourceLabel: "Public company / industry reporting",
        read: false,
        notified: false,
      });
    }
  }

  for (const [i, c] of cargoMixed.entries()) {
    if (c.id === focus?.id) continue;
    const ts = new Date(publishedAt);
    ts.setUTCDate(ts.getUTCDate() + i + 1);
    items.push({
      id: `signal-program-${weekKey}-${c.id}`,
      weekKey,
      publishedAt: ts.toISOString(),
      category: "Program",
      severity: "info",
      title: `${c.companyName} — ${c.missionFocus} mission`,
      summary: `${c.aircraftName || "Program"} · ${c.certAuthority || "authority TBD"}. Status: ${c.certificationStatus || c.certificationCategory}. ${c.oaRelevance}`,
      competitorId: c.id,
      competitorName: c.companyName,
      sourceLabel: "Public company / industry reporting",
      read: false,
      notified: false,
    });
  }

  return items;
}

function seedHistoricalFeed(): CompetitorIntelItem[] {
  const now = new Date();
  const items: CompetitorIntelItem[] = [];
  for (let i = 3; i >= 1; i--) {
    const d = new Date(now.getTime() - i * WEEK_MS);
    const key = getIsoWeekKey(d);
    const brief = buildWeeklyBrief(key);
    brief.read = true;
    brief.notified = true;
    items.push(brief, ...buildSignalItems(key).map((s) => ({ ...s, read: true, notified: true })));
  }
  return items.sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );
}

const EMPTY_SERVER_SNAPSHOT: CompetitorIntelFeedState = {
  items: [],
  lastEnsuredWeekKey: null,
  lastEnsuredAt: null,
  updatedAt: "1970-01-01T00:00:00.000Z",
};

function loadState(): CompetitorIntelFeedState {
  if (typeof window === "undefined") {
    return EMPTY_SERVER_SNAPSHOT;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CompetitorIntelFeedState;
      if (parsed && Array.isArray(parsed.items)) return parsed;
    }
  } catch {
    /* ignore */
  }
  const seeded: CompetitorIntelFeedState = {
    items: seedHistoricalFeed(),
    lastEnsuredWeekKey: null,
    lastEnsuredAt: null,
    updatedAt: new Date().toISOString(),
  };
  persist(seeded);
  return seeded;
}

function persist(state: CompetitorIntelFeedState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

let state: CompetitorIntelFeedState | null = null;

function getState(): CompetitorIntelFeedState {
  if (!state) state = loadState();
  return state;
}

function setState(next: Omit<CompetitorIntelFeedState, "updatedAt"> | CompetitorIntelFeedState) {
  state = { ...next, updatedAt: new Date().toISOString() };
  persist(state);
  emit();
  return state;
}

export function getCompetitorIntelFeedSnapshot(): CompetitorIntelFeedState {
  return getState();
}

/** Stable server snapshot for useSyncExternalStore (avoids React #185). */
export function getCompetitorIntelFeedServerSnapshot(): CompetitorIntelFeedState {
  return EMPTY_SERVER_SNAPSHOT;
}

export function listCompetitorIntelFeed(): CompetitorIntelItem[] {
  return getState()
    .items.slice()
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

export function listUnreadCompetitorIntelNotifications(): CompetitorIntelItem[] {
  return listCompetitorIntelFeed().filter((i) => !i.read);
}

/** Unread weekly briefs + unread high-signal items for Home alerts. */
export function listCompetitorIntelHomeAlerts(): CompetitorIntelItem[] {
  return listCompetitorIntelFeed().filter(
    (i) => !i.read && (i.category === "Weekly Brief" || i.severity === "warning" || i.severity === "critical"),
  );
}

export function getCompetitorIntelCadence() {
  const snap = getState();
  const weekKey = getIsoWeekKey();
  const due = !snap.lastEnsuredWeekKey || snap.lastEnsuredWeekKey !== weekKey;
  return {
    currentWeekKey: weekKey,
    lastEnsuredWeekKey: snap.lastEnsuredWeekKey,
    lastEnsuredAt: snap.lastEnsuredAt,
    weeklyRefreshDue: due,
    nextRefreshLabel: nextWeekLabel(),
    unreadCount: listCompetitorIntelHomeAlerts().length,
  };
}

/**
 * Ensure this ISO week’s live brief + signals exist.
 * Called from Home (exec dashboard) and Competitor Intelligence workspace.
 */
export function ensureWeeklyCompetitorIntelligenceRefresh(options?: {
  force?: boolean;
}): {
  created: boolean;
  weekKey: string;
  newItems: CompetitorIntelItem[];
} {
  const weekKey = getIsoWeekKey();
  const snap = getState();
  const already = snap.items.some((i) => i.id === `weekly-brief-${weekKey}`);

  if (already && !options?.force) {
    if (snap.lastEnsuredWeekKey !== weekKey) {
      // Update metadata without notify loops during render paths.
      state = {
        ...snap,
        lastEnsuredWeekKey: weekKey,
        lastEnsuredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persist(state);
    }
    return { created: false, weekKey, newItems: [] };
  }

  const newItems = options?.force && already
    ? [
        {
          ...buildWeeklyBrief(weekKey),
          id: `weekly-brief-${weekKey}-refresh-${Date.now().toString(36)}`,
          publishedAt: new Date().toISOString(),
        },
      ]
    : [buildWeeklyBrief(weekKey), ...buildSignalItems(weekKey)];

  const existingIds = new Set(snap.items.map((i) => i.id));
  const toAdd = newItems.filter((i) => !existingIds.has(i.id));

  setState({
    items: [...toAdd, ...snap.items],
    lastEnsuredWeekKey: weekKey,
    lastEnsuredAt: new Date().toISOString(),
  });

  return { created: toAdd.length > 0, weekKey, newItems: toAdd };
}

export function markCompetitorIntelRead(id: string) {
  const snap = getState();
  setState({
    ...snap,
    items: snap.items.map((i) => (i.id === id ? { ...i, read: true, notified: true } : i)),
  });
}

export function markAllCompetitorIntelRead() {
  const snap = getState();
  setState({
    ...snap,
    items: snap.items.map((i) => ({ ...i, read: true, notified: true })),
  });
}

export function markCompetitorIntelNotified(ids: string[]) {
  if (!ids.length) return;
  const set = new Set(ids);
  const snap = getState();
  setState({
    ...snap,
    items: snap.items.map((i) => (set.has(i.id) ? { ...i, notified: true } : i)),
  });
}
