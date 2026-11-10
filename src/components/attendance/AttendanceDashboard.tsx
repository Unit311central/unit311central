"use client";

import { useCallback, useEffect, useState } from "react";

import type { AttendanceDashboardRow } from "@/lib/attendance/service";
import type { AttendanceStatusLabel } from "@/lib/attendance/status";
import { formatLondonTime, londonIsoDate } from "@/lib/attendance/time";

type DashboardPayload = {
  date: string;
  kpis: {
    totalEmployees: number;
    onSite: number;
    clockIns: number;
    missingClockOuts: number;
    lateArrivals: number;
    earlyDepartures: number;
  };
  rows: AttendanceDashboardRow[];
  employees: Array<{ id: string; employeeNumber: string; name: string }>;
};

const KPI_ITEMS = [
  ["totalEmployees", "Total employees"],
  ["onSite", "Currently on site"],
  ["clockIns", "Clock-ins today"],
  ["missingClockOuts", "Missing clock-outs"],
  ["lateArrivals", "Late arrivals"],
  ["earlyDepartures", "Early departures"],
] as const;

export default function AttendanceDashboard() {
  const [date, setDate] = useState(() => londonIsoDate(new Date()));
  const [employeeId, setEmployeeId] = useState("");
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ date });
    if (employeeId) params.set("employeeId", employeeId);
    const response = await fetch(`/api/attendance/dashboard?${params.toString()}`, { cache: "no-store" });
    const body = (await response.json()) as DashboardPayload & { error?: string };
    if (!response.ok) throw new Error(body.error || "Unable to load attendance.");
    setPayload(body);
  }, [date, employeeId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load()
      .then(() => {
        if (!cancelled) setError("");
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load attendance.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    const timer = window.setInterval(() => {
      void load().catch(() => undefined);
    }, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [load]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Attendance</h2>
            <p className="text-sm text-white/55">
              Live status calculated from attendance events in the demo workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="text-xs text-white/55">
              Date
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-1 block rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="text-xs text-white/55">
              Employee
              <select
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                className="mt-1 block rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              >
                <option value="">All employees</option>
                {(payload?.employees ?? []).map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.employeeNumber} · {employee.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {KPI_ITEMS.map(([key, label]) => (
          <article key={key} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-white/45">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {loading && !payload ? "—" : (payload?.kpis[key] ?? 0)}
            </p>
          </article>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-white/85">
            <thead className="bg-white/[0.04] text-[11px] uppercase tracking-[0.08em] text-white/45">
              <tr>
                {["Employee number", "Employee", "Department", "Clock in", "Clock out", "Hours", "Status"].map(
                  (heading) => (
                    <th key={heading} className="px-4 py-3 font-medium">
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {(payload?.rows ?? []).map((row) => (
                <tr key={row.employeeId} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium text-white">{row.employeeNumber}</td>
                  <td className="px-4 py-3">{row.employeeName}</td>
                  <td className="px-4 py-3">{row.department}</td>
                  <td className="px-4 py-3">{formatLondonTime(row.clockIn)}</td>
                  <td className="px-4 py-3">{formatLondonTime(row.clockOut)}</td>
                  <td className="px-4 py-3">{row.hoursWorked == null ? "—" : row.hoursWorked.toFixed(1)}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={row.status} />
                  </td>
                </tr>
              ))}
              {!loading && (payload?.rows.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-white/45">
                    No attendance rows for this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function StatusPill({ status }: { status: AttendanceStatusLabel }) {
  const tone =
    status === "Complete"
      ? "bg-emerald-400/15 text-emerald-100"
      : status === "Currently on site"
        ? "bg-sky-400/15 text-sky-100"
        : status === "Absent" || status === "Missing clock-out"
          ? "bg-rose-400/15 text-rose-100"
          : status === "Expected"
            ? "bg-white/10 text-white/70"
            : "bg-amber-400/15 text-amber-100";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{status}</span>;
}
