"use client";

import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from "react";
import { useSearchParams } from "next/navigation";

import {
  createBlankTicketInput,
  formatSupportDate,
  priorityBadgeClass,
  SUPPORT_PRIORITIES,
  SUPPORT_PRIORITY_LABELS,
  ticketFieldsEqual,
  type SupportTicket,
  type SupportTicketPriority,
} from "@/lib/support-data";
import { cn } from "@/lib/utils";
import SupportTicketClientActions from "@/components/testflighthub/SupportTicketClientActions";
import ResponsiveMasterDetail, {
  useMobileDetailPanel,
} from "@/components/ui/ResponsiveMasterDetail";
import { Archive, ArchiveRestore, BarChart3, Loader2, Plus, Save, Search, Trash2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SupportStatsPeriod = "week" | "month" | "quarter";

const STATS_PERIOD_LABELS: Record<SupportStatsPeriod, string> = {
  week: "Last week",
  month: "Last month",
  quarter: "Last quarter",
};

function periodStart(period: SupportStatsPeriod): Date {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  if (period === "week") return new Date(now - 7 * dayMs);
  if (period === "month") return new Date(now - 30 * dayMs);
  return new Date(now - 90 * dayMs);
}

function ticketInPeriod(ticket: SupportTicket, period: SupportStatsPeriod) {
  const start = periodStart(period);
  return new Date(ticket.updatedAt).getTime() >= start.getTime();
}

function hoursBetween(startIso: string, endMs = Date.now()) {
  const start = new Date(startIso).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.max(0, (endMs - start) / (60 * 60 * 1000));
}

function formatLapsedHours(hours: number) {
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = hours / 24;
  if (days < 10) return `${days.toFixed(1)}d`;
  return `${Math.round(days)}d`;
}

function assigneeKey(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "Unassigned";
}

const DEMO_SUPPORT_ASSIGNEES = ["Admin", "Info", "Paul"] as const;

function normalizeAssigneeToken(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** Map logged-in demo user → ticket assignee label (Admin / Info / Paul / display name). */
function resolveMyAssigneeLabel(input: {
  displayName?: string | null;
  username?: string | null;
  email?: string | null;
}) {
  const rawTokens = [
    input.displayName,
    input.username,
    input.email?.split("@")[0],
    input.displayName?.split(/\s+/)[0],
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim());

  const known: Record<string, string> = {
    admin: "Admin",
    administrator: "Admin",
    info: "Info",
    paul: "Paul",
    paulfotheringham: "Paul",
  };

  for (const token of rawTokens) {
    const normalized = normalizeAssigneeToken(token);
    if (known[normalized]) return known[normalized];
    const exact = DEMO_SUPPORT_ASSIGNEES.find(
      (name) => normalizeAssigneeToken(name) === normalized,
    );
    if (exact) return exact;
  }

  // Prefer a clean display name when it already looks like an assignee label.
  const display = input.displayName?.trim();
  if (display && display.length <= 40) return display;
  const username = input.username?.trim();
  if (username) return username;
  return "Admin";
}

function StatBar({
  label,
  count,
  max,
  tone,
}: {
  label: string;
  count: number;
  max: number;
  tone: "sky" | "amber" | "emerald";
}) {
  const width = max > 0 ? Math.max(8, Math.round((count / max) * 100)) : 0;
  const toneClass =
    tone === "sky"
      ? "border-sky-400/30 bg-sky-500/20"
      : tone === "amber"
        ? "border-amber-400/30 bg-amber-500/20"
        : "border-emerald-400/30 bg-emerald-500/20";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-end justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
        <p className="text-2xl font-semibold tabular-nums text-white">{count}</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={cn("h-full rounded-full border", toneClass)} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(response.ok ? "Invalid server response." : text.slice(0, 180));
  }
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
      {children}
    </label>
  );
}

function inputClassName() {
  return "mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-sky-400/50";
}

