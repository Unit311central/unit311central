/**
 * OnwardAir Competitor Intelligence — weekly public-signal feed.
 *
 * Cadence: one brief per ISO week. Content is factual public posture only —
 * no strategy advice. Not a scraped news API.
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

const STORAGE_KEY = "unit311.onwardair.competitor-intelligence-feed.v3";
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

/** Rotate focus competitors; copy stays factual. */
const WEEKLY_WATCH_THEMES = [
  { focusId: "joby-aviation", theme: "FAA stage / TIA public posture" },
  { focusId: "beta-technologies", theme: "Dual CTOL/VTOL + cargo/utility programme" },
  { focusId: "archer-aviation", theme: "FAA MoC acceptance + disclosed partners" },
  { focusId: "vertical-aerospace", theme: "EASA SC-VTOL public target" },
  { focusId: "autoflight", theme: "Cargo variant TC reporting vs passenger path" },
  { focusId: "wisk-aero", theme: "FAA G-1 certification basis (Generation 6)" },
] as const;

function themeForWeek(weekKey: string) {
  const weekNum = Number(weekKey.split("-W")[1] ?? "1");
  return WEEKLY_WATCH_THEMES[(Math.max(1, weekNum) - 1) % WEEKLY_WATCH_THEMES.length]!;
}

function buildWeeklyBrief(weekKey: string): CompetitorIntelItem {
  const competitors = listCompetitors();
  const theme = themeForWeek(weekKey);
  const focus = competitors.find((c) => c.id === theme.focusId) ?? competitors[0]!;

  return {
    id: `weekly-brief-${weekKey}`,
    weekKey,
    publishedAt: weekStartIso(weekKey),
    category: "Weekly Brief",
    severity: "info",
    title: `Public signals · ${weekKey}`,
    summary: `Focus this week: ${focus.companyName}. ${theme.theme}. ${focus.certificationStatus || focus.certificationCategory}${focus.certAuthority ? ` (${focus.certAuthority})` : ""}.`,
    competitorId: focus.id,
    competitorName: focus.companyName,
    sourceLabel: "Curated public landscape",
    read: false,
    notified: false,
  };
}

function buildSignalItems(weekKey: string): CompetitorIntelItem[] {
  const theme = themeForWeek(weekKey);
  const focus = COMPETITOR_PROFILES.find((c) => c.id === theme.focusId);
  const publishedAt = new Date(weekStartIso(weekKey));
  publishedAt.setUTCHours(10, 0, 0, 0);

  const items: CompetitorIntelItem[] = [];

  if (!focus) return items;

  items.push({
    id: `signal-cert-${weekKey}-${focus.id}`,
    weekKey,
    publishedAt: publishedAt.toISOString(),
    category: "Certification",
    severity: "info",
    title: `${focus.companyName} · certification`,
    summary: [
      focus.certAuthority ? `Authority: ${focus.certAuthority}` : null,
      focus.certificationStatus || focus.certificationCategory,
      focus.nextCertMilestone ? `Next public milestone: ${focus.nextCertMilestone}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    competitorId: focus.id,
    competitorName: focus.companyName,
    sourceLabel: "Public certification / program reporting",
    read: false,
    notified: false,
  });

  if (focus.keyPartnerships || focus.fundingRaised) {
    const fundingTs = new Date(publishedAt);
    fundingTs.setUTCHours(14, 0, 0, 0);
    items.push({
      id: `signal-funding-${weekKey}-${focus.id}`,
      weekKey,
      publishedAt: fundingTs.toISOString(),
      category: focus.keyPartnerships ? "Partnership" : "Funding",
      severity: "info",
      title: `${focus.companyName} · capital & partners`,
      summary: [
        focus.fundingRaised ? `Funding: ${focus.fundingRaised}` : null,
        focus.keyPartnerships ? `Partnerships: ${focus.keyPartnerships}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      competitorId: focus.id,
      competitorName: focus.companyName,
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
  for (let i = 2; i >= 1; i--) {
    const d = new Date(now.getTime() - i * WEEK_MS);
    const key = getIsoWeekKey(d);
    const brief = buildWeeklyBrief(key);
    brief.read = true;
    brief.notified = true;
    items.push(brief, ...buildSignalItems(key).map((s) => ({ ...s, read: true, notified: true })));
  }
  return items.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
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

/** Unread weekly briefs for Home alerts — keep sparse. */
export function listCompetitorIntelHomeAlerts(): CompetitorIntelItem[] {
  return listCompetitorIntelFeed().filter((i) => !i.read && i.category === "Weekly Brief");
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

  const newItems =
    options?.force && already
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
