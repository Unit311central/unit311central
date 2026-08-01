"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import type { LmsCertificate, LmsCourse, LmsEnrolment } from "@/lib/lms/types";
import { cn } from "@/lib/utils";

type ReportingPayload = {
  byCompany?: {
    clientId: string;
    assigned: number;
    started: number;
    completed: number;
    failed: number;
    compliancePct: number;
  }[];
  byUser?: {
    userId: string;
    courseId: string;
    courseTitle: string;
    status: string;
    score: number | null;
    completedAt: string | null;
    certificateNumber: string | null;
  }[];
};

type CatalogItem = {
  course: LmsCourse;
  enrolment: LmsEnrolment | null;
};

function trafficClass(pct: number): string {
  if (pct >= 90) return "bg-emerald-500";
  if (pct >= 70) return "bg-amber-400";
  return "bg-rose-500";
}

function trafficLabel(pct: number): string {
  if (pct >= 90) return "On track";
  if (pct >= 70) return "Watch";
  return "At risk";
}

export default function LmsReportingDashboard() {
  const [reporting, setReporting] = useState<ReportingPayload | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [certificates, setCertificates] = useState<LmsCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [repRes, catRes, certRes] = await Promise.all([
          fetch("/api/lms/reporting", { credentials: "include" }),
          fetch("/api/lms/catalog", { credentials: "include" }),
          fetch("/api/lms/certificates", { credentials: "include" }),
        ]);
        const rep = (await repRes.json()) as ReportingPayload & { error?: string };
        const cat = (await catRes.json()) as {
          courses?: Array<LmsCourse & { enrolment?: LmsEnrolment | null }>;
          items?: CatalogItem[];
          error?: string;
        };
        const cert = (await certRes.json()) as {
          certificates?: LmsCertificate[];
          error?: string;
        };
        if (!repRes.ok) throw new Error(rep.error || "Reporting failed.");
        if (cancelled) return;
        setReporting(rep);
        const normalizedCatalog: CatalogItem[] =
          cat.items ??
          (cat.courses ?? []).map((row) => ({
            course: row,
            enrolment: row.enrolment ?? null,
          }));
        setCatalog(normalizedCatalog);
        setCertificates(cert.certificates ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load LMS reporting.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const companyRows = reporting?.byCompany ?? [];
  const userRows = reporting?.byUser ?? [];

  const overallPct = useMemo(() => {
    if (companyRows.length === 0) return 0;
    const sum = companyRows.reduce((acc, r) => acc + r.compliancePct, 0);
    return Math.round(sum / companyRows.length);
  }, [companyRows]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/55">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading LMS reporting…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-sm text-rose-100">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">LMS Compliance Reporting</h2>
            <p className="mt-1 text-sm text-white/55">
              Live enrolments, traffic-light compliance, and certificate coverage.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <span className={cn("h-2.5 w-2.5 rounded-full", trafficClass(overallPct))} />
            <span className="text-sm text-white">
              Portfolio {overallPct}% · {trafficLabel(overallPct)}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Published courses", String(catalog.length || "—")],
            ["Companies tracked", String(companyRows.length)],
            ["Learner rows", String(userRows.length)],
            ["Certificates", String(certificates.length)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
                {label}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-white">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-base font-semibold text-white">By company</h3>
        <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
              <tr>
                <th className="px-3 py-2.5">Client</th>
                <th className="px-3 py-2.5">Assigned</th>
                <th className="px-3 py-2.5">In progress</th>
                <th className="px-3 py-2.5">Completed</th>
                <th className="px-3 py-2.5">Failed</th>
                <th className="px-3 py-2.5">Compliance</th>
              </tr>
            </thead>
            <tbody>
              {companyRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-white/45">
                    No enrolment data yet.
                  </td>
                </tr>
              ) : (
                companyRows.map((row) => (
                  <tr key={row.clientId} className="border-t border-white/8 text-white/80">
                    <td className="px-3 py-2.5 font-medium text-white">{row.clientId}</td>
                    <td className="px-3 py-2.5 tabular-nums">{row.assigned}</td>
                    <td className="px-3 py-2.5 tabular-nums">{row.started}</td>
                    <td className="px-3 py-2.5 tabular-nums">{row.completed}</td>
                    <td className="px-3 py-2.5 tabular-nums">{row.failed}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            trafficClass(row.compliancePct),
                          )}
                        />
                        <span className="tabular-nums">{row.compliancePct}%</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-base font-semibold text-white">By user</h3>
        <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
              <tr>
                <th className="px-3 py-2.5">User</th>
                <th className="px-3 py-2.5">Course</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Score</th>
                <th className="px-3 py-2.5">Completed</th>
                <th className="px-3 py-2.5">Certificate</th>
              </tr>
            </thead>
            <tbody>
              {userRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-white/45">
                    No learner rows yet.
                  </td>
                </tr>
              ) : (
                userRows.map((row, i) => (
                  <tr
                    key={`${row.userId}-${row.courseId}-${i}`}
                    className="border-t border-white/8 text-white/80"
                  >
                    <td className="px-3 py-2.5 font-medium text-white">{row.userId}</td>
                    <td className="px-3 py-2.5">{row.courseTitle}</td>
                    <td className="px-3 py-2.5 capitalize">{row.status.replaceAll("_", " ")}</td>
                    <td className="px-3 py-2.5 tabular-nums">
                      {row.score == null ? "—" : `${row.score}%`}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">
                      {row.completedAt ? row.completedAt.slice(0, 10) : "—"}
                    </td>
                    <td className="px-3 py-2.5">{row.certificateNumber ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {catalog.length > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-base font-semibold text-white">Catalog snapshot</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {catalog.map((item) => (
              <li
                key={item.course.id}
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/75"
              >
                <span className="font-medium text-white">{item.course.title}</span>
                <span className="mt-0.5 block text-xs text-white/45">
                  {item.course.category} · {item.course.durationMinutes} min ·{" "}
                  {item.enrolment?.status ?? "unassigned"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
