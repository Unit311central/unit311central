"use client";

import { useEffect, useState, type ComponentType } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileUp,
  FolderOpen,
  LifeBuoy,
  Mail,
  MessageSquare,
  Share2,
  Sparkles,
  Ticket,
  Upload,
  Users,
  Video,
  Zap,
} from "lucide-react";

import { isBrowserAbhiSurface } from "@/lib/abhi-surface";
import { isBrowserDemoSurface, getDemoEnterpriseFixtures } from "@/lib/demo-enterprise";
import { isBrowserSaecSurface } from "@/lib/saec-surface";
import NorthstarProductivityDashboard from "@/components/demo/NorthstarProductivityDashboard";
import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { getInternalNavHref, type InternalOperationsView } from "@/lib/internal-operations-data";
import { buildOaProductivitySnapshot } from "@/lib/onwardair/productivity-fake-data";
import { isBrowserOnwardAirSurface } from "@/lib/onwardair-surface";
import type { SupportTicket } from "@/lib/support-data";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ProductivitySnapshot = {
  summary: {
    attention: number;
    changed: number;
    nextUp: string;
    headline: string;
  };
  emails: Array<{ from: string; subject: string; time: string; unread: boolean }>;
  schedule: Array<{ time: string; title: string; meta: string }>;
  messages: Array<{ channel: string; text: string; time: string }>;
  files: Array<{ name: string; action: string; by: string; time: string }>;
  communications?: Array<{ title: string; meta: string; time: string }>;
  support: {
    open: number;
    waiting: number;
    resolvedToday: number;
    critical: number;
    items: Array<{ id: string; title: string; status: string }>;
  };
  social: Array<{ network: string; text: string; time: string }>;
  approvals: Array<{ title: string; meta: string; due: string }>;
};

const ABHI_SNAPSHOT: ProductivitySnapshot = {
  summary: {
    attention: 3,
    changed: 9,
    nextUp: "Member onboarding review · 11:00",
    headline:
      "Membership morning: 3 items need attention, 2 discovery demos today, 1 partner commission pack awaiting sign-off, and WHX stand build is on the critical path.",
  },
  emails: [],
  schedule: [
    { time: "09:30", title: "Working Group — Digital Health", meta: "Teams · 45 min" },
    { time: "11:00", title: "Member onboarding review", meta: "Boardroom · 30 min" },
    { time: "14:00", title: "Discovery — OrthoTech UK", meta: "Video · 45 min" },
    { time: "16:00", title: "US Accelerator briefing", meta: "Hybrid · 60 min" },
  ],
  messages: [
    { channel: "#membership", text: "OrthoTech UK pack ready for Jane.", time: "18m" },
    { channel: "#events", text: "WHX stand elevations approved.", time: "42m" },
    { channel: "Paul B.", text: "Partner commission schedule updated.", time: "1h" },
  ],
  files: [],
  support: {
    open: 4,
    waiting: 1,
    resolvedToday: 3,
    critical: 0,
    items: [
      { id: "TK-ABHI-88", title: "Member portal SSO hiccup — Midland Med", status: "Waiting" },
      { id: "TK-ABHI-84", title: "Events microsite form validation", status: "Open" },
      { id: "TK-ABHI-79", title: "CRM sync for discovery meetings", status: "Open" },
    ],
  },
  social: [
    { network: "LinkedIn", text: "ABHI US Accelerator post — 1.2k impressions.", time: "Today" },
    { network: "X", text: "WHX countdown creative scheduled.", time: "Today" },
    { network: "LinkedIn", text: "Member spotlight draft queued.", time: "Yesterday" },
  ],
  approvals: [
    { title: "Partner commission — £5k (Agent A)", meta: "Finance · Membership", due: "Due today" },
    { title: "Partner commission — £5k (Agent B)", meta: "Finance · Membership", due: "Due today" },
    { title: "External speaker release — Digital Health WG", meta: "Comms", due: "Tomorrow" },
  ],
};

