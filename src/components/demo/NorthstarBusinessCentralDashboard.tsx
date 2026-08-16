"use client";

import Link from "next/link";
import {
  Building2,
  ContactRound,
  Handshake,
  LayoutDashboard,
  ScrollText,
  Users,
} from "lucide-react";

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { getNorthstarClients } from "@/lib/demo/module-fixtures";
import { getNorthstarCrmLeads } from "@/lib/demo/module-fixtures";
import { getNorthstarOnboardingRecords } from "@/lib/demo/module-fixtures";
import { getNorthstarDiscoveryMeetings } from "@/lib/demo/module-fixtures";
import { getNorthstarPartners } from "@/lib/demo/module-fixtures";
import {
  getInternalNavHref,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";

function formatGbp(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function NorthstarBusinessCentralDashboard() {
  const basePath = useInternalOperationsBasePath();
  const href = (view: InternalOperationsView) => getInternalNavHref(view, basePath);

  const clients = getNorthstarClients();
  const leads = getNorthstarCrmLeads();
  const meetings = getNorthstarDiscoveryMeetings();
  const onboarding = getNorthstarOnboardingRecords();
  const partners = getNorthstarPartners();
  const pipelineGbp = leads
    .filter((l) => l.status !== "Won" && l.status !== "Lost")
    .reduce((sum, l) => sum + (l.estimatedValue ?? 0), 0);
  const activeClients = clients.filter((c) => c.accountStatus === "Active").length;

  const tiles = [
    {
      label: "Clients",
      value: String(clients.length),
      hint: `${activeClients} active · ${formatGbp(4_800_000)} ARR`,
      href: href("clients-dashboard"),
      icon: Building2,
    },
    {
      label: "Pipeline value",
      value: formatGbp(pipelineGbp),
      hint: `${leads.filter((l) => l.status !== "Won" && l.status !== "Lost").length} open deals`,
      href: href("crm"),
      icon: ContactRound,
    },
    {
      label: "Discovery",
      value: String(meetings.length),
      hint: "Scheduled discovery meetings",
      href: href("crm-meetings"),
      icon: Users,
    },
    {
      label: "Onboarding",
      value: String(onboarding.length),
      hint: "Clients in onboarding",
      href: href("client-onboarding"),
      icon: LayoutDashboard,
    },
    {
      label: "Partners",
      value: String(partners.length),
      hint: "Channel & integration partners",
      href: href("representatives"),
      icon: Handshake,
    },
    {
      label: "Grants",
      value: "UK & EU",
      hint: "Innovate UK · Made Smarter · Horizon",
      href: href("grants"),
      icon: ScrollText,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-1 py-4 sm:py-6" aria-label="Business Central dashboard">
      <header className="rounded-2xl border border-white/12 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
          Northstar · Business Central
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
          Commercial snapshot across clients, pipeline, discovery, onboarding, partners, and grant programmes — GBP.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.label}
              href={tile.href}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition-colors hover:border-sky-400/35 hover:bg-sky-500/[0.07]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">{tile.label}</p>
                <Icon className="h-4 w-4 text-sky-300/80" aria-hidden />
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-white">{tile.value}</p>
              <p className="mt-1 text-xs text-white/40">{tile.hint}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
