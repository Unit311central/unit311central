"use client";

import Link from "next/link";
import {
  CalendarDays,
  FolderOpen,
  LifeBuoy,
  Mail,
  MessageSquare,
  Video,
} from "lucide-react";

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { getInternalNavHref, type InternalOperationsView } from "@/lib/internal-operations-data";
import { cn } from "@/lib/utils";

type EmailRow = { from: string; subject: string; time: string; unread: boolean };
type ScheduleRow = { time: string; title: string; meta: string };
type MessageRow = { channel: string; text: string; time: string };
type FileRow = { name: string; action: string; by: string; time: string };

type NorthstarProductivityDashboardProps = {
  headline: string;
  emails: EmailRow[];
  schedule: ScheduleRow[];
  messages: MessageRow[];
  files: FileRow[];
  callsScheduled: number;
  callsSummary: string;
  supportOver24h: number;
  supportSummary: string;
};

function DashboardTile({
  label,
  view,
  icon: Icon,
  accent,
  glow,
  border,
  children,
}: {
  label: string;
  view: InternalOperationsView;
  icon: typeof Mail;
  accent: string;
  glow: string;
  border: string;
  children: React.ReactNode;
}) {
  const basePath = useInternalOperationsBasePath();
  const href = getInternalNavHref(view, basePath);

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex min-h-[11rem] flex-col overflow-hidden rounded-2xl border bg-gradient-to-br from-[#0b1524] to-[#060d18] p-5 shadow-[0_20px_48px_rgba(0,0,0,0.35)] transition hover:shadow-[0_24px_56px_rgba(0,0,0,0.45)]",
        border,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-40 blur-2xl transition group-hover:opacity-60",
          glow,
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
          <Icon className={cn("h-4 w-4", accent)} />
        </span>
      </div>
      <div className="relative mt-3 flex flex-1 flex-col">{children}</div>
    </Link>
  );
}

export default function NorthstarProductivityDashboard({
  headline,
  emails,
  schedule,
  messages,
  files,
  callsScheduled,
  callsSummary,
  supportOver24h,
  supportSummary,
}: NorthstarProductivityDashboardProps) {
  const unreadEmails = emails.filter((row) => row.unread);
  const unreadCount = unreadEmails.length;
  const latestUnread = unreadEmails[0];
  const nextMeetings = schedule.slice(0, 3);
  const channelNames = [...new Set(messages.map((row) => row.channel))];
  const channelSummary =
    channelNames.length <= 2
      ? channelNames.join(" · ")
      : `${channelNames.slice(0, 2).join(", ")} +${channelNames.length - 2}`;
  const yourFiles = files.filter((row) => row.by === "You").slice(0, 2);
  const fallbackFiles = yourFiles.length > 0 ? yourFiles : files.slice(0, 2);

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-4">
      <section className="relative overflow-hidden rounded-2xl border border-white/10 p-5 sm:p-6">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 8% 0%, rgba(56,189,248,0.20), transparent 55%), radial-gradient(ellipse 70% 50% at 92% 20%, rgba(167,139,250,0.18), transparent 50%), linear-gradient(160deg, #0b1628 0%, #121C2D 55%, #0e1a2e 100%)",
          }}
        />
        <div className="relative min-w-0 max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Northstar · Business Productivity
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Your dashboard</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/65">{headline}</p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardTile
          label="Email"
          view="info-email"
          icon={Mail}
          accent="text-rose-100"
          glow="bg-rose-500/35"
          border="border-rose-400/30 hover:border-rose-300/50"
        >
          <p className="text-3xl font-semibold tabular-nums text-rose-100">{unreadCount}</p>
          <p className="mt-1 text-xs text-white/45">unread</p>
          {latestUnread ? (
            <p className="mt-auto pt-3 text-xs leading-relaxed text-white/60">
              <span className="text-white/80">{latestUnread.from}</span>
              <span className="text-white/35"> — </span>
              {latestUnread.subject}
            </p>
          ) : (
            <p className="mt-auto pt-3 text-xs text-white/45">Inbox clear</p>
          )}
        </DashboardTile>

        <DashboardTile
          label="Today's meetings"
          view="calendar"
          icon={CalendarDays}
          accent="text-sky-100"
          glow="bg-sky-500/35"
          border="border-sky-400/30 hover:border-sky-300/50"
        >
          <ul className="space-y-2">
            {nextMeetings.length > 0 ? (
              nextMeetings.map((meeting) => (
                <li key={`${meeting.time}-${meeting.title}`} className="min-w-0">
                  <p className="truncate text-sm font-medium text-white/85">
                    <span className="tabular-nums text-sky-200/90">{meeting.time}</span>
                    <span className="text-white/35"> · </span>
                    {meeting.title}
                  </p>
                  <p className="truncate text-[11px] text-white/40">{meeting.meta}</p>
                </li>
              ))
            ) : (
              <li className="text-xs text-white/45">No meetings left today</li>
            )}
          </ul>
        </DashboardTile>

        <DashboardTile
          label="Messaging"
          view="messaging"
          icon={MessageSquare}
          accent="text-violet-100"
          glow="bg-violet-500/35"
          border="border-violet-400/30 hover:border-violet-300/50"
        >
          <p className="text-3xl font-semibold tabular-nums text-violet-100">{messages.length}</p>
          <p className="mt-1 text-xs text-white/45">unread</p>
          <p className="mt-auto pt-3 text-xs leading-relaxed text-white/55">{channelSummary}</p>
        </DashboardTile>

        <DashboardTile
          label="Calls"
          view="communications"
          icon={Video}
          accent="text-cyan-100"
          glow="bg-cyan-500/35"
          border="border-cyan-400/30 hover:border-cyan-300/50"
        >
          <p className="text-3xl font-semibold tabular-nums text-cyan-100">{callsScheduled}</p>
          <p className="mt-1 text-xs text-white/45">scheduled today</p>
          <p className="mt-auto pt-3 text-xs leading-relaxed text-white/55">{callsSummary}</p>
        </DashboardTile>

        <DashboardTile
          label="Your files"
          view="files-internal"
          icon={FolderOpen}
          accent="text-amber-100"
          glow="bg-amber-500/35"
          border="border-amber-400/30 hover:border-amber-300/50"
        >
          <ul className="space-y-2">
            {fallbackFiles.length > 0 ? (
              fallbackFiles.map((file) => (
                <li key={file.name} className="min-w-0">
                  <p className="truncate text-sm font-medium text-white/85">{file.name}</p>
                  <p className="truncate text-[11px] text-white/40">
                    {file.action} · {file.time}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-xs text-white/45">No recent file activity</li>
            )}
          </ul>
        </DashboardTile>

        <DashboardTile
          label="Support desk"
          view="support"
          icon={LifeBuoy}
          accent="text-emerald-100"
          glow="bg-emerald-500/35"
          border="border-emerald-400/30 hover:border-emerald-300/50"
        >
          <p className="text-3xl font-semibold tabular-nums text-emerald-100">{supportOver24h}</p>
          <p className="mt-1 text-xs text-white/45">open over 24h</p>
          <p className="mt-auto pt-3 text-xs leading-relaxed text-white/55">{supportSummary}</p>
        </DashboardTile>
      </div>
    </div>
  );
}