/** Placeholder Internal snapshot — Demo uses Meridian Atlas fixtures. */
const SAEC_SNAPSHOT: ProductivitySnapshot = {
  summary: {
    attention: 4,
    changed: 11,
    nextUp: "09:30 — Gauteng install coordination stand-up",
    headline:
      "Three live mall programmes, Centurion mobilisation, and two overdue AR collections need attention today.",
  },
  emails: [
    { from: "Hyprop Investments", subject: "Centurion Mall KLK site readiness", time: "08:12", unread: true },
    { from: "Growthpoint Properties", subject: "Ponte City outage window approval", time: "07:45", unread: true },
    { from: "V&A Waterfront", subject: "Lift commissioning schedule — Dock Road", time: "Yesterday", unread: false },
  ],
  schedule: [
    { time: "09:30", title: "Gauteng install coordination", meta: "Teams · Field ops" },
    { time: "11:00", title: "Killarney escalator commissioning review", meta: "Site · Johannesburg" },
    { time: "14:30", title: "Commercial pipeline — mall portfolio", meta: "Boardroom" },
  ],
  messages: [
    { channel: "Field Ops", text: "Brooklyn Mall PM checklist signed off.", time: "08:05" },
    { channel: "Engineering", text: "KLK training cohort 3 — module 4 complete.", time: "07:50" },
  ],
  files: [
    { name: "Centurion-Mall-KLK-scope.pdf", action: "Uploaded", by: "Linda van Wyk", time: "Today" },
    { name: "Ponte-City-outage-plan.pdf", action: "Revised", by: "Riaan Pretorius", time: "Yesterday" },
  ],
  support: {
    open: 6,
    waiting: 2,
    resolvedToday: 4,
    critical: 1,
    items: [
      { id: "TK-OMT-42", title: "Escalator fault — Killarney Mall", status: "Critical" },
      { id: "TK-OMT-38", title: "Lift inspection certificate upload", status: "Waiting" },
      { id: "TK-OMT-35", title: "Brooklyn Mall service callback", status: "Open" },
    ],
  },
  social: [
    { network: "LinkedIn", text: "OmniTransit mall modernisation post — 890 impressions.", time: "Today" },
    { network: "Facebook", text: "V&A Waterfront case study scheduled.", time: "Yesterday" },
  ],
  approvals: [
    { title: "Centurion Mall mobilisation PO", meta: "Procurement", due: "Due today" },
    { title: "Weekend outage — Emperors Palace", meta: "COO sign-off", due: "Due tomorrow" },
  ],
};

const INTERNAL_SNAPSHOT: ProductivitySnapshot = {
  summary: {
    attention: 7,
    changed: 14,
    nextUp: "Leadership sync · 10:30",
    headline:
      "Morning brief: 12 unread emails, 3 meetings remaining, 2 support tickets waiting on reply, and 1 file approval pending.",
  },
  emails: [
    { from: "Sarah Chen", subject: "Q3 board pack draft for review", time: "08:14", unread: true },
    { from: "Ops Desk", subject: "Site access confirmation — Aberdeen", time: "07:52", unread: true },
    { from: "Finance", subject: "Expense batch EA-284 approved", time: "Yesterday", unread: false },
  ],
  schedule: [
    { time: "09:00", title: "Stand-up — Delivery", meta: "Teams · 15 min" },
    { time: "10:30", title: "Leadership sync", meta: "Boardroom · 45 min" },
    { time: "14:00", title: "Client demo — Meridian Energy", meta: "Video · 60 min" },
    { time: "16:30", title: "Support triage", meta: "Ops · 30 min" },
  ],
  messages: [
    { channel: "#delivery", text: "Flight window confirmed for Thursday.", time: "12m" },
    { channel: "#finance", text: "Invoice pack ready for sign-off.", time: "41m" },
    { channel: "Paul F.", text: "Can you join the 10:30 briefly?", time: "1h" },
  ],
  files: [
    { name: "Meridian_SOW_v3.pdf", action: "Uploaded", by: "A. Patel", time: "1h ago" },
    { name: "Ops_Roster_Jul.xlsx", action: "Edited", by: "You", time: "3h ago" },
    { name: "Board_Pack_Draft.pptx", action: "Shared", by: "S. Chen", time: "Yesterday" },
  ],
  support: {
    open: 8,
    waiting: 2,
    resolvedToday: 5,
    critical: 1,
    items: [
      { id: "TK-1042", title: "Portal login failure — external user", status: "Critical" },
      { id: "TK-1038", title: "WhatsApp webhook delay", status: "Waiting" },
      { id: "TK-1031", title: "Calendar invite not syncing", status: "Open" },
    ],
  },
  social: [
    { network: "LinkedIn", text: "Campaign post scheduled for 11:00.", time: "Today" },
    { network: "X", text: "2 mentions require review.", time: "Today" },
    { network: "LinkedIn", text: "Engagement +18% vs last week.", time: "Yesterday" },
  ],
  approvals: [
    { title: "External file share — Client Explorer", meta: "Requested by A. Patel", due: "Due today" },
    { title: "Support escalation — TK-1042", meta: "Ops Desk", due: "Due today" },
    { title: "Meeting room booking override", meta: "Facilities", due: "Tomorrow" },
  ],
};

