"use client";

import type { GreenDesertClientPortalSection } from "@/lib/greendesert/client-portal-data";
import { cn } from "@/lib/utils";

type Props = {
  companyName: string;
  section: GreenDesertClientPortalSection;
};

function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-5",
        className,
      )}
    >
      <h2 className="text-sm font-semibold tracking-tight text-white">{title}</h2>
      <div className="mt-3 text-sm text-white/70">{children}</div>
    </section>
  );
}

function StatusChip({ status }: { status: string }) {
  const tone =
    /progress|transit|active/i.test(status)
      ? "border-teal-400/25 bg-teal-500/10 text-teal-200"
      : /scheduled|planning/i.test(status)
        ? "border-sky-400/25 bg-sky-500/10 text-sky-200"
        : "border-white/15 bg-white/5 text-white/70";
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", tone)}>
      {status}
    </span>
  );
}

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-white/45">{hint}</p> : null}
    </div>
  );
}

export function GreenDesertClientPortalApp({ companyName, section }: Props) {
  if (section === "projects") {
    return (
      <div className="space-y-5">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300/70">
            Programme
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Active projects</h1>
          <p className="mt-1 text-sm text-white/50">
            Reactor deployment and integration work for {companyName}.
          </p>
        </header>
        <Panel title="Reactor deployment — Phase 1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p>Site preparation and module delivery from Riyadh to Jeddah.</p>
              <p className="mt-2 text-xs text-white/45">Milestone: Module install — Q4 2026</p>
            </div>
            <StatusChip status="In progress" />
          </div>
        </Panel>
      </div>
    );
  }

  if (section === "documents") {
    return (
      <div className="space-y-5">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300/70">
            Workspace
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Documents</h1>
          <p className="mt-1 text-sm text-white/50">Shared contracts, specifications, and delivery notes.</p>
        </header>
        <Panel title="Shared library">
          <p>No documents published yet. Your account manager will share files here.</p>
        </Panel>
      </div>
    );
  }

  if (section === "support") {
    return (
      <div className="space-y-5">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300/70">
            Workspace
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Support</h1>
          <p className="mt-1 text-sm text-white/50">Raise requests with the Green Desert team.</p>
        </header>
        <Panel title="Support desk">
          <p>Email: support@greendesert.unit311central.com</p>
          <p className="mt-2">No open tickets for {companyName}.</p>
        </Panel>
      </div>
    );
  }

  if (section === "messages") {
    return (
      <div className="space-y-5">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300/70">
            Workspace
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Messages</h1>
          <p className="mt-1 text-sm text-white/50">Secure messages from your account team.</p>
        </header>
        <Panel title="Inbox">
          <p>No messages yet.</p>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300/70">
          Programme dashboard
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">{companyName}</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/50">
          Secure client portal for reactor deployment status, documents, and support with Green
          Desert.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active project" value="1" hint="Reactor deployment — Phase 1" />
        <KpiCard label="Shipment status" value="In transit" hint="Riyadh → Jeddah" />
        <KpiCard label="Open tickets" value="0" hint="Support desk" />
        <KpiCard label="Documents" value="0" hint="Shared files" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Reactor deployment — Phase 1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p>Module delivery and site commissioning for the Jeddah campus.</p>
              <p className="mt-2 text-xs text-white/45">Next milestone: Receiving inspection</p>
            </div>
            <StatusChip status="In progress" />
          </div>
        </Panel>
        <Panel title="Account manager">
          <p>Green Desert Client Success</p>
          <p className="mt-1 text-xs text-white/45">clientsuccess@greendesert.unit311central.com</p>
        </Panel>
      </div>
    </div>
  );
}
