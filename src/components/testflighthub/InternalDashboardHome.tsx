"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  FolderKanban,
  FolderOpen,
  LifeBuoy,
  Loader2,
  Plus,
  RefreshCw,
  UserPlus,
  Users,
} from "lucide-react";

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { useCorporateMockStore } from "@/components/testflighthub/useCorporateMockStore";
import { useHrMockStore } from "@/components/testflighthub/useHrMockStore";
import type { CalendarEvent } from "@/lib/calendar-data";
import type { ManagedClient } from "@/lib/client-management-data";
import type { ExternalUser } from "@/lib/external-users-data";
import {
  buildExecutiveActionItems,
  buildMyWork,
  buildRecentActivity,
  buildTodaySchedule,
  countLiveProjects,
  countOpenTickets,
  priorityBarClass,
  priorityPillClass,
  type ExecutiveActionItem,
} from "@/lib/home-executive-dashboard";
import type { HrEmployee } from "@/lib/hr-data";
import type { ActionPriority } from "@/lib/internal-operations-command-data";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import type { InternalProject } from "@/lib/projects-data";
import type { SupportTicket } from "@/lib/support-data";
import { cn } from "@/lib/utils";

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(response.ok ? "Invalid server response." : text.slice(0, 180));
  }
}

function CardShell({
  title,
  subtitle,
  accent,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  subtitle?: string;
  accent: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent shadow-[0_20px_56px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl",
        accent,
        className,
      )}
    >
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-white sm:text-[15px]">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-white/45">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div className={cn("min-h-0 flex-1 px-4 py-3 sm:px-5", bodyClassName)}>{children}</div>
    </section>
  );
}

function EmptyLine({ message }: { message: string }) {
  return <p className="py-6 text-center text-sm text-white/40">{message}</p>;
}