function resolveProductivitySnapshot(displayName?: string | null): ProductivitySnapshot {
  if (typeof window !== "undefined" && isBrowserOnwardAirSurface()) {
    const oa = buildOaProductivitySnapshot(displayName);
    return {
      ...oa,
      social: [],
      approvals: [],
    };
  }
  if (typeof window !== "undefined" && isBrowserAbhiSurface()) {
    return ABHI_SNAPSHOT;
  }
  if (typeof window !== "undefined" && isBrowserSaecSurface()) {
    return SAEC_SNAPSHOT;
  }
  if (typeof window !== "undefined" && isBrowserDemoSurface()) {
    const fixtures = getDemoEnterpriseFixtures();
    return {
      summary: fixtures.productivity.summary,
      emails: fixtures.productivity.emails,
      schedule: fixtures.productivity.schedule,
      messages: fixtures.productivity.messages,
      files: fixtures.productivity.files,
      support: fixtures.productivity.support,
      social: fixtures.productivity.social,
      approvals: fixtures.productivity.approvals,
    };
  }
  return INTERNAL_SNAPSHOT;
}

const QUICK_ACTIONS = [
  { label: "Compose Email", icon: Mail },
  { label: "New Meeting", icon: CalendarDays },
  { label: "Upload File", icon: Upload },
  { label: "Start Video Call", icon: Video },
  { label: "Create Ticket", icon: Ticket },
] as const;

const ABHI_QUICK_ACTIONS = [
  { label: "New Meeting", icon: CalendarDays, tone: "sky" },
  { label: "Add Member", icon: Users, tone: "emerald" },
  { label: "Upload File", icon: Upload, tone: "violet" },
  { label: "Start Video", icon: Video, tone: "cyan" },
  { label: "Create Ticket", icon: Ticket, tone: "amber" },
  { label: "Compose Email", icon: Mail, tone: "rose" },
] as const;

function cardClass() {
  return cn(
    "rounded-[12px] border p-4",
    "border-[color:var(--platform-card-border,#243347)] bg-[color:var(--platform-card,#121C2D)]",
  );
}

function WidgetHeader({
  icon: Icon,
  title,
  meta,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  meta?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0 text-white/45" strokeWidth={1.6} />
        <h3 className="truncate text-[12px] font-semibold tracking-wide text-white/80 uppercase">
          {title}
        </h3>
      </div>
      {meta ? <span className="shrink-0 text-[11px] text-white/40">{meta}</span> : null}
    </div>
  );
}

const TONE_BTN: Record<string, string> = {
  sky: "border-sky-400/40 bg-sky-500/15 text-sky-100 hover:bg-sky-500/25",
  emerald: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25",
  violet: "border-violet-400/40 bg-violet-500/15 text-violet-100 hover:bg-violet-500/25",
  cyan: "border-cyan-400/40 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25",
  amber: "border-amber-400/40 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25",
  rose: "border-rose-400/40 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25",
};

