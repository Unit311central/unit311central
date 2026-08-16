"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowUpRight,
  Building2,
  ChevronRight,
  FileText,
  Landmark,
  MapPin,
  Users,
} from "lucide-react";

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { useCorporateMockStore } from "@/components/testflighthub/useCorporateMockStore";
import { loadNorthstarCompanyInformation } from "@/lib/demo/northstar-company-information";
import { getInternalNavHref, type InternalOperationsView } from "@/lib/internal-operations-data";
import { cn } from "@/lib/utils";

const NorthstarCorporateOfficeMap = dynamic(() => import("./NorthstarCorporateOfficeMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-white/10 bg-[#060d18] text-sm text-white/45">
      Loading map…
    </div>
  ),
});

function DashboardPanel({
  title,
  subtitle,
  href,
  icon: Icon,
  accent,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0b1524] to-[#060d18] p-4 shadow-[0_20px_48px_rgba(0,0,0,0.35)] transition hover:border-white/20 hover:shadow-[0_24px_56px_rgba(0,0,0,0.45)] sm:p-5",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-30 blur-2xl",
          accent,
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
              <Icon className="h-4 w-4 text-white/80" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-white">{title}</h2>
              {subtitle ? <p className="text-xs text-white/45">{subtitle}</p> : null}
            </div>
          </div>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-white/30 transition group-hover:text-white/70" />
      </div>
      <div className="relative mt-4 flex flex-1 flex-col">{children}</div>
    </Link>
  );
}

export default function NorthstarCorporateDashboard() {
  const basePath = useInternalOperationsBasePath();
  const store = useCorporateMockStore();
  const company = useMemo(() => loadNorthstarCompanyInformation(), []);

  const href = (view: InternalOperationsView) => getInternalNavHref(view, basePath);

  const activeOffices = store.offices.filter((office) => office.status === "active");
  const activeContracts = store.contracts.filter((contract) => contract.status === "active");
  const leaseContracts = activeContracts
    .filter((contract) => contract.type === "Lease")
    .slice(0, 3);
  const otherContracts = activeContracts
    .filter((contract) => contract.type !== "Lease")
    .slice(0, Math.max(0, 3 - leaseContracts.length));
  const contractPreview = [...leaseContracts, ...otherContracts].slice(0, 3);

  const totalHeadcount = activeOffices.reduce((sum, office) => sum + office.employees, 0);
  const registeredLine = company.registeredOfficeAddress.split("\n")[0] ?? "";

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-white">Corporate Information</h1>
        <p className="mt-1 text-sm text-white/60">
          Offices, treasury, contracts, and company profile at a glance.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-2">
        <DashboardPanel
          title="Office locations"
          subtitle={`${activeOffices.length} active sites · ${totalHeadcount} people`}
          href={href("office-locations")}
          icon={MapPin}
          accent="bg-sky-500/40"
          className="lg:col-start-1 lg:row-start-1"
        >
          <div className="space-y-2.5">
            {activeOffices.map((office) => (
              <div
                key={office.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{office.city}</p>
                  <p className="truncate text-xs text-white/45">{office.country}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#060d18]/80 px-2 py-1 text-[11px] font-semibold text-white/70">
                  <Users className="h-3 w-3" />
                  {office.employees}
                </span>
              </div>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Bank accounts"
          subtitle={`${store.banks.length} treasury accounts`}
          href={href("corporate-bank-accounts")}
          icon={Landmark}
          accent="bg-emerald-500/35"
          className="lg:col-start-2 lg:row-start-1"
        >
          <div className="space-y-2.5">
            {store.banks.slice(0, 4).map((bank) => (
              <div
                key={bank.id}
                className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-white">{bank.accountName}</p>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-200">
                    {bank.currency}
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/45">{bank.bank}</p>
              </div>
            ))}
          </div>
        </DashboardPanel>

        <div className="min-h-[320px] lg:col-start-3 lg:row-span-2 lg:row-start-1">
          <NorthstarCorporateOfficeMap />
        </div>

        <DashboardPanel
          title="Active contracts"
          subtitle={`${activeContracts.length} live agreements`}
          href={href("corporate-contracts")}
          icon={FileText}
          accent="bg-violet-500/35"
          className="lg:col-start-1 lg:row-start-2"
        >
          <div className="space-y-2.5">
            {contractPreview.map((contract) => (
              <div
                key={contract.id}
                className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug text-white">{contract.name}</p>
                  <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-200">
                    {contract.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/45">{contract.value}</p>
              </div>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Company information"
          subtitle={company.tradingName}
          href={href("corporate-company-details")}
          icon={Building2}
          accent="bg-amber-500/30"
          className="lg:col-start-2 lg:row-start-2"
        >
          <div className="flex flex-1 flex-col justify-between gap-3">
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                  Legal name
                </p>
                <p className="mt-1 text-sm font-medium leading-snug text-white">
                  {company.legalName}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                    Company no.
                  </p>
                  <p className="mt-1 text-sm text-white/85">{company.companyNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                    VAT
                  </p>
                  <p className="mt-1 text-sm text-white/85">{company.vatNumber}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                  Registered office
                </p>
                <p className="mt-1 text-xs leading-relaxed text-white/60">{registeredLine}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-300/90">
              View full profile
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}
