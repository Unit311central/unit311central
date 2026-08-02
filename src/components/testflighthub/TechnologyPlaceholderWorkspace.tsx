"use client";

import {
  Cpu,
  KeyRound,
  Laptop,
  Radio,
  ScrollText,
  Server,
  Settings,
} from "lucide-react";

import { isBrowserAbhiSurface } from "@/lib/abhi-surface";
import {
  ABHI_TECH_ASSETS,
  ABHI_TECH_DEVICES,
  ABHI_TECH_TELECOMS,
} from "@/lib/abhi-tech-fake-data";
import { cn } from "@/lib/utils";
import { WsEmpty, WsSection } from "./domain-workspace-ui";

type TechnologyPlaceholderModule =
  | "devices"
  | "telecommunications"
  | "infrastructure"
  | "reports"
  | "settings";

const MODULE_COPY: Record<
  TechnologyPlaceholderModule,
  {
    title: string;
    icon: typeof Laptop;
    eyebrow: string;
    summary: string;
    futureScope: string[];
    integrations: string[];
  }
> = {
  devices: {
    title: "Devices",
    icon: Laptop,
    eyebrow: "Physical technology estate",
    summary:
      "Manage laptops, desktops, monitors, mobiles, networking hardware, servers and peripherals. Each device will link to employees, assets, locations, suppliers, warranties, purchase orders, finance and support tickets.",
    futureScope: [
      "Laptops, desktops, monitors, docking stations",
      "Mobile phones, tablets, printers",
      "Routers, switches, firewalls, wireless access points",
      "Servers, storage, peripherals",
      "Assignment to employees and locations",
      "Warranty, supplier and PO linkage",
    ],
    integrations: ["HR & People", "Assets", "Inventory", "Procurement", "Financials", "Service Desk"],
  },
  telecommunications: {
    title: "Telecommunications",
    icon: Radio,
    eyebrow: "Connectivity & voice services",
    summary:
      "Track mobile lines, SIM/eSIM inventory, carriers, plans, broadband, fibre, WAN links and circuit identifiers — with costs, contracts and assigned users.",
    futureScope: [
      "Mobile phones, SIM cards, eSIMs, phone numbers",
      "Carriers, mobile plans, monthly costs",
      "Internet, broadband, fibre, WAN links",
      "Contracts, public IPs, circuit IDs",
      "Assigned users and technology vendors",
    ],
    integrations: ["Devices", "Financials", "HR & People", "Procurement"],
  },
  infrastructure: {
    title: "Infrastructure",
    icon: Server,
    eyebrow: "Cloud platforms & platform services",
    summary:
      "Operate the company's internal cloud and platform footprint — AWS, Azure, GCP, Supabase, Vercel, Cloudflare — plus identity, DNS, SSL, backups, monitoring and disaster recovery.",
    futureScope: [
      "Cloud platforms: AWS, Azure, Google Cloud",
      "Supabase, Vercel, Cloudflare",
      "Servers, databases, DNS, domains, SSL",
      "Backups, monitoring, identity, VPN, SSO",
      "Disaster recovery runbooks",
    ],
    integrations: ["Financials", "Operations", "Service Desk"],
  },
  reports: {
    title: "Reports",
    icon: ScrollText,
    eyebrow: "Technology estate reporting",
    summary:
      "Production-quality reporting for device utilisation, licence compliance, telecom spend, infrastructure health and renewal forecasts will live here.",
    futureScope: [
      "Device inventory and utilisation reports",
      "Licence compliance and seat usage",
      "Telecom spend by department",
      "Infrastructure health & uptime",
      "Renewal and warranty forecasts",
    ],
    integrations: ["Financials", "HR & People", "Business Central"],
  },
  settings: {
    title: "Settings",
    icon: Settings,
    eyebrow: "Technology Management configuration",
    summary:
      "Workspace configuration for categories, approval defaults, vendor catalogues, alert thresholds and integration endpoints will be managed here.",
    futureScope: [
      "Device and software categories",
      "Alert thresholds and renewal windows",
      "Vendor catalogue defaults",
      "Role permissions for Technology officers",
      "Integration endpoints (Finance, HR, Service Desk)",
    ],
    integrations: ["Settings", "Users", "Procurement"],
  },
};

function statusClass(status: string) {
  if (/in use|active/i.test(status)) return "bg-emerald-500/15 text-emerald-200";
  if (/spare|pending/i.test(status)) return "bg-amber-500/15 text-amber-200";
  if (/repair|cancelled/i.test(status)) return "bg-rose-500/15 text-rose-200";
  return "bg-white/10 text-white/60";
}

