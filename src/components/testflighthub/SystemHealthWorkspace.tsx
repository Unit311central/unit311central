"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ExternalLink,
  Loader2,
  Server,
} from "lucide-react";

import type {
  HealthComponentReport,
  HealthIncidentRow,
  SystemHealthReport,
} from "@/lib/system-health/types";
import { cn } from "@/lib/utils";

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border border-white/12 bg-white/[0.035] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl"
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm text-white/45">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function statusTone(status: HealthComponentReport["status"]) {
  switch (status) {
    case "ok":
      return "text-emerald-200 border-emerald-400/35 bg-emerald-500/15";
    case "degraded":
      return "text-amber-100 border-amber-400/35 bg-amber-500/15";
    case "failed":
      return "text-rose-100 border-rose-400/40 bg-rose-500/15";
    default:
      return "text-white/60 border-white/15 bg-white/[0.04]";
  }
}

function statusLabel(status: HealthComponentReport["status"]) {
  switch (status) {
    case "ok":
      return "Operational";
    case "degraded":
      return "Degraded";
    case "failed":
      return "Failed";
    default:
      return "Not checked";
  }
}

function StatusIcon({ status }: { status: HealthComponentReport["status"] }) {
  if (status === "ok") return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
  if (status === "failed") return <AlertTriangle className="h-4 w-4 text-rose-300" />;
  if (status === "degraded") return <AlertTriangle className="h-4 w-4 text-amber-300" />;
  return <Circle className="h-4 w-4 text-white/40" />;
}

function ServiceRow({ row }: { row: HealthComponentReport }) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-xl border px-4 py-3",
        row.status === "failed" && row.critical
          ? "border-rose-400/40 bg-rose-500/10"
          : "border-white/10 bg-white/[0.03]",
      )}
    >
      <div className="flex items-start gap-3">
        <StatusIcon status={row.status} />
        <div>
          <p className="font-medium text-white">{row.label}</p>
          {row.detail ? <p className="mt-0.5 text-xs text-white/45">{row.detail}</p> : null}
          {!row.critical && row.id === "openai" ? (
            <p className="mt-1 text-[11px] uppercase tracking-wide text-white/35">Non-critical</p>
          ) : null}
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
          statusTone(row.status),
        )}
      >
        {statusLabel(row.status)}
      </span>
    </div>
  );
}

function formatWhen(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function durationBetween(start: string, end: string | null) {
  if (!end) return "Ongoing";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600_000) return `${Math.round(ms / 60_000)}m`;
  return `${(ms / 3600_000).toFixed(1)}h`;
}

export default function SystemHealthWorkspace() {
  const [report, setReport] = useState<SystemHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/internal/system-health", { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Unable to load system health.");
      setReport(body as SystemHealthReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load system health.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const critical = useMemo(
    () => report?.components.filter((row) => row.critical) ?? [],
    [report],
  );
  const supporting = useMemo(
    () =>
      report?.components.filter(
        (row) => !row.critical && row.id !== "github_monitoring",
      ) ?? [],
    [report],
  );
  const github = useMemo(
    () => report?.components.find((row) => row.id === "github_monitoring"),
    [report],
  );

  const overallLabel =
    report?.overall === "critical"
      ? "Critical"
      : report?.overall === "degraded"
        ? "Degraded"
        : "Operational";

  const overallTone =
    report?.overall === "critical"
      ? "text-rose-200 border-rose-400/40 bg-rose-500/15"
      : report?.overall === "degraded"
        ? "text-amber-100 border-amber-400/35 bg-amber-500/15"
        : "text-emerald-200 border-emerald-400/35 bg-emerald-500/15";

  if (loading && !report) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-white/60">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading system health…
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6 text-rose-100">
        <p className="font-semibold">System Health unavailable</p>
        <p className="mt-1 text-sm text-rose-100/80">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-4 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/15"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">System Health</h1>
          <p className="mt-1 text-sm text-white/45">
            Production readiness for Unit311 Central — last checked {formatWhen(report.checkedAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-60"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <Section title="Overall Status">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold",
              overallTone,
            )}
          >
            {report.overall === "operational" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {overallLabel}
          </span>
        </div>
      </Section>

      <Section title="Critical Services" subtitle="Required for customer-facing operation">
        <div className="space-y-3">
          {critical.map((row) => <ServiceRow key={row.id} row={row} />)}
        </div>
      </Section>

      <Section title="Supporting Services" subtitle="Non-blocking for core platform availability">
        <div className="space-y-3">
          {supporting.map((row) => <ServiceRow key={row.id} row={row} />)}
        </div>
      </Section>

      <Section
        title="External Monitoring"
        subtitle="GitHub Actions probes the public health endpoint every 5 minutes"
      >
        <div className="space-y-3">
          {github ? <ServiceRow row={github} /> : null}
          <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-2">
            <div>
              <p className="text-white/40">Last check</p>
              <p className="font-medium text-white">
                {formatWhen(report.externalMonitoring.lastCheckAt)}
              </p>
            </div>
            <div>
              <p className="text-white/40">Last failure</p>
              <p className="font-medium text-white">
                {formatWhen(report.externalMonitoring.lastFailureAt)}
              </p>
            </div>
            <div>
              <p className="text-white/40">Last recovery</p>
              <p className="font-medium text-white">
                {formatWhen(report.externalMonitoring.lastRecoveryAt)}
              </p>
            </div>
            <div>
              <p className="text-white/40">Endpoint</p>
              <a
                href={report.externalMonitoring.productionHealthUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-sky-300 hover:text-sky-100"
              >
                {report.externalMonitoring.productionHealthUrl}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
          <a
            href={`https://github.com/Unit311central/unit311central/actions/workflows/unit311-health-check.yml`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-sky-300 hover:text-sky-100"
          >
            <Activity className="h-4 w-4" />
            Open GitHub Actions workflow
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </Section>

      <Section title="Recent Incidents" subtitle="Operational history from internal health checks">
        {report.incidents.length === 0 ? (
          <p className="text-sm text-white/45">No recorded incidents yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-white/40">
                <tr>
                  <th className="pb-2 pr-4">Timestamp</th>
                  <th className="pb-2 pr-4">Component</th>
                  <th className="pb-2 pr-4">Severity</th>
                  <th className="pb-2 pr-4">Duration</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="text-white/80">
                {report.incidents.map((row: HealthIncidentRow) => (
                  <tr key={row.id} className="border-t border-white/8">
                    <td className="py-2 pr-4 tabular-nums">{formatWhen(row.startedAt)}</td>
                    <td className="py-2 pr-4">{row.component}</td>
                    <td className="py-2 pr-4 capitalize">{row.severity}</td>
                    <td className="py-2 pr-4">
                      {durationBetween(row.startedAt, row.endedAt)}
                    </td>
                    <td className="py-2 capitalize">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <p className="text-xs text-white/35">
        <Server className="mr-1 inline h-3.5 w-3.5" />
        Public probe: minimal JSON only. Detailed diagnostics stay on this internal page.
      </p>
    </div>
  );
}
