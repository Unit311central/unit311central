"use client";

import {
  OT_HYPROP_DASHBOARD_KPIS,
  OT_HYPROP_DOCUMENTS,
  OT_HYPROP_EQUIPMENT,
  OT_HYPROP_INSTALLATIONS,
  OT_HYPROP_OPEN_ISSUES,
  OT_HYPROP_PORTAL,
  OT_HYPROP_RECENT_SERVICE,
  OT_HYPROP_UPCOMING_MAINTENANCE,
  type OtClientPortalSection,
} from "@/lib/saec/client-portal-data";
import { cn } from "@/lib/utils";

type Props = {
  section: OtClientPortalSection;
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
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function StatusChip({ status }: { status: string }) {
  const tone =
    /completed|operational|resolved/i.test(status)
      ? "bg-emerald-100 text-emerald-800"
      : /scheduled|planning|assigned/i.test(status)
        ? "bg-sky-100 text-sky-800"
        : /medium|parts/i.test(status)
          ? "bg-amber-100 text-amber-900"
          : "bg-slate-100 text-slate-700";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", tone)}>{status}</span>
  );
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

export function OmniTransitClientPortalApp({ section }: Props) {
  if (section === "installations") {
    return (
      <div className="space-y-5">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Installations</h1>
          <p className="text-sm text-slate-600">Hyprop portfolio sites under OmniTransit service.</p>
        </header>
        <div className="grid gap-3 md:grid-cols-2">
          {OT_HYPROP_INSTALLATIONS.map((site) => (
            <Panel key={site.id} title={site.name}>
              <p className="text-sm text-slate-600">{site.city}</p>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-lg bg-slate-50 p-2">
                  <dt className="text-xs text-slate-500">Units</dt>
                  <dd className="font-semibold text-slate-900">{site.units}</dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <dt className="text-xs text-slate-500">Lifts</dt>
                  <dd className="font-semibold text-slate-900">{site.elevators}</dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <dt className="text-xs text-slate-500">Escalators</dt>
                  <dd className="font-semibold text-slate-900">{site.escalators}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-slate-500">{site.status}</p>
            </Panel>
          ))}
        </div>
      </div>
    );
  }

  if (section === "equipment") {
    return (
      <div className="space-y-5">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Equipment</h1>
        </header>
        <Panel title="Registered assets">
          <ul className="space-y-3">
            {OT_HYPROP_EQUIPMENT.map((asset) => (
              <li key={asset.id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">{asset.assetId}</p>
                  <StatusChip status={asset.status} />
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {asset.type} · {asset.model}
                </p>
                <p className="text-xs text-slate-500">{asset.location}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Last service {formatDate(asset.lastService)}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    );
  }

  if (section === "maintenance" || section === "service") {
    const rows =
      section === "maintenance" ? OT_HYPROP_UPCOMING_MAINTENANCE : OT_HYPROP_RECENT_SERVICE;
    return (
      <div className="space-y-5">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">
            {section === "maintenance" ? "Upcoming maintenance" : "Recent service history"}
          </h1>
        </header>
        <Panel title="Assignments">
          <ul className="space-y-2 text-sm">
            {rows.map((row) => (
              <li key={row.id} className="rounded-lg border border-slate-100 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">{row.title}</p>
                  <StatusChip status={row.status} />
                </div>
                <p className="text-xs text-slate-500">
                  {row.reference} · {row.site} · {formatDate(row.scheduled)} · {row.priority}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    );
  }

  if (section === "issues") {
    return (
      <div className="space-y-5">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Open issues</h1>
        </header>
        <Panel title="Active incidents">
          <ul className="space-y-2 text-sm">
            {OT_HYPROP_OPEN_ISSUES.map((issue) => (
              <li key={issue.id} className="rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">{issue.title}</p>
                  <StatusChip status={issue.status} />
                </div>
                <p className="text-xs text-slate-600">
                  {issue.reference} · {issue.site} · {issue.severity} · Reported{" "}
                  {formatDate(issue.reported)}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    );
  }

  if (section === "documents") {
    return (
      <div className="space-y-5">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Documents</h1>
        </header>
        <Panel title="Library">
          <ul className="space-y-2 text-sm">
            {OT_HYPROP_DOCUMENTS.map((doc) => (
              <li key={doc.id} className="flex justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
                <div>
                  <p className="font-medium text-slate-900">{doc.title}</p>
                  <p className="text-xs text-slate-500">{doc.category}</p>
                </div>
                <span className="text-xs text-slate-500">{formatDate(doc.updated)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    );
  }

  if (section === "contact") {
    return (
      <div className="space-y-5">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Contact & service</h1>
        </header>
        <Panel title="Account team">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Account manager</dt>
              <dd className="font-medium text-slate-900">{OT_HYPROP_PORTAL.accountManager}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd>{OT_HYPROP_PORTAL.accountEmail}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Phone</dt>
              <dd>{OT_HYPROP_PORTAL.accountPhone}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Service desk</dt>
              <dd>{OT_HYPROP_PORTAL.serviceDesk}</dd>
            </div>
            <div>
              <dt className="text-slate-500">SLA</dt>
              <dd>{OT_HYPROP_PORTAL.slaResponse}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Contract</dt>
              <dd>{OT_HYPROP_PORTAL.contractType}</dd>
            </div>
          </dl>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">{OT_HYPROP_PORTAL.clientName}</h1>
        <p className="text-sm text-slate-600">
          Installation and maintenance overview · Currency {OT_HYPROP_PORTAL.currency}
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Panel title="Active sites">
          <p className="text-3xl font-semibold text-slate-900">
            {OT_HYPROP_DASHBOARD_KPIS.activeInstallations}
          </p>
        </Panel>
        <Panel title="Total units">
          <p className="text-3xl font-semibold text-slate-900">
            {OT_HYPROP_DASHBOARD_KPIS.totalUnits}
          </p>
        </Panel>
        <Panel title="Open issues">
          <p className="text-3xl font-semibold text-slate-900">
            {OT_HYPROP_DASHBOARD_KPIS.openIssues}
          </p>
        </Panel>
        <Panel title="YTD service spend">
          <p className="text-xl font-semibold text-slate-900">
            {OT_HYPROP_DASHBOARD_KPIS.ytdServiceSpend}
          </p>
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Upcoming maintenance">
          <ul className="space-y-2 text-sm text-slate-700">
            {OT_HYPROP_UPCOMING_MAINTENANCE.slice(0, 3).map((row) => (
              <li key={row.id}>
                {row.title} — {formatDate(row.scheduled)}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Equipment alerts">
          <ul className="space-y-2 text-sm text-slate-700">
            {OT_HYPROP_OPEN_ISSUES.map((issue) => (
              <li key={issue.id}>{issue.title}</li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