export default function SupportWorkspace({
  scope = "all",
}: {
  scope?: "overview" | "all" | "mine";
}) {
  const searchParams = useSearchParams();
  const overviewMode = scope === "overview";
  const mineMode = scope === "mine";
  const showExplorer = !overviewMode;
  const showAnalytics = overviewMode || mineMode;
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<SupportTicket | null>(null);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState(mineMode ? "" : "all");
  const [myAssignee, setMyAssignee] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed" | "outstanding" | "in_queue">(
    overviewMode ? "all" : "open",
  );
  const [statsPeriod, setStatsPeriod] = useState<SupportStatsPeriod>("month");
  const snapshottedIdRef = useRef<string | null>(null);
  const deepLinkAppliedRef = useRef<string | null>(null);
  const [analyticsNowMs, setAnalyticsNowMs] = useState(() => Date.now());
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const { showDetail, openDetail, closeDetail } = useMobileDetailPanel();

  function selectTicket(ticketId: string) {
    setSelectedTicketId(ticketId);
    openDetail();
  }

  useEffect(() => {
    if (!mineMode) return;
    let cancelled = false;
    void fetch("/api/auth/whoami", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return readApiJson<{
          displayName?: string | null;
          username?: string | null;
          email?: string | null;
        }>(response);
      })
      .then((whoami) => {
        if (cancelled || !whoami) return;
        const label = resolveMyAssigneeLabel(whoami);
        setMyAssignee(label);
        setAssigneeFilter(label);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [mineMode]);

  useEffect(() => {
    if (mineMode && myAssignee) {
      setAssigneeFilter(myAssignee);
    }
  }, [mineMode, myAssignee]);

  const visibleTickets = useMemo(() => {
    const base = showArchived ? tickets : tickets.filter((ticket) => !ticket.archived);
    return [...base].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [showArchived, tickets]);

  const clientOptions = useMemo(
    () =>
      [...new Set(tickets.map((ticket) => ticket.organisation).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [tickets],
  );

  const assigneeOptions = useMemo(() => {
    const names = new Set<string>(["Admin", "Info", "Paul"]);
    for (const ticket of tickets) {
      const assigned = ticket.userAssigned?.trim();
      if (assigned) names.add(assigned);
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [tickets]);

  function matchesStatusFilter(ticket: SupportTicket) {
    if (statusFilter === "all") return true;
    if (statusFilter === "open") return !ticket.closed && !ticket.archived;
    if (statusFilter === "closed") return ticket.closed && !ticket.archived;
    if (statusFilter === "outstanding") {
      return !ticket.archived && !ticket.closed && Boolean(ticket.userAssigned?.trim());
    }
    if (statusFilter === "in_queue") {
      return !ticket.archived && !ticket.closed && !ticket.userAssigned?.trim();
    }
    return true;
  }

  function matchesAssigneeFilter(ticket: SupportTicket) {
    if (mineMode && !assigneeFilter) return false;
    if (assigneeFilter === "all") return true;
    if (assigneeFilter === "unassigned") return !ticket.userAssigned?.trim();
    const assigned = (ticket.userAssigned?.trim() || "").toLowerCase();
    const wanted = assigneeFilter.trim().toLowerCase();
    if (assigned === wanted) return true;
    // Demo aliases: "Paul Fotheringham" ↔ "Paul"
    if (wanted && assigned.startsWith(wanted)) return true;
    if (assigned && wanted.startsWith(assigned)) return true;
    return false;
  }

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return visibleTickets.filter((ticket) => {
      if (clientFilter !== "all" && ticket.organisation !== clientFilter) return false;
      if (!matchesAssigneeFilter(ticket)) return false;
      if (!matchesStatusFilter(ticket)) return false;
      if (!query) return true;

      const haystack = [
        ticket.name,
        ticket.userAssigned ?? "",
        ticket.id,
        ticket.organisation,
        ticket.description,
        ticket.requesterEmail ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [assigneeFilter, clientFilter, search, statusFilter, visibleTickets]);

  const periodTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        if (!ticketInPeriod(ticket, statsPeriod)) return false;
        if (clientFilter !== "all" && ticket.organisation !== clientFilter) return false;
        if (!matchesAssigneeFilter(ticket)) return false;
        if (statusFilter === "closed") return ticket.closed;
        if (statusFilter === "open" || statusFilter === "outstanding" || statusFilter === "in_queue") {
          return matchesStatusFilter(ticket);
        }
        return true;
      }),
    [assigneeFilter, clientFilter, statsPeriod, statusFilter, tickets],
  );

  const inQueueCount = useMemo(
    () =>
      periodTickets.filter(
        (ticket) => !ticket.archived && !ticket.closed && !ticket.userAssigned?.trim(),
      ).length,
    [periodTickets],
  );

  const outstandingCount = useMemo(
    () =>
      periodTickets.filter(
        (ticket) => !ticket.archived && !ticket.closed && Boolean(ticket.userAssigned?.trim()),
      ).length,
    [periodTickets],
  );

  const resolvedCount = useMemo(
    () => periodTickets.filter((ticket) => ticket.closed && !ticket.archived).length,
    [periodTickets],
  );

  const statsMax = Math.max(inQueueCount, outstandingCount, resolvedCount, 1);

  const currentStateChartData = useMemo(
    () => [
      { label: "In queue", count: inQueueCount, fill: "#38bdf8" },
      { label: "Outstanding", count: outstandingCount, fill: "#fbbf24" },
      { label: "Resolved", count: resolvedCount, fill: "#34d399" },
      {
        label: "Archived",
        count: periodTickets.filter((ticket) => ticket.archived).length,
        fill: "#a78bfa",
      },
    ],
    [inQueueCount, outstandingCount, periodTickets, resolvedCount],
  );

  const [historicChartNowMs] = useState(() => Date.now());
  const historicChartData = useMemo(() => {
    const buckets: Array<{ week: string; opened: number; resolved: number }> = [];
    const now = historicChartNowMs;
    const weekMs = 7 * 24 * 60 * 60 * 1000;

    for (let index = 5; index >= 0; index -= 1) {
      const end = now - index * weekMs;
      const start = end - weekMs;
      const opened = tickets.filter((ticket) => {
        const created = new Date(ticket.createdAt).getTime();
        return created >= start && created < end;
      }).length;
      const resolved = tickets.filter((ticket) => {
        if (!ticket.closed) return false;
        const updated = new Date(ticket.updatedAt).getTime();
        return updated >= start && updated < end;
      }).length;
      buckets.push({
        week: new Date(end).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        opened,
        resolved,
      });
    }

    return buckets;
  }, [historicChartNowMs, tickets]);

  const assignedPerUserChartData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ticket of periodTickets) {
      if (ticket.archived) continue;
      const key = assigneeKey(ticket.userAssigned);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, count]) => ({
        label,
        count,
        fill: label === "Unassigned" ? "#94a3b8" : "#38bdf8",
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, 8);
  }, [periodTickets]);

  const lapsedTimeChartData = useMemo(() => {
    const openTickets = tickets.filter((ticket) => !ticket.archived && !ticket.closed);
    const buckets = [
      { label: "< 1d", count: 0, fill: "#34d399" },
      { label: "1–3d", count: 0, fill: "#38bdf8" },
      { label: "3–7d", count: 0, fill: "#fbbf24" },
      { label: "7d+", count: 0, fill: "#f87171" },
    ];
    for (const ticket of openTickets) {
      const hours = hoursBetween(ticket.createdAt, analyticsNowMs);
      if (hours < 24) buckets[0].count += 1;
      else if (hours < 72) buckets[1].count += 1;
      else if (hours < 168) buckets[2].count += 1;
      else buckets[3].count += 1;
    }
    return buckets;
  }, [analyticsNowMs, tickets]);

  const avgLapsedByAssignee = useMemo(() => {
    const groups = new Map<string, number[]>();
    for (const ticket of tickets) {
      if (ticket.archived || ticket.closed) continue;
      const key = assigneeKey(ticket.userAssigned);
      const list = groups.get(key) || [];
      list.push(hoursBetween(ticket.createdAt, analyticsNowMs));
      groups.set(key, list);
    }
    return [...groups.entries()]
      .map(([label, hours]) => {
        const avg = hours.reduce((sum, value) => sum + value, 0) / hours.length;
        return { label, display: formatLapsedHours(avg), hours: avg };
      })
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 8);
  }, [analyticsNowMs, tickets]);

  const openTicketsNow = useMemo(
    () => tickets.filter((ticket) => !ticket.archived && !ticket.closed).length,
    [tickets],
  );
  const closedTicketsNow = useMemo(
    () => tickets.filter((ticket) => !ticket.archived && ticket.closed).length,
    [tickets],
  );

  const latestTicket = visibleTickets[0] ?? null;

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId],
  );

  const isDirty = useMemo(() => {
    if (!selectedTicket) return false;
    if (!savedSnapshot || savedSnapshot.id !== selectedTicket.id) return true;
    return !ticketFieldsEqual(selectedTicket, savedSnapshot);
  }, [selectedTicket, savedSnapshot]);

  const loadTickets = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = Boolean(options?.silent);
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      try {
        const response = await fetch("/api/support/tickets?includeArchived=true", {
          cache: "no-store",
        });
        const data = await readApiJson<{ tickets?: SupportTicket[]; error?: string }>(response);
        if (!response.ok) throw new Error(data.error ?? "Failed to load support tickets");

        const nextTickets = data.tickets ?? [];
        setTickets(nextTickets);
        setAnalyticsNowMs(Date.now());
        setLastSyncedAt(new Date());

        if (overviewMode) {
          setSelectedTicketId(null);
          closeDetail();
          return;
        }

        setSelectedTicketId((current) => {
          if (current && nextTickets.some((ticket) => ticket.id === current)) return current;
          const firstOpen = nextTickets.find((ticket) => !ticket.archived);
          return firstOpen?.id ?? nextTickets[0]?.id ?? null;
        });
        if (nextTickets.length > 0) openDetail();
      } catch (loadError) {
        if (!silent) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load support tickets");
          setTickets([]);
          setSelectedTicketId(null);
          closeDetail();
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [closeDetail, openDetail, overviewMode],
  );

  useEffect(() => {
    startTransition(() => {
      void loadTickets();
    });
  }, [loadTickets]);

  useEffect(() => {
    if (!overviewMode) return;
    const intervalId = window.setInterval(() => {
      void loadTickets({ silent: true });
    }, 20_000);
    return () => window.clearInterval(intervalId);
  }, [loadTickets, overviewMode]);

  useEffect(() => {
    const ticketId = searchParams.get("ticketId")?.trim().toUpperCase();
    if (!ticketId || tickets.length === 0) return;
    if (deepLinkAppliedRef.current === ticketId) return;
    if (!tickets.some((ticket) => ticket.id.toUpperCase() === ticketId)) return;
    deepLinkAppliedRef.current = ticketId;
    selectTicket(ticketId);
    setShowArchived(true);
    setAssigneeFilter("all");
    setClientFilter("all");
    setStatusFilter("all");
    setSearch(ticketId);
  }, [searchParams, tickets]);

  useEffect(() => {
    startTransition(() => {
      if (!selectedTicketId) {
        snapshottedIdRef.current = null;
        setSavedSnapshot(null);
        return;
      }
      if (snapshottedIdRef.current === selectedTicketId) return;
      const ticket = tickets.find((item) => item.id === selectedTicketId);
      if (ticket) {
        snapshottedIdRef.current = selectedTicketId;
        setSavedSnapshot({ ...ticket });
      }
    });
  }, [selectedTicketId, tickets]);

  async function saveTicket(ticket: SupportTicket) {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/support/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ticket.name,
          organisation: ticket.organisation,
          priority: ticket.priority,
          description: ticket.description,
          userAssigned: ticket.userAssigned,
          archived: ticket.archived,
          requesterFirstName: ticket.requesterFirstName,
          requesterLastName: ticket.requesterLastName,
          requesterDepartment: ticket.requesterDepartment,
          requesterRole: ticket.requesterRole,
          ticketKind: ticket.ticketKind,
        }),
      });

      const data = await readApiJson<{ ticket?: SupportTicket; error?: string }>(response);
      if (!response.ok || !data.ticket) throw new Error(data.error ?? "Failed to save ticket");

      setTickets((current) => current.map((item) => (item.id === data.ticket!.id ? data.ticket! : item)));
      snapshottedIdRef.current = data.ticket.id;
      setSavedSnapshot(data.ticket);
      setSaveMessage("Ticket saved");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save ticket");
    } finally {
      setBusy(false);
    }
  }

  function patchSelected(patch: Partial<SupportTicket>) {
    if (!selectedTicket) return;
    const next = { ...selectedTicket, ...patch };
    setTickets((current) => current.map((ticket) => (ticket.id === next.id ? next : ticket)));
    setSaveMessage(null);
  }

  async function handleSaveTicket() {
    if (!selectedTicket) return;
    setError(null);
    setSaveMessage(null);
    await saveTicket(selectedTicket);
  }

  async function handleAddTicket() {
    setBusy(true);
    setError(null);

    const blank = createBlankTicketInput();

    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...blank,
          name: "New contact",
          organisation: "Unassigned client",
        }),
      });

      const data = await readApiJson<{ ticket?: SupportTicket; error?: string }>(response);
      if (!response.ok || !data.ticket) throw new Error(data.error ?? "Failed to create ticket");

      setTickets((current) => [data.ticket!, ...current]);
      selectTicket(data.ticket.id);
      snapshottedIdRef.current = data.ticket.id;
      setSavedSnapshot(data.ticket);
      setSaveMessage("Ticket created");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create ticket");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteTicket() {
    if (!selectedTicket) return;
    if (!window.confirm(`Delete ticket ${selectedTicket.id}? This cannot be undone.`)) return;

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: "DELETE",
      });
      const data = await readApiJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to delete ticket");

      const remaining = tickets.filter((ticket) => ticket.id !== selectedTicket.id);
      setTickets(remaining);
      const nextId = remaining.find((ticket) => !ticket.archived)?.id ?? remaining[0]?.id ?? null;
      if (nextId) selectTicket(nextId);
      else {
        setSelectedTicketId(null);
        closeDetail();
      }
      setSaveMessage(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete ticket");
    } finally {
      setBusy(false);
    }
  }

  async function handleArchiveTicket(archived: boolean) {
    if (!selectedTicket) return;

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });

      const data = await readApiJson<{ ticket?: SupportTicket; error?: string }>(response);
      if (!response.ok || !data.ticket) throw new Error(data.error ?? "Failed to update ticket");

      setTickets((current) => current.map((item) => (item.id === data.ticket!.id ? data.ticket! : item)));
      snapshottedIdRef.current = data.ticket.id;
      setSavedSnapshot(data.ticket);
      setSaveMessage(archived ? "Ticket archived" : "Ticket restored");

      if (archived && !showArchived) {
        const remaining = tickets.filter((ticket) => ticket.id !== data.ticket!.id && !ticket.archived);
        if (remaining[0]) selectTicket(remaining[0].id);
        else {
          setSelectedTicketId(null);
          closeDetail();
        }
      }
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : "Failed to archive ticket");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6" data-ai-target="support-workspace">
      {overviewMode ? (
        <section
          data-ai-target="support-kpis"
          className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-4 sm:px-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                Ticket Overview
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">Live support desk dashboard</h2>
              <p className="mt-1 text-sm text-white/55">
                Connected to open and historic tickets in real time. Use Tickets for the full queue and
                search.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1.5 font-medium text-emerald-100">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                </span>
                Live
              </span>
              {lastSyncedAt ? (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white/55">
                  Synced {formatSupportDate(lastSyncedAt.toISOString())}
                </span>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {mineMode ? (
        <section className="rounded-2xl border border-sky-400/25 bg-sky-500/10 px-4 py-4 sm:px-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
            My support tickets
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            {myAssignee ? `Assigned to ${myAssignee}` : "Your assigned tickets"}
          </h2>
          <p className="mt-1 text-sm text-white/55">
            Work your queue first. Personal analytics for your tickets sit below.
          </p>
        </section>
      ) : null}

      {error && (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
          {error.includes("support_tickets") && (
            <span className="mt-2 block text-xs text-red-200/80">
              Run{" "}
              <span className="font-mono">supabase/migrations/026_create_support_tickets.sql</span> in
              Supabase.
            </span>
          )}
        </p>
      )}

      {overviewMode && loading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-8 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Connecting to ticket data…
        </div>
      ) : null}

      {showExplorer ? (
        loading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-8 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading tickets…
        </div>
      ) : (
        <div>
        <ResponsiveMasterDetail
          showDetail={showDetail}
          onBack={() => {
            closeDetail();
            setSelectedTicketId(null);
          }}
          backLabel="Back to tickets"
          columnsClassName="xl:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]"
          className="min-h-[70vh] xl:items-start"
          master={
            <section className="flex max-h-[78vh] flex-col rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {mineMode ? "My tickets" : "Tickets"}
                  </h2>
                  <p className="mt-1 text-xs text-white/45">
                    {filteredTickets.length} tickets ·{" "}
                    {mineMode
                      ? "sorted by latest activity"
                      : "open by default · search or show archived for legacy"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowArchived((current) => !current)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                      showArchived
                        ? "border-sky-400/30 bg-sky-500/10 text-sky-200"
                        : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20",
                    )}
                  >
                    {showArchived ? "Showing archived" : "Show archived"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleAddTicket()}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-200 transition-colors hover:bg-sky-500/20 disabled:opacity-60"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add ticket
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <div className="relative sm:col-span-2 xl:col-span-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by user name, assignee, ID…"
                    className={cn(inputClassName(), "mt-0 pl-10")}
                  />
                </div>
                <select
                  value={clientFilter}
                  onChange={(event) => setClientFilter(event.target.value)}
                  className={cn(inputClassName(), "mt-0")}
                  aria-label="Filter by client"
                >
                  <option value="all">All clients</option>
                  {clientOptions.map((organisation) => (
                    <option key={organisation} value={organisation}>
                      {organisation}
                    </option>
                  ))}
                </select>
                {mineMode ? (
                  <div
                    className={cn(
                      inputClassName(),
                      "mt-0 flex items-center border-sky-400/30 bg-sky-500/10 text-sky-100",
                    )}
                    aria-label="Assigned to you"
                  >
                    {myAssignee || "Loading…"}
                  </div>
                ) : (
                  <select
                    value={assigneeFilter}
                    onChange={(event) => setAssigneeFilter(event.target.value)}
                    className={cn(inputClassName(), "mt-0")}
                    aria-label="Filter by support user"
                  >
                    <option value="all">All support users</option>
                    <option value="unassigned">Unassigned</option>
                    {assigneeOptions.map((assignee) => (
                      <option key={assignee} value={assignee}>
                        {assignee}
                      </option>
                    ))}
                  </select>
                )}
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as "all" | "open" | "closed" | "outstanding" | "in_queue",
                    )
                  }
                  className={cn(inputClassName(), "mt-0")}
                  aria-label="Filter by status"
                >
                  <option value="all">All statuses</option>
                  <option value="open">Open</option>
                  <option value="outstanding">Outstanding</option>
                  <option value="in_queue">In queue</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {filteredTickets.length === 0 ? (
                  <p className="text-sm text-white/45">No tickets match your filters.</p>
                ) : mineMode ? (
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="min-w-full text-left text-xs">
                      <thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/45">
                        <tr>
                          <th className="px-3 py-2">ID</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Client</th>
                          <th className="px-3 py-2">Assigned</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTickets.map((ticket) => {
                          const selected = ticket.id === selectedTicket?.id;
                          return (
                            <tr
                              key={ticket.id}
                              onClick={() => selectTicket(ticket.id)}
                              className={cn(
                                "cursor-pointer border-b border-white/5 hover:bg-sky-500/5",
                                selected && "bg-sky-500/10",
                              )}
                            >
                              <td className="px-3 py-2 font-mono text-sky-300">{ticket.id}</td>
                              <td className="px-3 py-2 capitalize text-white/80">
                                {(ticket.status || (ticket.closed ? "closed" : "open")).replaceAll(
                                  "_",
                                  " ",
                                )}
                              </td>
                              <td className="px-3 py-2 text-white/70">{ticket.organisation || "—"}</td>
                              <td className="px-3 py-2 text-white/70">
                                {ticket.userAssigned || "Unassigned"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  filteredTickets.map((ticket) => {
                    const selected = ticket.id === selectedTicket?.id;
                    const isLatest = latestTicket?.id === ticket.id;

                    return (
                      <button
                        key={ticket.id}
                        type="button"
                        onClick={() => selectTicket(ticket.id)}
                        className={cn(
                          "w-full rounded-xl border px-3 py-3 text-left transition-colors",
                          selected
                            ? "border-sky-400/40 bg-sky-500/10 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.15)]"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
                          ticket.archived && "opacity-70",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sky-300/80">
                            {ticket.id}
                          </p>
                          {isLatest && (
                            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-emerald-200">
                              Latest
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm font-semibold text-white">{ticket.name || "Unnamed"}</p>
                        <p className="mt-1 text-xs text-white/45">
                          {ticket.organisation || "No organisation"}
                          {ticket.userAssigned ? ` · assigned ${ticket.userAssigned}` : " · unassigned"}
                          {!ticket.closed
                            ? ` · open ${formatLapsedHours(hoursBetween(ticket.createdAt, analyticsNowMs))}`
                            : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]",
                              priorityBadgeClass(ticket.priority),
                            )}
                          >
                            {SUPPORT_PRIORITY_LABELS[ticket.priority]}
                          </span>
                          {ticket.source === "lounge" && (
                            <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-violet-200">
                              Lounge
                            </span>
                          )}
                          {ticket.escalated && (
                            <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-amber-200">
                              Human
                            </span>
                          )}
                          <span className="text-[10px] text-white/40">{formatSupportDate(ticket.updatedAt)}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>
          }
          detail={
            selectedTicket ? (
              <section className="max-h-[78vh] overflow-y-auto rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">
                      {selectedTicket.id}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-white">
                      {selectedTicket.name || "Unnamed"}
                    </h2>
                    <p className="mt-1 text-sm text-white/50">{selectedTicket.organisation}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSaveTicket()}
                      disabled={busy || !isDirty}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleArchiveTicket(!selectedTicket.archived)}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/20 disabled:opacity-60"
                    >
                      {selectedTicket.archived ? (
                        <>
                          <ArchiveRestore className="h-3.5 w-3.5" />
                          Restore
                        </>
                      ) : (
                        <>
                          <Archive className="h-3.5 w-3.5" />
                          Archive
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteTicket()}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/20 disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>

                {saveMessage && (
                  <p className="mt-4 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                    {saveMessage}
                  </p>
                )}

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Name</FieldLabel>
                    <input
                      className={inputClassName()}
                      value={selectedTicket.name}
                      onChange={(event) => patchSelected({ name: event.target.value })}
                    />
                  </div>
                  <div>
                    <FieldLabel>Organisation</FieldLabel>
                    <input
                      className={inputClassName()}
                      value={selectedTicket.organisation}
                      onChange={(event) => patchSelected({ organisation: event.target.value })}
                    />
                  </div>
                  <div>
                    <FieldLabel>First name</FieldLabel>
                    <input
                      className={inputClassName()}
                      value={selectedTicket.requesterFirstName ?? ""}
                      onChange={(event) =>
                        patchSelected({ requesterFirstName: event.target.value.trim() || null })
                      }
                    />
                  </div>
                  <div>
                    <FieldLabel>Last name</FieldLabel>
                    <input
                      className={inputClassName()}
                      value={selectedTicket.requesterLastName ?? ""}
                      onChange={(event) =>
                        patchSelected({ requesterLastName: event.target.value.trim() || null })
                      }
                    />
                  </div>
                  <div>
                    <FieldLabel>Department</FieldLabel>
                    <input
                      className={inputClassName()}
                      value={selectedTicket.requesterDepartment ?? ""}
                      onChange={(event) =>
                        patchSelected({ requesterDepartment: event.target.value.trim() || null })
                      }
                    />
                  </div>
                  <div>
                    <FieldLabel>Role</FieldLabel>
                    <input
                      className={inputClassName()}
                      value={selectedTicket.requesterRole ?? ""}
                      onChange={(event) =>
                        patchSelected({ requesterRole: event.target.value.trim() || null })
                      }
                    />
                  </div>
                  <div>
                    <FieldLabel>Ticket kind</FieldLabel>
                    <select
                      className={inputClassName()}
                      value={selectedTicket.ticketKind ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        patchSelected({
                          ticketKind:
                            value === "new" || value === "existing" ? value : null,
                        });
                      }}
                    >
                      <option value="">—</option>
                      <option value="new">New</option>
                      <option value="existing">Existing</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Priority</FieldLabel>
                    <select
                      className={inputClassName()}
                      value={selectedTicket.priority}
                      onChange={(event) =>
                        patchSelected({ priority: event.target.value as SupportTicketPriority })
                      }
                    >
                      {SUPPORT_PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {SUPPORT_PRIORITY_LABELS[priority]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>User assigned</FieldLabel>
                    <select
                      className={inputClassName()}
                      value={selectedTicket.userAssigned ?? ""}
                      onChange={(event) =>
                        patchSelected({ userAssigned: event.target.value.trim() || null })
                      }
                    >
                      <option value="">Unassigned</option>
                      {[
                        "Admin",
                        "Info",
                        "Paul",
                        ...assigneeOptions.filter(
                          (name) => !["Admin", "Info", "Paul"].includes(name),
                        ),
                      ].map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Unique client URL</FieldLabel>
                    {selectedTicket.ticketPublicUrl ? (
                      <a
                        href={selectedTicket.ticketPublicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1.5 block break-all rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-sky-300 underline-offset-2 hover:underline"
                      >
                        {selectedTicket.ticketPublicUrl}
                      </a>
                    ) : (
                      <p className="mt-1.5 rounded-xl border border-dashed border-white/10 px-3 py-2 text-sm text-white/40">
                        No lounge URL on this ticket
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Description</FieldLabel>
                    <textarea
                      rows={5}
                      className={cn(inputClassName(), "resize-y")}
                      value={selectedTicket.description}
                      onChange={(event) => patchSelected({ description: event.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <SupportTicketClientActions
                    ticket={selectedTicket}
                    onTicketChange={(nextTicket) => {
                      setTickets((current) =>
                        current.map((item) => (item.id === nextTicket.id ? nextTicket : item)),
                      );
                      snapshottedIdRef.current = nextTicket.id;
                      setSavedSnapshot(nextTicket);
                    }}
                    onSuccess={(message) => setSaveMessage(message)}
                    onError={(message) => setError(message)}
                  />
                </div>

                <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/45">
                  <p>Created {formatSupportDate(selectedTicket.createdAt)}</p>
                  <p className="mt-1">Updated {formatSupportDate(selectedTicket.updatedAt)}</p>
                  {!selectedTicket.closed ? (
                    <p className="mt-1">
                      Open for{" "}
                      {formatLapsedHours(hoursBetween(selectedTicket.createdAt, analyticsNowMs))}
                    </p>
                  ) : null}
                  {selectedTicket.ticketPublicUrl ? (
                    <p className="mt-3 break-all">
                      <span className="text-white/40">Unique URL · </span>
                      <a
                        href={selectedTicket.ticketPublicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-300 underline-offset-2 hover:underline"
                      >
                        {selectedTicket.ticketPublicUrl}
                      </a>
                    </p>
                  ) : null}
                </div>
              </section>
            ) : (
              <section className="flex min-h-[24rem] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-12 text-center text-sm text-white/45">
                Select a ticket from the list to open it here.
              </section>
            )
          }
        />
        </div>
      )
      ) : null}

      {showAnalytics && !loading && (
        <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-sky-300" />
              <h3 className="text-sm font-semibold text-white">
                {mineMode ? "My ticket analytics" : "Support analytics"}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {mineMode ? (
                <span className="inline-flex h-8 items-center rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 text-sky-100">
                  {myAssignee || "…"}
                </span>
              ) : (
                <select
                  value={assigneeFilter}
                  onChange={(event) => setAssigneeFilter(event.target.value)}
                  className={cn(inputClassName(), "mt-0 h-8 min-w-[10rem] py-1 text-xs")}
                  aria-label="Filter analytics by support user"
                >
                  <option value="all">All support users</option>
                  <option value="unassigned">Unassigned</option>
                  {assigneeOptions.map((assignee) => (
                    <option key={`analytics-user-${assignee}`} value={assignee}>
                      {assignee}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as "all" | "open" | "closed" | "outstanding" | "in_queue",
                  )
                }
                className={cn(inputClassName(), "mt-0 h-8 min-w-[9rem] py-1 text-xs")}
                aria-label="Filter analytics by status"
              >
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="outstanding">Outstanding</option>
                <option value="in_queue">In queue</option>
                <option value="closed">Closed</option>
              </select>
              <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-sky-200">
                {openTicketsNow} open now
              </span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                {closedTicketsNow} closed now
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-[#0b1524]/40 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                Historic volume (6 weeks)
              </p>
              <div className="mt-3 h-52">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart data={historicChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                      dataKey="week"
                      tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0b1524",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 12,
                        color: "#f8fafc",
                      }}
                    />
                    <Line type="monotone" dataKey="opened" name="Opened" stroke="#38bdf8" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#34d399" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0b1524]/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                  Current state ({STATS_PERIOD_LABELS[statsPeriod]})
                </p>
                <select
                  value={statsPeriod}
                  onChange={(event) => setStatsPeriod(event.target.value as SupportStatsPeriod)}
                  className={cn(inputClassName(), "mt-0 w-auto min-w-[10rem]")}
                >
                  {(Object.keys(STATS_PERIOD_LABELS) as SupportStatsPeriod[]).map((period) => (
                    <option key={period} value={period}>
                      {STATS_PERIOD_LABELS[period]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-3 h-52">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={currentStateChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0b1524",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 12,
                        color: "#f8fafc",
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {currentStateChartData.map((entry) => (
                        <Cell key={entry.label} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0b1524]/40 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                Assigned per support user ({STATS_PERIOD_LABELS[statsPeriod]})
              </p>
              <div className="mt-3 h-52">
                {assignedPerUserChartData.length === 0 ? (
                  <p className="pt-16 text-center text-sm text-white/40">No tickets in this period.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart
                      data={assignedPerUserChartData}
                      margin={{ top: 8, right: 8, left: -16, bottom: 8 }}
                    >
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={48}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#0b1524",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 12,
                          color: "#f8fafc",
                        }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {assignedPerUserChartData.map((entry) => (
                          <Cell key={entry.label} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0b1524]/40 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                Open ticket age (lapsed time)
              </p>
              <div className="mt-3 h-52">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={lapsedTimeChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0b1524",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 12,
                        color: "#f8fafc",
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {lapsedTimeChartData.map((entry) => (
                        <Cell key={entry.label} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {avgLapsedByAssignee.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {avgLapsedByAssignee.map((row) => (
                    <span
                      key={row.label}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/65"
                    >
                      {row.label}: avg {row.display}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <StatBar label="In queue" count={inQueueCount} max={statsMax} tone="sky" />
            <StatBar label="Outstanding" count={outstandingCount} max={statsMax} tone="amber" />
            <StatBar label="Resolved" count={resolvedCount} max={statsMax} tone="emerald" />
          </div>
        </section>
      )}

    </div>
  );
}
