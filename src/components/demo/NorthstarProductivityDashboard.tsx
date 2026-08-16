"use client";

import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  FolderOpen,
  LifeBuoy,
  Mail,
  MessageSquare,
  Video,
} from "lucide-react";

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { getInternalNavHref, type InternalOperationsView } from "@/lib/internal-operations-data";
import { cn } from "@/lib/utils";

type ProductivityTile = {
  label: string;
  hint: string;
  view: InternalOperationsView;
  value: string;
  icon: typeof Mail;
  accent: string;
  glow: string;
  border: string;
};

type NorthstarProductivityDashboardProps = {
  headline: string;
  nextUp: string;
  attention: number;
  changed: number;
  meetingsLeft: number;
  unreadEmail: number;
  messageCount: number;
  supportOpen: number;
  supportCritical: number;
  emailHint: string;
  messageHint: string;
};

export default function NorthstarProductivityDashboard({
  headline,
  nextUp,
  attention,
  changed,
  meetingsLeft,
  unreadEmail,
  messageCount,
  supportOpen,
  supportCritical,
  emailHint,
  messageHint,
}: NorthstarProductivityDashboardProps) {
  const basePath = useInternalOperationsBasePath();
  const href = (view: InternalOperationsView) => getInternalNavHref(view, basePath);

  const tiles: ProductivityTile[] = [
    {
      label: "Email",
      hint: emailHint,
      view: "info-email",
      value: String(unreadEmail),
      icon: Mail,
      accent: "text-rose-100",
      glow: "bg-rose-500/35",
      border: "border-rose-400/30 hover:border-rose-300/50",
    },
    {
      label: "Calendar",
      hint: nextUp,
      view: "calendar",
      value: String(meetingsLeft),
      icon: CalendarDays,
      accent: "text-sky-100",
      glow: "bg-sky-500/35",
      border: "border-sky-400/30 hover:border-sky-300/50",
    },
    {
      label: "Messaging",
      hint: messageHint,
      view: "messaging",
      value: String(messageCount),
      icon: MessageSquare,
      accent: "text-violet-100",
      glow: "bg-violet-500/35",
      border: "border-violet-400/30 hover:border-violet-300/50",
    },
    {
      label: "Communications",
      hint: "Voice & video meetings",
      view: "communications",
      value: "Live",
      icon: Video,
      accent: "text-cyan-100",
      glow: "bg-cyan-500/35",
      border: "border-cyan-400/30 hover:border-cyan-300/50",
    },
    {
      label: "Files",
      hint: "Internal & client workspaces",
      view: "files-internal",
      value: "Browse",
      icon: FolderOpen,
      accent: "text-amber-100",
      glow: "bg-amber-500/35",
      border: "border-amber-400/30 hover:border-amber-300/50",
    },
    {
      label: "Support Desk",
      hint: `${supportOpen} open · ${supportCritical} critical`,
      view: "support",
      value: String(supportOpen),
      icon: LifeBuoy,
      accent: "text-emerald-100",
      glow: "bg-emerald-500/35",
      border: "border-emerald-400/30 hover:border-emerald-300/50",
    },
  ];

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
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Northstar · Business Productivity
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Your dashboard</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/65">{headline}</p>
            <p className="mt-3 flex items-center gap-1.5 text-[12px] text-emerald-200/80">
              <Clock3 className="h-3.5 w-3.5" strokeWidth={1.6} />
              Next up: {nextUp}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:min-w-[18rem]">
            {[
              { label: "Needs attention", value: attention, ring: "border-rose-400/35 bg-rose-500/15", num: "text-rose-100" },
              { label: "Changed today", value: changed, ring: "border-sky-400/35 bg-sky-500/15", num: "text-sky-100" },
              { label: "Meetings left", value: meetingsLeft, ring: "border-violet-400/35 bg-violet-500/15", num: "text-violet-100" },
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.label}
              href={href(tile.view)}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-[#0b1524] to-[#060d18] p-5 shadow-[0_20px_48px_rgba(0,0,0,0.35)] transition hover:shadow-[0_24px_56px_rgba(0,0,0,0.45)]",
                tile.border,
              )}
            >
              <div
                className={cn(
                  "pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-40 blur-2xl transition group-hover:opacity-60",
                  tile.glow,
                )}
              />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    {tile.label}
                  </p>
                  <p className={cn("mt-3 text-3xl font-semibold tabular-nums", tile.accent)}>{tile.value}</p>
                  <p className="mt-2 truncate text-xs text-white/45">{tile.hint}</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <Icon className="h-4 w-4 text-white/80" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