function AbhiProductivityDashboard({
  summary,
  schedule,
  messages,
  support,
  social,
  approvals,
}: {
  summary: ProductivitySnapshot["summary"];
  schedule: ProductivitySnapshot["schedule"];
  messages: ProductivitySnapshot["messages"];
  support: ProductivitySnapshot["support"];
  social: ProductivitySnapshot["social"];
  approvals: ProductivitySnapshot["approvals"];
}) {
  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-4">
      <section className="flex flex-nowrap items-stretch gap-2 overflow-x-auto pb-0.5">
        {ABHI_QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              className={cn(
                "inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-[12px] font-semibold transition-colors",
                TONE_BTN[action.tone],
              )}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
              {action.label}
            </button>
          );
        })}
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-white/10 p-5 sm:p-6">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 10% 0%, rgba(56,189,248,0.22), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 20%, rgba(52,211,153,0.16), transparent 50%), linear-gradient(160deg, #0b1628 0%, #121C2D 55%, #0e1a2e 100%)",
          }}
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-sky-300" strokeWidth={1.8} />
              <p className="text-[11px] font-semibold tracking-[0.14em] text-sky-200/80 uppercase">
                ABHI daily pulse
              </p>
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Membership operations today
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{summary.headline}</p>
            <p className="mt-3 flex items-center gap-1.5 text-[12px] text-emerald-200/80">
              <Clock3 className="h-3.5 w-3.5" strokeWidth={1.6} />
              Next up: {summary.nextUp}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:min-w-[18rem]">
            {[
              {
                label: "Needs attention",
                value: summary.attention,
                ring: "border-rose-400/35 bg-rose-500/15",
                num: "text-rose-100",
              },
              {
                label: "Changed today",
                value: summary.changed,
                ring: "border-sky-400/35 bg-sky-500/15",
                num: "text-sky-100",
              },
              {
                label: "Meetings left",
                value: schedule.length,
                ring: "border-emerald-400/35 bg-emerald-500/15",
                num: "text-emerald-100",
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className={cn("rounded-xl border px-3 py-3 text-center backdrop-blur-sm", kpi.ring)}
              >
                <p className={cn("text-2xl font-semibold tabular-nums", kpi.num)}>{kpi.value}</p>
                <p className="mt-0.5 text-[10px] leading-tight text-white/55">{kpi.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <section className={cn(cardClass(), "border-sky-500/25 bg-gradient-to-br from-sky-500/10 to-transparent")}>
          <WidgetHeader icon={CalendarDays} title="Today's Calendar" meta={`${schedule.length} events`} />
          <ul className="space-y-2">
            {schedule.map((row, i) => (
              <li
                key={row.title}
                className="flex gap-3 rounded-lg border border-white/[0.06] bg-black/20 px-2.5 py-2"
              >
                <span
                  className={cn(
                    "w-11 shrink-0 text-[12px] font-semibold tabular-nums",
                    i === 0 ? "text-sky-300" : "text-white/45",
                  )}
                >
                  {row.time}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] text-white/90">{row.title}</p>
                  <p className="truncate text-[11px] text-white/40">{row.meta}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className={cn(cardClass(), "border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-transparent")}>
          <WidgetHeader icon={Video} title="Upcoming Meetings" meta="Next 24h" />
          <ul className="space-y-2.5">
            {schedule.filter((_, i) => i >= 1).map((row) => (
              <li
                key={`meet-${row.title}`}
                className="rounded-lg border border-violet-400/20 bg-violet-500/10 px-3 py-2"
              >
                <p className="text-[13px] text-white/90">{row.title}</p>
                <p className="mt-0.5 text-[11px] text-violet-100/60">
                  {row.time} · {row.meta}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className={cn(cardClass(), "border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 to-transparent")}>
          <WidgetHeader icon={MessageSquare} title="Recent Messages" meta="3 new" />
          <ul className="space-y-2.5">
            {messages.map((row) => (
              <li key={row.channel + row.text} className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-[13px] font-medium text-cyan-100/90">{row.channel}</p>
                  <span className="shrink-0 text-[11px] text-white/35">{row.time}</span>
                </div>
                <p className="truncate text-[12px] text-white/45">{row.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={cn(cardClass(), "border-amber-500/25 bg-gradient-to-br from-amber-500/10 to-transparent")}>
          <WidgetHeader icon={LifeBuoy} title="Support Desk" />
          <div className="mb-3 grid grid-cols-4 gap-1.5">
            {[
              { label: "Open", value: support.open, c: "text-sky-200" },
              { label: "Waiting", value: support.waiting, c: "text-amber-200" },
              { label: "Resolved", value: support.resolvedToday, c: "text-emerald-200" },
              { label: "Critical", value: support.critical, c: "text-rose-200" },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-md bg-black/25 px-1.5 py-1.5 text-center">
                <p className={cn("text-sm font-semibold tabular-nums", kpi.c)}>{kpi.value}</p>
                <p className="text-[9px] text-white/40">{kpi.label}</p>
              </div>
            ))}
          </div>
          <ul className="space-y-2">
            {support.items.map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[12px] text-white/85">{row.title}</p>
                  <p className="text-[11px] text-white/35">{row.id}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                    row.status === "Critical"
                      ? "bg-rose-500/15 text-rose-200"
                      : row.status === "Waiting"
                        ? "bg-amber-500/15 text-amber-200"
                        : "bg-white/10 text-white/60",
                  )}
                >
                  {row.status}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className={cn(cardClass(), "border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-transparent")}>
          <WidgetHeader icon={Share2} title="Social Pulse" />
          <ul className="space-y-2.5">
            {social.map((row) => (
              <li key={row.network + row.text} className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[13px] font-medium text-emerald-100/90">{row.network}</p>
                  <span className="shrink-0 text-[11px] text-white/35">{row.time}</span>
                </div>
                <p className="truncate text-[12px] text-white/45">{row.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={cn(cardClass(), "border-rose-500/25 bg-gradient-to-br from-rose-500/10 to-transparent")}>
          <WidgetHeader icon={CheckCircle2} title="Pending Approvals" meta={`${approvals.length} open`} />
          <ul className="space-y-2.5">
            {approvals.map((row) => (
              <li
                key={row.title}
                className="min-w-0 rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2"
              >
                <p className="truncate text-[13px] text-white/90">{row.title}</p>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="truncate text-[11px] text-white/40">{row.meta}</p>
                  <span className="shrink-0 text-[11px] text-amber-200/90">{row.due}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default function ProductivityDashboardWorkspace() {
  const router = useRouter();
  const basePath = useInternalOperationsBasePath();
  const isAbhi = isBrowserAbhiSurface();
  const isOa = isBrowserOnwardAirSurface();
  const isDemo = isBrowserDemoSurface();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const snapshot = resolveProductivitySnapshot(displayName);
  const {
    summary: SUMMARY,
    emails: EMAILS,
    schedule: TODAY_SCHEDULE,
    messages: MESSAGES,
    files: FILES,
    communications: COMMUNICATIONS = [],
    support: SUPPORT_FIXTURE,
    social: SOCIAL,
    approvals: APPROVALS,
  } = snapshot;

  const [SUPPORT, setSupport] = useState(SUPPORT_FIXTURE);

  useEffect(() => {
    if (!isOa) return;
    let cancelled = false;
    void fetch("/api/auth/whoami", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as {
          displayName?: string;
          username?: string;
        };
      })
      .then((data) => {
        if (cancelled || !data) return;
        setDisplayName(data.displayName || data.username || "Admin");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isOa]);

  useEffect(() => {
    if (isAbhi) return;
    let cancelled = false;
    void fetch("/api/support/tickets?includeArchived=false", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { tickets?: SupportTicket[] };
      })
      .then((data) => {
        if (cancelled || !data?.tickets) return;
        const tickets = data.tickets;
        const open = tickets.filter((t) => !t.closed && !t.archived);
        const waiting = open.filter((t) => !t.userAssigned?.trim());
        const critical = open.filter((t) => t.priority === "urgent" || t.priority === "high");
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const resolvedToday = tickets.filter(
          (t) => t.closed && new Date(t.updatedAt).getTime() >= startOfDay.getTime(),
        );
        setSupport({
          open: open.length,
          waiting: waiting.length,
          resolvedToday: resolvedToday.length,
          critical: critical.length,
          items: open.slice(0, 5).map((t) => ({
            id: t.id,
            title: (t.description || t.name || "Support ticket").replace(/\n/g, " ").slice(0, 64),
            status:
              t.priority === "urgent" || t.priority === "high"
                ? "Critical"
                : !t.userAssigned
                  ? "Waiting"
                  : "Open",
          })),
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isAbhi]);

  const href = (view: InternalOperationsView) => getInternalNavHref(view, basePath);

  if (isAbhi) {
    return (
      <AbhiProductivityDashboard
        summary={SUMMARY}
        schedule={TODAY_SCHEDULE}
        messages={MESSAGES}
        support={SUPPORT}
        social={SOCIAL}
        approvals={APPROVALS}
      />
    );
  }

  if (isDemo) {
    const callsScheduled = TODAY_SCHEDULE.filter((row) =>
      /video|teams|call|zoom/i.test(row.meta),
    ).length;
    const callsSummary = TODAY_SCHEDULE.filter((row) => /video|teams|call|zoom/i.test(row.meta))
      .slice(0, 2)
      .map((row) => row.title.replace(/^[^:]+:\s*/, "").slice(0, 28))
      .join(" · ");
    const supportOver24h = SUPPORT.waiting + SUPPORT.critical;
    const supportSummary = SUPPORT.items
      .slice(0, 2)
      .map((row) => row.title.replace(/\s+—.*/, "").slice(0, 32))
      .join(" · ");

    return (
      <NorthstarProductivityDashboard
        headline={SUMMARY.headline}
        emails={EMAILS}
        schedule={TODAY_SCHEDULE}
        messages={MESSAGES}
        files={FILES}
        callsScheduled={callsScheduled || 2}
        callsSummary={callsSummary || "Leadership sync · Client demo"}
        supportOver24h={supportOver24h}
        supportSummary={supportSummary || `${SUPPORT.open} tickets in queue`}
      />
    );
  }

  if (isOa) {
    const tiles: Array<{
      label: string;
      hint: string;
      view: InternalOperationsView;
      icon: typeof FolderOpen;
      value: string;
    }> = [
      {
        label: "Major file updates",
        hint: FILES[0]?.name ?? "Internal Files",
        view: "files-internal",
        icon: FolderOpen,
        value: String(FILES.length),
      },
      {
        label: "Email",
        hint: `${EMAILS.filter((e) => e.unread).length} unread`,
        view: "info-email",
        icon: Mail,
        value: String(EMAILS.length),
      },
      {
        label: "Calendar",
        hint: SUMMARY.nextUp,
        view: "calendar",
        icon: CalendarDays,
        value: String(TODAY_SCHEDULE.length),
      },
      {
        label: "Messaging",
        hint: MESSAGES[0]?.channel ?? "Channels",
        view: "messaging",
        icon: MessageSquare,
        value: String(MESSAGES.length),
      },
      {
        label: "Communications",
        hint: COMMUNICATIONS[0]?.title ?? "Briefings",
        view: "communications",
        icon: Video,
        value: String(COMMUNICATIONS.length || 3),
      },
      {
        label: "Support Desk",
        hint: `${SUPPORT.open} open · ${SUPPORT.critical} critical`,
        view: "support",
        icon: LifeBuoy,
        value: String(SUPPORT.open),
      },
    ];

    return (
      <div className="mx-auto max-w-6xl space-y-4 pb-4">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            OnwardAir · Business Productivity
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            {displayName ? `${displayName.split(" ")[0]}'s dashboard` : "Your dashboard"}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/55">{SUMMARY.headline}</p>
          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-emerald-200/80">
            <Clock3 className="h-3.5 w-3.5" strokeWidth={1.6} />
            Next up: {SUMMARY.nextUp}
          </p>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.label}
                href={href(tile.view)}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition-colors hover:border-sky-400/35 hover:bg-sky-500/[0.07]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    {tile.label}
                  </p>
                  <Icon className="h-4 w-4 text-sky-300/80" aria-hidden />
                </div>
                <p className="mt-3 text-2xl font-semibold tabular-nums text-white">{tile.value}</p>
                <p className="mt-1 truncate text-xs text-white/40">{tile.hint}</p>
              </Link>
            );
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <section className={cardClass()}>
            <WidgetHeader icon={FolderOpen} title="Major file updates" meta="Internal" />
            <ul className="space-y-2.5">
              {FILES.map((row) => (
                <li key={row.name} className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[13px] text-white/90">{row.name}</p>
                    <span className="shrink-0 text-[11px] text-white/35">{row.time}</span>
                  </div>
                  <p className="truncate text-[12px] text-white/40">
                    {row.action} · {row.by}
                  </p>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-3 text-[11px] font-semibold text-sky-300 hover:text-sky-200"
              onClick={() => router.push(href("files-internal"))}
            >
              Open Internal Files →
            </button>
          </section>

          <section className={cardClass()}>
            <WidgetHeader icon={Mail} title="Email" meta="Inbox" />
            <ul className="space-y-2.5">
              {EMAILS.map((row) => (
                <li key={row.subject} className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={cn(
                        "truncate text-[13px]",
                        row.unread ? "font-medium text-white" : "text-white/70",
                      )}
                    >
                      {row.from}
                    </p>
                    <span className="shrink-0 text-[11px] text-white/35">{row.time}</span>
                  </div>
                  <p className="truncate text-[12px] text-white/45">{row.subject}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className={cardClass()}>
            <WidgetHeader icon={CalendarDays} title="Calendar" meta="Today" />
            <ul className="space-y-2">
              {TODAY_SCHEDULE.map((row) => (
                <li key={row.title} className="flex gap-3">
                  <span className="w-11 shrink-0 text-[12px] tabular-nums text-white/45">
                    {row.time}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] text-white/90">{row.title}</p>
                    <p className="truncate text-[11px] text-white/40">{row.meta}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className={cardClass()}>
            <WidgetHeader icon={MessageSquare} title="Messaging" meta="Channels" />
            <ul className="space-y-2.5">
              {MESSAGES.map((row) => (
                <li key={row.channel + row.text} className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[13px] font-medium text-white/85">{row.channel}</p>
                    <span className="shrink-0 text-[11px] text-white/35">{row.time}</span>
                  </div>
                  <p className="truncate text-[12px] text-white/45">{row.text}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className={cardClass()}>
            <WidgetHeader icon={Video} title="Communications" meta="Briefings" />
            <ul className="space-y-2.5">
              {COMMUNICATIONS.map((row) => (
                <li key={row.title} className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[13px] text-white/90">{row.title}</p>
                    <span className="shrink-0 text-[11px] text-white/35">{row.time}</span>
                  </div>
                  <p className="truncate text-[12px] text-white/40">{row.meta}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className={cardClass()}>
            <WidgetHeader icon={LifeBuoy} title="Support Desk" />
            <div className="mb-3 grid grid-cols-4 gap-1.5">
              {[
                { label: "Open", value: SUPPORT.open },
                { label: "Waiting", value: SUPPORT.waiting },
                { label: "Resolved", value: SUPPORT.resolvedToday },
                { label: "Critical", value: SUPPORT.critical },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-md bg-white/[0.03] px-1.5 py-1.5 text-center">
                  <p className="text-sm font-semibold tabular-nums text-white">{kpi.value}</p>
                  <p className="text-[9px] text-white/40">{kpi.label}</p>
                </div>
              ))}
            </div>
            <ul className="space-y-2">
              {SUPPORT.items.map((row) => (
                <li key={row.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] text-white/85">{row.title}</p>
                    <p className="text-[11px] text-white/35">{row.id}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                      row.status === "Critical"
                        ? "bg-rose-500/15 text-rose-200"
                        : row.status === "Waiting"
                          ? "bg-amber-500/15 text-amber-200"
                          : "bg-white/10 text-white/60",
                    )}
                  >
                    {row.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-4">
      <section
        className={cn(cardClass(), "relative overflow-hidden p-5 sm:p-6")}
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--platform-accent, #2F80ED) 14%, var(--platform-card, #121C2D)), var(--platform-card, #121C2D))",
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <div className="flex items-center gap-2">
              <Sparkles
                className="h-4 w-4"
                style={{ color: "var(--platform-accent, #2F80ED)" }}
                strokeWidth={1.6}
              />
              <p className="text-[11px] font-semibold tracking-[0.14em] text-white/50 uppercase">
                AI Daily Summary
              </p>
            </div>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
              What is happening today
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/65">{SUMMARY.headline}</p>
            <p className="mt-3 flex items-center gap-1.5 text-[12px] text-white/45">
              <Clock3 className="h-3.5 w-3.5" strokeWidth={1.6} />
              Next up: {SUMMARY.nextUp}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:min-w-[17rem]">
            {[
              { label: "Needs attention", value: SUMMARY.attention },
              { label: "Changed today", value: SUMMARY.changed },
              { label: "Meetings left", value: TODAY_SCHEDULE.length },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-[10px] border border-white/10 bg-black/20 px-3 py-2.5 text-center"
              >
                <p className="text-xl font-semibold tabular-nums text-white">{kpi.value}</p>
                <p className="mt-0.5 text-[10px] leading-tight text-white/45">{kpi.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <section className={cardClass()}>
          <WidgetHeader icon={Mail} title="Unread Email" meta="12 unread" />
          <ul className="space-y-2.5">
            {EMAILS.map((row) => (
              <li key={row.subject} className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={cn("truncate text-[13px]", row.unread ? "font-medium text-white" : "text-white/70")}>
                    {row.from}
                  </p>
                  <span className="shrink-0 text-[11px] text-white/35">{row.time}</span>
                </div>
                <p className="truncate text-[12px] text-white/45">{row.subject}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={cardClass()}>
          <WidgetHeader icon={CalendarDays} title="Today's Calendar" meta="4 events" />
          <ul className="space-y-2">
            {TODAY_SCHEDULE.map((row) => (
              <li key={row.title} className="flex gap-3">
                <span className="w-11 shrink-0 text-[12px] tabular-nums text-white/45">{row.time}</span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] text-white/90">{row.title}</p>
                  <p className="truncate text-[11px] text-white/40">{row.meta}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className={cardClass()}>
          <WidgetHeader icon={Video} title="Upcoming Meetings" meta="Next 24h" />
          <ul className="space-y-2.5">
            {TODAY_SCHEDULE.filter((_, i) => i >= 1).map((row) => (
              <li key={`meet-${row.title}`} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <p className="text-[13px] text-white/90">{row.title}</p>
                <p className="mt-0.5 text-[11px] text-white/40">
                  {row.time} · {row.meta}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className={cardClass()}>
          <WidgetHeader icon={MessageSquare} title="Recent Messages" meta="3 new" />
          <ul className="space-y-2.5">
            {MESSAGES.map((row) => (
              <li key={row.channel + row.text} className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-[13px] font-medium text-white/85">{row.channel}</p>
                  <span className="shrink-0 text-[11px] text-white/35">{row.time}</span>
                </div>
                <p className="truncate text-[12px] text-white/45">{row.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={cardClass()}>
          <WidgetHeader icon={FolderOpen} title="Recent File Activity" />
          <ul className="space-y-2.5">
            {FILES.map((row) => (
              <li key={row.name} className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-[13px] text-white/90">{row.name}</p>
                  <span className="shrink-0 text-[11px] text-white/35">{row.time}</span>
                </div>
                <p className="truncate text-[12px] text-white/40">
                  {row.action} · {row.by}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className={cardClass()}>
          <WidgetHeader icon={LifeBuoy} title="Support Desk Summary" />
          <div className="mb-3 grid grid-cols-4 gap-1.5">
            {[
              { label: "Open", value: SUPPORT.open },
              { label: "Waiting", value: SUPPORT.waiting },
              { label: "Resolved", value: SUPPORT.resolvedToday },
              { label: "Critical", value: SUPPORT.critical },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-md bg-white/[0.03] px-1.5 py-1.5 text-center">
                <p className="text-sm font-semibold tabular-nums text-white">{kpi.value}</p>
                <p className="text-[9px] text-white/40">{kpi.label}</p>
              </div>
            ))}
          </div>
          <ul className="space-y-2">
            {SUPPORT.items.map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[12px] text-white/85">{row.title}</p>
                  <p className="text-[11px] text-white/35">{row.id}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                    row.status === "Critical"
                      ? "bg-rose-500/15 text-rose-200"
                      : row.status === "Waiting"
                        ? "bg-amber-500/15 text-amber-200"
                        : "bg-white/10 text-white/60",
                  )}
                >
                  {row.status}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className={cardClass()}>
          <WidgetHeader icon={Share2} title="Recent Social Activity" />
          <ul className="space-y-2.5">
            {SOCIAL.map((row) => (
              <li key={row.network + row.text} className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[13px] font-medium text-white/85">{row.network}</p>
                  <span className="shrink-0 text-[11px] text-white/35">{row.time}</span>
                </div>
                <p className="truncate text-[12px] text-white/45">{row.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={cardClass()}>
          <WidgetHeader icon={CheckCircle2} title="Pending Approvals" meta={`${APPROVALS.length} open`} />
          <ul className="space-y-2.5">
            {APPROVALS.map((row) => (
              <li key={row.title} className="min-w-0 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <p className="truncate text-[13px] text-white/90">{row.title}</p>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="truncate text-[11px] text-white/40">{row.meta}</p>
                  <span className="shrink-0 text-[11px] text-amber-200/80">{row.due}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className={cardClass()}>
          <WidgetHeader icon={FileUp} title="Quick Actions" />
          <div className="flex flex-col gap-1.5">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  className="flex h-9 w-full items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 text-left text-[12px] font-medium text-white/85 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-white/50" strokeWidth={1.6} />
                  {action.label}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