function AbhiDevicesRegister() {
  return (
    <div className="space-y-4">
      <WsSection title="Devices" subtitle="ABHI physical technology estate">
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wide text-white/45">
              <tr>
                <th className="px-3 py-2.5">Device</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5">Assigned</th>
                <th className="px-3 py-2.5">Location</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Warranty</th>
              </tr>
            </thead>
            <tbody>
              {ABHI_TECH_DEVICES.map((row) => (
                <tr key={row.id} className="border-t border-white/8 text-white/80">
                  <td className="px-3 py-2.5 font-medium text-white">{row.name}</td>
                  <td className="px-3 py-2.5">{row.type}</td>
                  <td className="px-3 py-2.5">{row.assignedTo}</td>
                  <td className="px-3 py-2.5">{row.location}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-medium", statusClass(row.status))}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{row.warranty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WsSection>
      <WsSection title="Tech Assets" subtitle="Tagged ABHI estate">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ABHI_TECH_ASSETS.map((asset) => (
            <div
              key={asset.id}
              className="rounded-xl border border-white/10 bg-[#0b1524]/80 px-3 py-3"
            >
              <p className="text-[11px] font-mono text-sky-300/80">{asset.tag}</p>
              <p className="mt-1 text-sm font-medium text-white">{asset.name}</p>
              <p className="mt-1 text-xs text-white/45">
                {asset.category} · {asset.location}
              </p>
              <p className="mt-2 text-sm tabular-nums text-white/80">
                £{asset.valueGbp.toLocaleString("en-GB")}
              </p>
            </div>
          ))}
        </div>
      </WsSection>
    </div>
  );
}

function AbhiTelecomsRegister() {
  const monthly = ABHI_TECH_TELECOMS.reduce((sum, row) => sum + row.monthlyCostGbp, 0);
  return (
    <div className="space-y-4">
      <WsSection
        title="Telecommunications"
        subtitle="ABHI connectivity & voice"
        actions={
          <span className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
            £{monthly}/mo
          </span>
        }
      >
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wide text-white/45">
              <tr>
                <th className="px-3 py-2.5">Service</th>
                <th className="px-3 py-2.5">Carrier</th>
                <th className="px-3 py-2.5">Number / circuit</th>
                <th className="px-3 py-2.5">Assigned</th>
                <th className="px-3 py-2.5">£/mo</th>
                <th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {ABHI_TECH_TELECOMS.map((row) => (
                <tr key={row.id} className="border-t border-white/8 text-white/80">
                  <td className="px-3 py-2.5 font-medium text-white">{row.service}</td>
                  <td className="px-3 py-2.5">{row.carrier}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{row.numberOrCircuit}</td>
                  <td className="px-3 py-2.5">{row.assignedTo}</td>
                  <td className="px-3 py-2.5 tabular-nums">{row.monthlyCostGbp}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-medium", statusClass(row.status))}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WsSection>
    </div>
  );
}

type TechnologyPlaceholderWorkspaceProps = {
  module: TechnologyPlaceholderModule;
};

export default function TechnologyPlaceholderWorkspace({
  module,
}: TechnologyPlaceholderWorkspaceProps) {
  const isAbhi = isBrowserAbhiSurface();
  if (isAbhi && module === "devices") return <AbhiDevicesRegister />;
  if (isAbhi && module === "telecommunications") return <AbhiTelecomsRegister />;

  const copy = MODULE_COPY[module];
  const Icon = copy.icon;

  return (
    <div className="space-y-4">
      <WsSection
        title={copy.title}
        subtitle={copy.eyebrow}
        actions={
          <span className="inline-flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-200">
            <Cpu className="h-3.5 w-3.5" />
            Coming online
          </span>
        }
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#0b1524] text-sky-300">
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-sm leading-relaxed text-white/70">{copy.summary}</p>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">
              Integrates with
            </p>
            <div className="flex flex-wrap gap-2">
              {copy.integrations.map((label) => (
                <span
                  key={label}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/65"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </WsSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <WsSection title="Planned capability" subtitle="Roadmap for this module">
          <ul className="space-y-2">
            {copy.futureScope.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 rounded-xl border border-white/10 bg-[#0b1524]/70 px-3 py-2.5 text-sm text-white/75"
              >
                <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400/80" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </WsSection>

        <WsSection title="Module status" subtitle="Information architecture complete">
          <WsEmpty message={`${copy.title} is scaffolded. Navigation, permissions boundaries and integration points are in place. Operational workflows will land in a later release without changing this workspace structure.`} />
        </WsSection>
      </div>
    </div>
  );
}