function KpiChip({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-white/10 bg-[#0b1524]/75 px-3 py-2.5 transition-colors hover:border-sky-400/30 hover:bg-sky-500/10"
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-white">{value}</p>
    </Link>
  );
}

function scheduleKindClass(kind: string) {
  switch (kind) {
    case "Meeting":
      return "border-sky-400/30 bg-sky-500/10 text-sky-100";
    case "Deadline":
      return "border-rose-400/30 bg-rose-500/10 text-rose-100";
    case "Milestone":
      return "border-violet-400/30 bg-violet-500/10 text-violet-100";
    case "Leave":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
    case "Training":
      return "border-amber-400/30 bg-amber-500/10 text-amber-100";
    case "Birthday":
      return "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-100";
    default:
      return "border-white/15 bg-white/[0.04] text-white/70";
  }
}

function activityKindClass(kind: string) {
  switch (kind) {
    case "Client":
      return "text-sky-300";
    case "Project":
      return "text-violet-300";
    case "Contract":
      return "text-amber-300";
    case "Support":
      return "text-rose-300";
    case "Document":
      return "text-emerald-300";
    case "Employee":
      return "text-cyan-300";
    default:
      return "text-white/55";
  }
}

const QUICK_ACTIONS: Array<{
  label: string;
  view:
    | "clients"
    | "projects"
    | "support"
    | "users-external"
    | "financial-reports"
    | "files-internal"
    | "hr"
    | "corporate-information"
    | "calendar";
  query?: Record<string, string>;
  icon: React.ReactNode;
}> = [
  { label: "Add Client", view: "clients", icon: <Building2 className="h-4 w-4" /> },
  { label: "Create Project", view: "projects", icon: <FolderKanban className="h-4 w-4" /> },
  { label: "New Support Ticket", view: "support", icon: <LifeBuoy className="h-4 w-4" /> },
  { label: "Invite External User", view: "users-external", icon: <UserPlus className="h-4 w-4" /> },
  { label: "Generate Report", view: "financial-reports", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Upload File", view: "files-internal", icon: <FolderOpen className="h-4 w-4" /> },
  { label: "Create Employee", view: "hr", icon: <Users className="h-4 w-4" /> },
  {
    label: "Create Contract",
    view: "corporate-information",
    query: { tab: "contracts" },
    icon: <FileText className="h-4 w-4" />,
  },
  { label: "Open Calendar", view: "calendar", icon: <CalendarDays className="h-4 w-4" /> },
];

export default function InternalDashboardHome(_props?: { showCustomize?: boolean }) {
  const basePath = useInternalOperationsBasePath();
  const corporate = useCorporateMockStore();
  const hrMock = useHrMockStore();

  const hrefs = useMemo(
    () => ({
      clients: getInternalNavHref("clients", basePath),
      projects: getInternalNavHref("projects", basePath),
      support: getInternalNavHref("support", basePath),
      calendar: getInternalNavHref("calendar", basePath),
      hr: getInternalNavHref("hr", basePath),
      hrLeave: getInternalNavHref("hr-leave", basePath),
      training: getInternalNavHref("training", basePath),
      corporateContracts: getInternalNavHref("corporate-information", basePath, {
        tab: "contracts",
      }),
      files: getInternalNavHref("files-internal", basePath),
      messaging: getInternalNavHref("messaging", basePath),
      usersExternal: getInternalNavHref("users-external", basePath),
      home: getInternalNavHref("home", basePath),
    }),
    [basePath],
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [clients, setClients] = useState<ManagedClient[]>([]);
  const [projects, setProjects] = useState<InternalProject[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [employees, setEmployees] = useState<HrEmployee[]>([]);
  const [externalUsers, setExternalUsers] = useState<ExternalUser[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [apiActionItems, setApiActionItems] = useState<
    Array<{
      id: string;
      priority: ActionPriority;
      task: string;
      assignedTo: string;
      due: string;
      href: string | null;
    }>
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadDashboard = useCallback(async (opts?: { soft?: boolean }) => {
    if (opts?.soft) setRefreshing(true);
    else setLoading(true);

    const today = new Date();
    const from = new Date(today);
    from.setDate(from.getDate() - 1);
    const to = new Date(today);
    to.setDate(to.getDate() + 14);
    const fromIso = from.toISOString();
    const toIso = to.toISOString();

    try {
      const whoamiRes = await fetch("/api/auth/whoami", { cache: "no-store" });
      let viewerKey: string | null = null;
      if (whoamiRes.ok) {
        const whoami = await readApiJson<{
          username?: string;
          displayName?: string | null;
        }>(whoamiRes);
        setUsername(whoami.username ?? null);
        setDisplayName(whoami.displayName ?? null);
        if (whoami.username) viewerKey = `user-${whoami.username}`;
      }

      const [
        actionRes,
        clientsRes,
        projectsRes,
        ticketsRes,
        employeesRes,
        usersRes,
        eventsRes,
        unreadRes,
      ] = await Promise.all([
        fetch("/api/internal/action-items", { cache: "no-store" }),
        fetch("/api/clients", { cache: "no-store" }),
        fetch("/api/projects", { cache: "no-store" }),
        fetch("/api/support/tickets?includeArchived=false", { cache: "no-store" }),
        fetch("/api/hr/employees", { cache: "no-store" }),
        fetch("/api/external-users", { cache: "no-store" }),
        fetch(
          `/api/calendar/events?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`,
          { cache: "no-store" },
        ),
        viewerKey
          ? fetch(`/api/messaging/unread?viewerKey=${encodeURIComponent(viewerKey)}`, {
              cache: "no-store",
            })
          : Promise.resolve(null),
      ]);

      if (actionRes.ok) {
        const data = await readApiJson<{
          items?: Array<{
            id: string;
            priority: ActionPriority;
            task: string;
            assignedTo: string;
            due: string;
            href: string | null;
          }>;
        }>(actionRes);
        setApiActionItems(data.items ?? []);
      } else {
        setApiActionItems([]);
      }

      if (clientsRes.ok) {
        const data = await readApiJson<{ clients?: ManagedClient[] }>(clientsRes);
        setClients(data.clients ?? []);
      }
      if (projectsRes.ok) {
        const data = await readApiJson<{ projects?: InternalProject[] }>(projectsRes);
        setProjects(data.projects ?? []);
      }
      if (ticketsRes.ok) {
        const data = await readApiJson<{ tickets?: SupportTicket[] }>(ticketsRes);
        setTickets(data.tickets ?? []);
      }
      if (employeesRes.ok) {
        const data = await readApiJson<{ employees?: HrEmployee[] }>(employeesRes);
        setEmployees(data.employees ?? []);
      }
      if (usersRes.ok) {
        const data = await readApiJson<{ users?: ExternalUser[] }>(usersRes);
        setExternalUsers(data.users ?? []);
      }
      if (eventsRes.ok) {
        const data = await readApiJson<{ events?: CalendarEvent[] }>(eventsRes);
        setEvents(data.events ?? []);
      }
      if (unreadRes?.ok) {
        const data = await readApiJson<{ unreadTotal?: number }>(unreadRes);
        setUnreadCount(data.unreadTotal ?? 0);
      } else {
        setUnreadCount(0);
      }
    } catch {
      // Keep last good snapshot; empty states handle first load.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
    function handleRefresh() {
      void loadDashboard({ soft: true });
    }
    window.addEventListener("internal-dashboard:refresh-alerts", handleRefresh);
    return () => window.removeEventListener("internal-dashboard:refresh-alerts", handleRefresh);
  }, [loadDashboard]);

  const actionItems = useMemo(
    () =>
      buildExecutiveActionItems({
        apiItems: apiActionItems,
        projects,
        tickets,
        contracts: corporate.contracts,
        clients,
        hrefs: {
          support: hrefs.support,
          projects: hrefs.projects,
          clients: hrefs.clients,
          corporateContracts: hrefs.corporateContracts,
          hr: hrefs.hr,
        },
      }),
    [apiActionItems, projects, tickets, corporate.contracts, clients, hrefs],
  );

  const schedule = useMemo(
    () =>
      buildTodaySchedule({
        events,
        projects,
        leave: hrMock.leaveRequests,
        hrefs: {
          calendar: hrefs.calendar,
          projects: hrefs.projects,
          hrLeave: hrefs.hrLeave,
          training: hrefs.training,
        },
      }),
    [events, projects, hrMock.leaveRequests, hrefs],
  );

  const activity = useMemo(
    () =>
      buildRecentActivity({
        clients,
        projects,
        tickets,
        contracts: corporate.contracts,
        employees,
        hrefs: {
          clients: hrefs.clients,
          projects: hrefs.projects,
          support: hrefs.support,
          corporateContracts: hrefs.corporateContracts,
          files: hrefs.files,
          hr: hrefs.hr,
        },
      }),
    [clients, projects, tickets, corporate.contracts, employees, hrefs],
  );

  const myWork = useMemo(
    () =>
      buildMyWork({
        username,
        displayName,
        actionItems,
        events,
        unreadCount,
        hrefs: {
          calendar: hrefs.calendar,
          messaging: hrefs.messaging,
          home: hrefs.home,
        },
      }),
    [username, displayName, actionItems, events, unreadCount, hrefs],
  );

  const snapshot = useMemo(
    () => ({
      clients: clients.length,
      projects: countLiveProjects(projects),
      tickets: countOpenTickets(tickets),
      revenue: "—",
      employees: employees.length,
      externalUsers: externalUsers.length,
    }),
    [clients, projects, tickets, employees, externalUsers],
  );

  const greetingName = displayName || username || "team";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div id="home-tile-action-required" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 px-0.5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-sky-300/80">
            Command centre
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-[1.7rem]">
            {greeting}, {greetingName}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-white/50">
            What needs attention, what is happening today, and how the business is performing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadDashboard({ soft: true })}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 text-xs font-semibold text-white/75 transition-colors hover:bg-white/[0.08]"
        >
          {refreshing || loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 xl:grid-rows-2 xl:gap-5">
        {/* CARD 1 — Action Required */}
        <CardShell
          title="Action Required"
          subtitle="Five highest-priority items"
          accent="border-rose-400/25"
          bodyClassName="flex flex-col gap-2.5 !py-3"
        >
          {loading && actionItems.length === 0 ? (
            <EmptyLine message="Loading priorities…" />
          ) : actionItems.length === 0 ? (
            <EmptyLine message="Nothing urgent right now." />
          ) : (
            actionItems.map((item) => <ActionRequiredRow key={item.id} item={item} />)
          )}
        </CardShell>

        {/* CARD 2 — Today's Schedule */}
        <CardShell
          title="Today's Schedule"
          subtitle="Meetings, deadlines, leave & training"
          accent="border-violet-400/25"
          action={
            <Link
              href={hrefs.calendar}
              className="text-[11px] font-semibold uppercase tracking-[0.1em] text-violet-200/80 hover:text-violet-100"
            >
              Calendar
            </Link>
          }
        >
          {schedule.length === 0 ? (
            <EmptyLine message="No schedule items for today." />
          ) : (
            <ul className="space-y-2">
              {schedule.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={entry.href}
                    className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-[#0b1524]/55 px-3 py-2.5 transition-colors hover:border-violet-400/30 hover:bg-violet-500/10"
                  >
                    <span
                      className={cn(
                        "mt-0.5 shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
                        scheduleKindClass(entry.kind),
                      )}
                    >
                      {entry.kind}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">{entry.title}</span>
                      <span className="mt-0.5 block text-xs text-white/45">{entry.when}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardShell>

        {/* CARD 3 — Business Snapshot */}
        <CardShell
          title="Business Snapshot"
          subtitle="Live workspace counts"
          accent="border-emerald-400/25"
        >
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <KpiChip label="Clients" value={snapshot.clients} href={hrefs.clients} />
            <KpiChip label="Projects" value={snapshot.projects} href={hrefs.projects} />
            <KpiChip label="Support Tickets" value={snapshot.tickets} href={hrefs.support} />
            <KpiChip label="Revenue" value={snapshot.revenue} href={getInternalNavHref("financials", basePath)} />
            <KpiChip label="Employees" value={snapshot.employees} href={hrefs.hr} />
            <KpiChip label="External Users" value={snapshot.externalUsers} href={hrefs.usersExternal} />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-white/35">
            Revenue stays blank until financial APIs are connected for this workspace.
          </p>
        </CardShell>

        {/* CARD 4 — Recent Activity */}
        <CardShell
          title="Recent Activity"
          subtitle="Across clients, projects, contracts & people"
          accent="border-sky-400/25"
        >
          {activity.length === 0 ? (
            <EmptyLine message="No recent activity yet." />
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {activity.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={entry.href}
                    className="flex items-start justify-between gap-3 py-2.5 transition-colors hover:bg-white/[0.03]"
                  >
                    <span className="min-w-0">
                      <span className={cn("text-[10px] font-semibold uppercase tracking-[0.12em]", activityKindClass(entry.kind))}>
                        {entry.kind}
                      </span>
                      <span className="mt-0.5 block truncate text-sm font-medium text-white">{entry.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-white/40">{entry.detail}</span>
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-white/35">{entry.when}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardShell>

        {/* CARD 5 — My Work */}
        <CardShell
          title="My Work"
          subtitle="Assigned to you"
          accent="border-amber-400/25"
        >
          {myWork.length === 0 ? (
            <EmptyLine message="Your queue is clear." />
          ) : (
            <ul className="space-y-2">
              {myWork.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={entry.href}
                    className="block rounded-xl border border-white/10 bg-[#0b1524]/55 px-3 py-2.5 transition-colors hover:border-amber-400/30 hover:bg-amber-500/10"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200/80">
                      {entry.label}
                    </span>
                    <span className="mt-0.5 block text-sm text-white">{entry.detail}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardShell>

        {/* CARD 6 — Quick Access */}
        <CardShell
          title="Quick Access"
          subtitle="Start the next action"
          accent="border-cyan-400/25"
          bodyClassName="!pt-2"
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                href={getInternalNavHref(action.view, basePath, action.query)}
                className="inline-flex min-h-[2.75rem] items-center gap-2.5 rounded-xl border border-cyan-400/20 bg-cyan-500/[0.08] px-3 py-2.5 text-sm font-semibold text-cyan-50 transition-colors hover:border-cyan-300/40 hover:bg-cyan-500/15"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#0b1524]/80 text-cyan-200">
                  {action.icon}
                </span>
                <span className="leading-tight">{action.label}</span>
                <Plus className="ml-auto h-3.5 w-3.5 text-cyan-200/50" />
              </Link>
            ))}
          </div>
        </CardShell>
      </div>
    </div>
  );
}

function ActionRequiredRow({ item }: { item: ExecutiveActionItem }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b1524]/70 p-3">
      <div className="flex items-start gap-2.5">
        <span
          className={cn("mt-1 h-8 w-1 shrink-0 rounded-full", priorityBarClass(item.priority))}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
                priorityPillClass(item.priority),
              )}
            >
              {item.priority}
            </span>
            <span className="text-[11px] text-white/40">Due {item.due}</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-white">{item.title}</p>
          <p className="mt-0.5 text-xs text-white/50">{item.description}</p>
          <p className="mt-1 text-[11px] text-white/40">Owner · {item.owner}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Link
              href={item.href}
              className="inline-flex h-8 items-center rounded-lg border border-sky-500/40 bg-sky-500/15 px-2.5 text-[11px] font-semibold text-sky-100 hover:bg-sky-500/25"
            >
              {item.primaryLabel}
            </Link>
            <Link
              href={item.href}
              className="inline-flex h-8 items-center rounded-lg border border-white/15 bg-white/[0.04] px-2.5 text-[11px] font-semibold text-white/75 hover:bg-white/[0.08]"
            >
              Open
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
