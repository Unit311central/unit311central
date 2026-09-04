"use client";

import type { GreenDesertClientPortalSection } from "@/lib/greendesert/client-portal-data";

type Props = {
  companyName: string;
  section: GreenDesertClientPortalSection;
};

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <div className="mt-3 text-sm text-white/65">{children}</div>
    </section>
  );
}

export function GreenDesertClientPortalApp({ companyName, section }: Props) {
  if (section === "projects") {
    return (
      <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-semibold text-white">Projects</h1>
          <p className="mt-1 text-sm text-white/55">Active engagements with {companyName}.</p>
        </header>
        <Panel title="Reactor deployment — Phase 1">
          <p>Site preparation and module delivery from Riyadh to Jeddah.</p>
          <p className="mt-2 text-xs text-emerald-200/80">Status: In progress</p>
        </Panel>
      </div>
    );
  }

  if (section === "documents") {
    return (
      <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-semibold text-white">Documents</h1>
          <p className="mt-1 text-sm text-white/55">Shared files and agreements.</p>
        </header>
        <Panel title="No documents published yet">
          <p>Your account manager will share contracts, specifications, and delivery notes here.</p>
        </Panel>
      </div>
    );
  }

  if (section === "support") {
    return (
      <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-semibold text-white">Support</h1>
          <p className="mt-1 text-sm text-white/55">Raise requests with the Green Desert team.</p>
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
      <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-semibold text-white">Messages</h1>
          <p className="mt-1 text-sm text-white/55">Secure messages from your account team.</p>
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
          Welcome
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">{companyName}</h1>
        <p className="mt-1 text-sm text-white/55">
          Your client portal for projects, documents, and support with Green Desert.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel title="Active project">
          <p>Reactor deployment — Phase 1</p>
          <p className="mt-1 text-xs text-white/45">Shipment in transit Riyadh → Jeddah</p>
        </Panel>
        <Panel title="Account manager">
          <p>Green Desert Client Success</p>
          <p className="mt-1 text-xs text-white/45">clientsuccess@greendesert.unit311central.com</p>
        </Panel>
        <Panel title="Open support tickets">
          <p>0 open</p>
        </Panel>
        <Panel title="Documents">
          <p>0 shared files</p>
        </Panel>
      </div>
    </div>
  );
}
