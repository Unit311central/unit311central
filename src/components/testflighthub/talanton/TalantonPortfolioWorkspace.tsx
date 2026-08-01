"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";

import {
  getInternalNavHref,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";
import {
  companyPortalAbsoluteUrl,
  getCompanyPortalByCompanyId,
} from "@/lib/talanton/company-portal-routes";
import {
  createBlankCourse,
  listManagedCourses,
  saveManagedCourses,
  type ManagedCourse,
} from "@/lib/talanton/course-management-store";
import {
  companyById,
  companyContacts,
  companyDocuments,
  companyNameById,
  companyTrainingDetail,
  courseTitleById,
  formatUsd,
  portfolioComplianceSummary,
  portfolioTrainingDashboardSummary,
  TALANTON_ACTIONS,
  TALANTON_COMPLIANCE_COURSES,
  TALANTON_MY_TRAINING,
  TALANTON_POLICIES,
  TALANTON_PORTFOLIO_COMPANIES,
  TALANTON_QUARTERLY_REPORTS,
  TALANTON_RISKS,
  type PortfolioCompany,
  type RiskRating,
} from "@/lib/talanton/portfolio-data";
import { cn } from "@/lib/utils";
import LmsReportingDashboard from "@/components/lms/LmsReportingDashboard";
import { useInternalOperationsBasePath } from "../InternalOperationsBasePathContext";

type Props = {
  view: InternalOperationsView;
};

function riskClass(rating: RiskRating) {
  switch (rating) {
    case "Low":
      return "bg-emerald-500/15 text-emerald-300";
    case "Medium":
      return "bg-amber-500/15 text-amber-300";
    case "High":
      return "bg-orange-500/20 text-orange-300";
    case "Critical":
      return "bg-rose-500/20 text-rose-300";
    default:
      return "bg-white/10 text-white/70";
  }
}

function statusClass(status: string) {
  const s = status.toLowerCase();
  if (s.includes("complete") || s === "done" || s === "published" || s === "closed" || s === "submitted") {
    return "bg-emerald-500/15 text-emerald-300";
  }
  if (s.includes("progress") || s === "mitigating" || s === "in review" || s === "due soon") {
    return "bg-sky-500/15 text-sky-300";
  }
  if (s.includes("overdue") || s === "critical" || s === "open" || s === "not started") {
    return "bg-rose-500/15 text-rose-300";
  }
  if (s === "draft") return "bg-white/10 text-white/60";
  return "bg-amber-500/15 text-amber-300";
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-5 p-5 sm:p-6">
      <header className="shrink-0">
        <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-white/55">{subtitle}</p>
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}

function KpiRow({
  items,
}: {
  items: Array<{ label: string; value: string | number; icon?: ReactNode }>;
}) {
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-wide text-white/45">{item.label}</p>
            {item.icon}
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function TableShell({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <table className="w-full min-w-[900px] border-collapse text-left text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2.5 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/8 text-white/85">{children}</tbody>
      </table>
    </div>
  );
}

function Pill({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
    >
      {children}
    </span>
  );
}

function CompanyLink({ company }: { company: PortfolioCompany }) {
  const basePath = useInternalOperationsBasePath();
  const href = getInternalNavHref("portfolio-directory", basePath, {
    companyId: company.id,
  });
  return (
    <a href={href} className="font-medium text-sky-300 hover:text-sky-200 hover:underline">
      {company.name}
    </a>
  );
}

function CompanyDetailPanel({ company }: { company: PortfolioCompany }) {
  const contacts = companyContacts(company);
  const docs = companyDocuments(company);
  const training = companyTrainingDetail(company);
  const reports = TALANTON_QUARTERLY_REPORTS.filter((r) => r.companyId === company.id);
  const portal = getCompanyPortalByCompanyId(company.id);
  const portalUrl = portal ? companyPortalAbsoluteUrl(portal) : "—";
  const portalLogin = portal?.username ?? "—";
  const reportingStatus =
    reports.some((r) => r.status === "Overdue")
      ? "Overdue"
      : reports.some((r) => r.status === "Due Soon")
        ? "Due Soon"
        : reports.some((r) => r.status === "Submitted")
          ? "Submitted"
          : reports.length > 0
            ? "Not Started"
            : "No reports";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-white">{company.name}</h2>
        <p className="text-sm text-white/50">
          {company.sector} · {company.city}, {company.country}
        </p>
      </div>
      <KpiRow
        items={[
          { label: "Investment", value: formatUsd(company.investmentAmountUsd) },
          { label: "Ownership", value: `${company.ownershipPct}%` },
          { label: "Revenue", value: formatUsd(company.annualRevenueUsd) },
          { label: "Compliance", value: `${company.compliancePct}%` },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-sm font-medium text-white/70">Company details</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/80">{company.overview}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div><dt className="text-white/45">Country</dt><dd className="text-white">{company.country}</dd></div>
            <div><dt className="text-white/45">Sector</dt><dd className="text-white">{company.sector}</dd></div>
            <div><dt className="text-white/45">Growth</dt><dd className="tabular-nums text-white">{company.revenueGrowthPct}%</dd></div>
            <div><dt className="text-white/45">Risk</dt><dd><Pill className={riskClass(company.riskRating)}>{company.riskRating}</Pill></dd></div>
          </dl>
        </section>
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="mb-2 text-sm font-medium text-white/70">Portal access</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-white/45">Portal URL</dt>
              <dd className="break-all text-sky-300">{portalUrl}</dd>
            </div>
            <div>
              <dt className="text-white/45">Portal login email</dt>
              <dd className="text-white">{portalLogin}</dd>
            </div>
            <div>
              <dt className="text-white/45">Assigned external user</dt>
              <dd className="text-white">{portalLogin}</dd>
            </div>
          </dl>
        </section>
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="mb-2 text-sm font-medium text-white/70">Compliance status</h3>
          <p className="text-sm text-white/80">
            <Pill className={statusClass(training.status)}>{training.status}</Pill>
            <span className="ml-2">{company.compliancePct}% complete · {company.outstandingTraining} outstanding modules</span>
          </p>
        </section>
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="mb-2 text-sm font-medium text-white/70">Training status</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div><dt className="text-white/45">Assigned courses</dt><dd className="tabular-nums text-white">{training.assignedCourses}</dd></div>
            <div><dt className="text-white/45">Completed courses</dt><dd className="tabular-nums text-white">{training.completedCourses}</dd></div>
            <div><dt className="text-white/45">Outstanding courses</dt><dd className="tabular-nums text-white">{training.outstandingCourses}</dd></div>
            <div><dt className="text-white/45">Users enrolled</dt><dd className="tabular-nums text-white">{training.assignedUsers}</dd></div>
            <div><dt className="text-white/45">Completed users</dt><dd className="tabular-nums text-white">{training.completedUsers}</dd></div>
            <div><dt className="text-white/45">Outstanding users</dt><dd className="tabular-nums text-white">{training.outstandingUsers}</dd></div>
            <div className="col-span-2"><dt className="text-white/45">Last training activity</dt><dd className="text-white">{training.lastTrainingActivity}</dd></div>
          </dl>
        </section>
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="mb-2 text-sm font-medium text-white/70">Reporting status</h3>
          <div className="mb-2"><Pill className={statusClass(reportingStatus)}>{reportingStatus}</Pill></div>
          {reports.length === 0 ? (
            <p className="text-sm text-white/45">No reports.</p>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="mb-2 flex items-center justify-between text-sm">
                <span>{r.period}</span>
                <Pill className={statusClass(r.status)}>{r.status}</Pill>
              </div>
            ))
          )}
        </section>
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="mb-2 text-sm font-medium text-white/70">Document summary</h3>
          <p className="mb-2 text-sm text-white/60">{docs.length} documents on file</p>
          <ul className="space-y-1 text-sm text-white/80">
            {docs.map((d) => (
              <li key={d.name}>
                {d.name} <span className="text-white/40">· {d.kind} · {d.updatedAt}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 lg:col-span-2">
          <h3 className="mb-2 text-sm font-medium text-white/70">Contacts</h3>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {contacts.map((c) => (
              <li key={c.email} className="text-white/80">
                <span className="font-medium text-white">{c.name}</span> · {c.role}
                <div className="text-white/45">{c.email}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function PortfolioDashboardView() {
  const summary = portfolioComplianceSummary();
  return (
    <Panel
      title="Portfolio Dashboard"
      subtitle="Investment, ownership, performance and compliance across the Talanton Impact portfolio."
    >
      <KpiRow
        items={[
          { label: "Companies", value: summary.companyCount, icon: <Building2 className="h-4 w-4 text-white/40" /> },
          { label: "Capital invested", value: formatUsd(summary.totalInvested) },
          { label: "Avg MOIC", value: `${summary.avgMoic}x` },
          { label: "Avg compliance", value: `${summary.avgCompliance}%`, icon: <ShieldCheck className="h-4 w-4 text-white/40" /> },
        ]}
      />
      <TableShell
        headers={[
          "Company",
          "Country",
          "Investment",
          "Ownership %",
          "Annual revenue",
          "Growth %",
          "Burn / mo",
          "Compliance %",
          "Risk",
          "ROI / MOIC",
          "Last quarterly",
        ]}
      >
        {TALANTON_PORTFOLIO_COMPANIES.map((c) => (
          <tr key={c.id} className="hover:bg-white/[0.03]">
            <td className="px-3 py-2.5"><CompanyLink company={c} /></td>
            <td className="px-3 py-2.5">{c.country}</td>
            <td className="px-3 py-2.5 tabular-nums">{formatUsd(c.investmentAmountUsd)}</td>
            <td className="px-3 py-2.5 tabular-nums">{c.ownershipPct}%</td>
            <td className="px-3 py-2.5 tabular-nums">{formatUsd(c.annualRevenueUsd)}</td>
            <td className="px-3 py-2.5 tabular-nums">{c.revenueGrowthPct}%</td>
            <td className="px-3 py-2.5 tabular-nums">{formatUsd(c.burnRateUsdMonthly)}</td>
            <td className="px-3 py-2.5 tabular-nums">{c.compliancePct}%</td>
            <td className="px-3 py-2.5"><Pill className={riskClass(c.riskRating)}>{c.riskRating}</Pill></td>
            <td className="px-3 py-2.5 tabular-nums">{c.roiMoic}x</td>
            <td className="px-3 py-2.5 tabular-nums">{c.lastQuarterlyReportDate}</td>
          </tr>
        ))}
      </TableShell>
    </Panel>
  );
}

function DirectoryView() {
  const searchParams = useSearchParams();
  const initialId =
    searchParams.get("companyId") ?? TALANTON_PORTFOLIO_COMPANIES[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(initialId);
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return TALANTON_PORTFOLIO_COMPANIES;
    return TALANTON_PORTFOLIO_COMPANIES.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        c.country.toLowerCase().includes(needle) ||
        c.sector.toLowerCase().includes(needle),
    );
  }, [q]);

  const selected = companyById(selectedId) ?? rows[0] ?? TALANTON_PORTFOLIO_COMPANIES[0];

  return (
    <Panel
      title="Portfolio Companies Directory"
      subtitle="Select a company to view portal access, training, compliance and reporting."
    >
      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search company, country or sector…"
          className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="max-h-[640px] overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="sticky top-0 border-b border-white/10 bg-[#0b1220]/95 px-3 py-2 text-xs font-medium uppercase tracking-wide text-white/45">
            Portfolio companies
          </div>
          <ul>
            {rows.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition",
                    selected?.id === c.id
                      ? "bg-emerald-500/15 text-white"
                      : "text-white/75 hover:bg-white/[0.04]",
                  )}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="tabular-nums text-xs text-white/50">{c.compliancePct}%</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          {selected ? (
            <CompanyDetailPanel company={selected} />
          ) : (
            <p className="text-sm text-white/50">Select a portfolio company.</p>
          )}
        </section>
      </div>
    </Panel>
  );
}

function CoursesView() {
  const summary = portfolioTrainingDashboardSummary();
  const [selectedId, setSelectedId] = useState(TALANTON_PORTFOLIO_COMPANIES[1]?.id ?? TALANTON_PORTFOLIO_COMPANIES[0]?.id ?? "");
  const selected = companyById(selectedId) ?? TALANTON_PORTFOLIO_COMPANIES[0];
  const detail = selected ? companyTrainingDetail(selected) : null;
  const portal = selected ? getCompanyPortalByCompanyId(selected.id) : null;

  return (
    <Panel title="Portfolio Courses" subtitle="Portfolio company training compliance management.">
      <KpiRow
        items={[
          { label: "Total portfolio companies", value: summary.companyCount },
          { label: "Average completion %", value: `${summary.avgCompletion}%` },
          { label: "Companies above 90%", value: summary.above90 },
          { label: "Companies 70%–90%", value: summary.between70And90 },
          { label: "Companies below 70%", value: summary.below70 },
          { label: "Outstanding training items", value: summary.outstandingItems },
          { label: "Outstanding users", value: summary.outstandingUsers },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="max-h-[560px] overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="sticky top-0 border-b border-white/10 bg-[#0b1220]/95 px-3 py-2 text-xs font-medium uppercase tracking-wide text-white/45">
            Portfolio companies
          </div>
          <ul>
            {TALANTON_PORTFOLIO_COMPANIES.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition",
                    selectedId === c.id ? "bg-emerald-500/15 text-white" : "text-white/75 hover:bg-white/[0.04]",
                  )}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="tabular-nums text-xs text-white/50">{c.compliancePct}%</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          {!selected || !detail ? (
            <p className="text-sm text-white/50">Select a portfolio company.</p>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{selected.name}</h2>
                  <p className="text-sm text-white/50">{selected.city}, {selected.country}</p>
                </div>
                <Pill className={statusClass(detail.status)}>{detail.status}</Pill>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                <div><dt className="text-white/45">Overall completion %</dt><dd className="text-xl font-semibold tabular-nums text-white">{selected.compliancePct}%</dd></div>
                <div><dt className="text-white/45">Compliance status</dt><dd className="text-white">{detail.status}</dd></div>
                <div><dt className="text-white/45">Last training activity</dt><dd className="text-white">{detail.lastTrainingActivity}</dd></div>
                <div><dt className="text-white/45">Assigned courses</dt><dd className="tabular-nums text-white">{detail.assignedCourses}</dd></div>
                <div><dt className="text-white/45">Completed courses</dt><dd className="tabular-nums text-white">{detail.completedCourses}</dd></div>
                <div><dt className="text-white/45">Outstanding courses</dt><dd className="tabular-nums text-white">{detail.outstandingCourses}</dd></div>
                <div><dt className="text-white/45">Assigned users</dt><dd className="tabular-nums text-white">{detail.assignedUsers}</dd></div>
                <div><dt className="text-white/45">Completed users</dt><dd className="tabular-nums text-white">{detail.completedUsers}</dd></div>
                <div><dt className="text-white/45">Outstanding users</dt><dd className="tabular-nums text-white">{detail.outstandingUsers}</dd></div>
                <div className="sm:col-span-2">
                  <dt className="text-white/45">Portal URL</dt>
                  <dd className="break-all text-sky-300">{portal ? companyPortalAbsoluteUrl(portal) : "—"}</dd>
                </div>
                <div>
                  <dt className="text-white/45">Portal login email</dt>
                  <dd className="text-white">{portal?.username ?? "—"}</dd>
                </div>
              </dl>
              <div className="mt-5">
                <h3 className="mb-2 text-sm font-medium text-white/70">Assigned course catalogue</h3>
                <TableShell headers={["Course", "Category", "Duration", "Mandatory", "Companies", "Completion"]}>
                  {TALANTON_COMPLIANCE_COURSES.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.03]">
                      <td className="px-3 py-2.5 font-medium text-white">{c.title}</td>
                      <td className="px-3 py-2.5">{c.category}</td>
                      <td className="px-3 py-2.5 tabular-nums">{c.durationMinutes} min</td>
                      <td className="px-3 py-2.5">{c.mandatory ? "Yes" : "No"}</td>
                      <td className="px-3 py-2.5 tabular-nums">{c.assignedCompanies}</td>
                      <td className="px-3 py-2.5 tabular-nums">{c.completionPct}%</td>
                    </tr>
                  ))}
                </TableShell>
              </div>
            </>
          )}
        </section>
      </div>
    </Panel>
  );
}

function CourseManagementView() {
  const [courses, setCourses] = useState<ManagedCourse[]>(() => listManagedCourses());
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = courses.find((c) => c.id === editingId) ?? null;

  const persist = (next: ManagedCourse[]) => {
    setCourses(next);
    saveManagedCourses(next);
  };

  const upsert = (course: ManagedCourse) => {
    const exists = courses.some((c) => c.id === course.id);
    const next = exists ? courses.map((c) => (c.id === course.id ? course : c)) : [course, ...courses];
    persist(next);
    setEditingId(course.id);
  };

  const remove = (id: string) => {
    persist(courses.filter((c) => c.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const archive = (id: string) => {
    persist(courses.map((c) => (c.id === id ? { ...c, archived: !c.archived } : c)));
  };

  const active = courses.filter((c) => !c.archived);
  const archived = courses.filter((c) => c.archived);
  const avgEnrolment = courses.length
    ? Math.round(courses.reduce((s, c) => s + c.enrolmentCount, 0) / courses.length)
    : 0;
  const avgCompletion = courses.length
    ? Math.round(courses.reduce((s, c) => s + c.completionPct, 0) / courses.length)
    : 0;

  return (
    <Panel title="Course Management" subtitle="Master administration for Talanton training content.">
      <KpiRow
        items={[
          { label: "Active courses", value: active.length },
          { label: "Archived", value: archived.length },
          { label: "Avg enrolment", value: avgEnrolment },
          { label: "Avg completion", value: `${avgCompletion}%` },
        ]}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            const blank = createBlankCourse();
            upsert(blank);
          }}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Create course
        </button>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <TableShell headers={["Course", "Category", "Duration", "Mandatory", "Companies", "Enrolment", "Completion", "Status", "Actions"]}>
          {courses.map((c) => (
            <tr key={c.id} className="hover:bg-white/[0.03]">
              <td className="px-3 py-2.5 font-medium text-white">{c.title}</td>
              <td className="px-3 py-2.5">{c.category}</td>
              <td className="px-3 py-2.5 tabular-nums">{c.durationMinutes} min</td>
              <td className="px-3 py-2.5">{c.mandatory ? "Yes" : "No"}</td>
              <td className="px-3 py-2.5 tabular-nums">{c.assignedCompanyIds.length || c.assignedCompanies}</td>
              <td className="px-3 py-2.5 tabular-nums">{c.enrolmentCount}</td>
              <td className="px-3 py-2.5 tabular-nums">{c.completionPct}%</td>
              <td className="px-3 py-2.5"><Pill className={c.archived ? "bg-white/10 text-white/50" : "bg-emerald-500/15 text-emerald-300"}>{c.archived ? "Archived" : "Active"}</Pill></td>
              <td className="px-3 py-2.5">
                <div className="flex flex-wrap gap-1">
                  <button type="button" className="rounded px-2 py-1 text-xs text-sky-300 hover:bg-white/5" onClick={() => setEditingId(c.id)}>Edit</button>
                  <button type="button" className="rounded px-2 py-1 text-xs text-amber-300 hover:bg-white/5" onClick={() => archive(c.id)}>{c.archived ? "Restore" : "Archive"}</button>
                  <button type="button" className="rounded px-2 py-1 text-xs text-rose-300 hover:bg-white/5" onClick={() => remove(c.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
        <aside className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="text-sm font-medium text-white/70">{editing ? "Edit course" : "Select a course to edit"}</h2>
          {editing ? (
            <form
              className="mt-3 space-y-3 text-sm"
              onSubmit={(e) => {
                e.preventDefault();
                upsert(editing);
              }}
            >
              <label className="block">
                <span className="text-white/45">Title</span>
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
                  value={editing.title}
                  onChange={(e) => upsert({ ...editing, title: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-white/45">Category</span>
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
                  value={editing.category}
                  onChange={(e) => upsert({ ...editing, category: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-white/45">Duration (minutes)</span>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
                  value={editing.durationMinutes}
                  onChange={(e) => upsert({ ...editing, durationMinutes: Number(e.target.value) || 0 })}
                />
              </label>
              <label className="flex items-center gap-2 text-white/80">
                <input
                  type="checkbox"
                  checked={editing.mandatory}
                  onChange={(e) => upsert({ ...editing, mandatory: e.target.checked })}
                />
                Mandatory
              </label>
              <label className="block">
                <span className="text-white/45">Assign to portfolio companies</span>
                <select
                  multiple
                  className="mt-1 h-36 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-white"
                  value={editing.assignedCompanyIds}
                  onChange={(e) => {
                    const ids = Array.from(e.target.selectedOptions).map((o) => o.value);
                    upsert({
                      ...editing,
                      assignedCompanyIds: ids,
                      assignedCompanies: ids.length || editing.assignedCompanies,
                    });
                  }}
                >
                  {TALANTON_PORTFOLIO_COMPANIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-white/45">Assign to users (comma-separated emails)</span>
                <textarea
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
                  rows={2}
                  value={editing.assignedUserLabels.join(", ")}
                  onChange={(e) =>
                    upsert({
                      ...editing,
                      assignedUserLabels: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                />
              </label>
              <label className="block">
                <span className="text-white/45">Upload course materials (filenames)</span>
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
                  placeholder="policy.pdf, slides.pptx"
                  value={editing.materials.join(", ")}
                  onChange={(e) =>
                    upsert({
                      ...editing,
                      materials: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                />
              </label>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-white/60">
                <div>Enrolment statistics: <span className="text-white">{editing.enrolmentCount}</span></div>
                <div>Completion statistics: <span className="text-white">{editing.completionPct}%</span></div>
                <div>Assigned users: <span className="text-white">{editing.assignedUserLabels.length}</span></div>
                <div>Materials: <span className="text-white">{editing.materials.length || "none"}</span></div>
              </div>
            </form>
          ) : (
            <p className="mt-3 text-sm text-white/45">Choose Edit on a course, or create a new one.</p>
          )}
        </aside>
      </div>
    </Panel>
  );
}

function MyTrainingView() {
  return (
    <Panel title="My Training" subtitle="Learner assignments across portfolio companies.">
      <TableShell headers={["Learner", "Course", "Company", "Status", "Progress", "Due"]}>
        {TALANTON_MY_TRAINING.map((row) => (
          <tr key={row.id} className="hover:bg-white/[0.03]">
            <td className="px-3 py-2.5 font-medium text-white">{row.learnerName}</td>
            <td className="px-3 py-2.5">{courseTitleById(row.courseId)}</td>
            <td className="px-3 py-2.5">{companyNameById(row.companyId)}</td>
            <td className="px-3 py-2.5"><Pill className={statusClass(row.status)}>{row.status}</Pill></td>
            <td className="px-3 py-2.5 tabular-nums">{row.progress}%</td>
            <td className="px-3 py-2.5 tabular-nums">{row.dueDate}</td>
          </tr>
        ))}
      </TableShell>
    </Panel>
  );
}

function ComplianceDashboardView() {
  const summary = portfolioComplianceSummary();
  const weak = [...TALANTON_PORTFOLIO_COMPANIES].sort((a, b) => a.compliancePct - b.compliancePct).slice(0, 5);
  return (
    <Panel title="Compliance Dashboard" subtitle="Portfolio-wide compliance health.">
      <KpiRow
        items={[
          { label: "Companies", value: summary.companyCount },
          { label: "Avg compliance", value: `${summary.avgCompliance}%` },
          { label: "Outstanding training", value: summary.outstanding },
          { label: "High / critical risk", value: summary.highRisk },
        ]}
      />
      <TableShell headers={["Company", "Country", "Compliance", "Outstanding", "Risk"]}>
        {weak.map((c) => (
          <tr key={c.id} className="hover:bg-white/[0.03]">
            <td className="px-3 py-2.5"><CompanyLink company={c} /></td>
            <td className="px-3 py-2.5">{c.country}</td>
            <td className="px-3 py-2.5 tabular-nums">{c.compliancePct}%</td>
            <td className="px-3 py-2.5 tabular-nums">{c.outstandingTraining}</td>
            <td className="px-3 py-2.5"><Pill className={riskClass(c.riskRating)}>{c.riskRating}</Pill></td>
          </tr>
        ))}
      </TableShell>
    </Panel>
  );
}

function PoliciesView() {
  return (
    <Panel title="Policies" subtitle="Governance policy library.">
      <TableShell headers={["Policy", "Owner", "Version", "Status", "Last reviewed", "Next review"]}>
        {TALANTON_POLICIES.map((p) => (
          <tr key={p.id} className="hover:bg-white/[0.03]">
            <td className="px-3 py-2.5 font-medium text-white">{p.title}</td>
            <td className="px-3 py-2.5">{p.owner}</td>
            <td className="px-3 py-2.5">{p.version}</td>
            <td className="px-3 py-2.5"><Pill className={statusClass(p.status)}>{p.status}</Pill></td>
            <td className="px-3 py-2.5 tabular-nums">{p.lastReviewed}</td>
            <td className="px-3 py-2.5 tabular-nums">{p.nextReview}</td>
          </tr>
        ))}
      </TableShell>
    </Panel>
  );
}

function RiskRegisterView() {
  return (
    <Panel title="Risk Register" subtitle="Portfolio and thematic risks under monitoring.">
      <TableShell headers={["Risk", "Company", "Category", "Likelihood", "Impact", "Rating", "Owner", "Status", "Due"]}>
        {TALANTON_RISKS.map((r) => (
          <tr key={r.id} className="hover:bg-white/[0.03]">
            <td className="px-3 py-2.5 font-medium text-white">{r.title}</td>
            <td className="px-3 py-2.5">{companyNameById(r.companyId)}</td>
            <td className="px-3 py-2.5">{r.category}</td>
            <td className="px-3 py-2.5">{r.likelihood}</td>
            <td className="px-3 py-2.5">{r.impact}</td>
            <td className="px-3 py-2.5"><Pill className={riskClass(r.rating)}>{r.rating}</Pill></td>
            <td className="px-3 py-2.5">{r.owner}</td>
            <td className="px-3 py-2.5"><Pill className={statusClass(r.status)}>{r.status}</Pill></td>
            <td className="px-3 py-2.5 tabular-nums">{r.dueDate}</td>
          </tr>
        ))}
      </TableShell>
    </Panel>
  );
}

function ActionTrackingView() {
  return (
    <Panel title="Action Tracking" subtitle="Open and completed governance actions.">
      <TableShell headers={["Action", "Company", "Owner", "Priority", "Status", "Due", "Source"]}>
        {TALANTON_ACTIONS.map((a) => (
          <tr key={a.id} className="hover:bg-white/[0.03]">
            <td className="px-3 py-2.5 font-medium text-white">{a.title}</td>
            <td className="px-3 py-2.5">{companyNameById(a.companyId)}</td>
            <td className="px-3 py-2.5">{a.owner}</td>
            <td className="px-3 py-2.5">{a.priority}</td>
            <td className="px-3 py-2.5"><Pill className={statusClass(a.status)}>{a.status}</Pill></td>
            <td className="px-3 py-2.5 tabular-nums">{a.dueDate}</td>
            <td className="px-3 py-2.5">{a.source}</td>
          </tr>
        ))}
      </TableShell>
    </Panel>
  );
}

function AnalyticsPerformanceView() {
  const summary = portfolioComplianceSummary();
  return (
    <Panel title="Portfolio Performance Dashboard" subtitle="Tableau-style performance view across invested capital, MOIC and ownership.">
      <KpiRow items={[
        { label: "Capital invested", value: formatUsd(summary.totalInvested) },
        { label: "Avg MOIC", value: `${summary.avgMoic}x` },
        { label: "Companies", value: summary.companyCount },
        { label: "High risk", value: summary.highRisk },
      ]} />
      <TableShell headers={["Company", "Investment", "Ownership", "MOIC", "Revenue", "Growth"]}>
        {[...TALANTON_PORTFOLIO_COMPANIES].sort((a, b) => b.roiMoic - a.roiMoic).map((c) => (
          <tr key={c.id} className="hover:bg-white/[0.03]">
            <td className="px-3 py-2.5"><CompanyLink company={c} /></td>
            <td className="px-3 py-2.5 tabular-nums">{formatUsd(c.investmentAmountUsd)}</td>
            <td className="px-3 py-2.5 tabular-nums">{c.ownershipPct}%</td>
            <td className="px-3 py-2.5 tabular-nums">{c.roiMoic}x</td>
            <td className="px-3 py-2.5 tabular-nums">{formatUsd(c.annualRevenueUsd)}</td>
            <td className="px-3 py-2.5 tabular-nums">{c.revenueGrowthPct}%</td>
          </tr>
        ))}
      </TableShell>
    </Panel>
  );
}

function AnalyticsRevenueView() {
  return (
    <Panel title="Revenue Trends" subtitle="Annual revenue and growth by portfolio company.">
      <TableShell headers={["Company", "Sector", "Annual revenue", "Growth %", "Burn / mo"]}>
        {[...TALANTON_PORTFOLIO_COMPANIES].sort((a, b) => b.annualRevenueUsd - a.annualRevenueUsd).map((c) => (
          <tr key={c.id} className="hover:bg-white/[0.03]">
            <td className="px-3 py-2.5"><CompanyLink company={c} /></td>
            <td className="px-3 py-2.5">{c.sector}</td>
            <td className="px-3 py-2.5 tabular-nums">{formatUsd(c.annualRevenueUsd)}</td>
            <td className="px-3 py-2.5 tabular-nums">{c.revenueGrowthPct}%</td>
            <td className="px-3 py-2.5 tabular-nums">{formatUsd(c.burnRateUsdMonthly)}</td>
          </tr>
        ))}
      </TableShell>
    </Panel>
  );
}

function AnalyticsGeoView() {
  const byCountry = useMemo(() => {
    const map = new Map<string, { count: number; invested: number; revenue: number }>();
    for (const c of TALANTON_PORTFOLIO_COMPANIES) {
      const row = map.get(c.country) ?? { count: 0, invested: 0, revenue: 0 };
      row.count += 1;
      row.invested += c.investmentAmountUsd;
      row.revenue += c.annualRevenueUsd;
      map.set(c.country, row);
    }
    return [...map.entries()].sort((a, b) => b[1].invested - a[1].invested);
  }, []);

  return (
    <Panel title="Geographic Portfolio View" subtitle="Capital and company count by country.">
      <TableShell headers={["Country", "Companies", "Invested", "Portfolio revenue"]}>
        {byCountry.map(([country, row]) => (
          <tr key={country} className="hover:bg-white/[0.03]">
            <td className="px-3 py-2.5 font-medium text-white">{country}</td>
            <td className="px-3 py-2.5 tabular-nums">{row.count}</td>
            <td className="px-3 py-2.5 tabular-nums">{formatUsd(row.invested)}</td>
            <td className="px-3 py-2.5 tabular-nums">{formatUsd(row.revenue)}</td>
          </tr>
        ))}
      </TableShell>
    </Panel>
  );
}

function QuarterlyReportingView() {
  const overdue = TALANTON_QUARTERLY_REPORTS.filter((r) => r.status === "Overdue").length;
  const submitted = TALANTON_QUARTERLY_REPORTS.filter((r) => r.status === "Submitted").length;
  const avgScore = Math.round(
    TALANTON_QUARTERLY_REPORTS.reduce((s, r) => s + r.score, 0) / TALANTON_QUARTERLY_REPORTS.length,
  );

  return (
    <Panel title="Quarterly Reporting Hub" subtitle="Submission status, overdue reports and portfolio reporting scorecard.">
      <KpiRow
        items={[
          { label: "Submitted", value: submitted, icon: <CheckCircle2 className="h-4 w-4 text-white/40" /> },
          { label: "Overdue", value: overdue, icon: <AlertTriangle className="h-4 w-4 text-white/40" /> },
          { label: "Avg score", value: avgScore },
          { label: "Next due", value: "2026-10-15", icon: <ClipboardList className="h-4 w-4 text-white/40" /> },
        ]}
      />
      <TableShell headers={["Company", "Period", "Status", "Last submitted", "Next due", "Score"]}>
        {TALANTON_QUARTERLY_REPORTS.map((r) => (
          <tr key={r.id} className="hover:bg-white/[0.03]">
            <td className="px-3 py-2.5">{companyNameById(r.companyId)}</td>
            <td className="px-3 py-2.5">{r.period}</td>
            <td className="px-3 py-2.5"><Pill className={statusClass(r.status)}>{r.status}</Pill></td>
            <td className="px-3 py-2.5 tabular-nums">{r.lastSubmitted ?? "—"}</td>
            <td className="px-3 py-2.5 tabular-nums">{r.nextDue}</td>
            <td className="px-3 py-2.5 tabular-nums">{r.score}</td>
          </tr>
        ))}
      </TableShell>
    </Panel>
  );
}

function ReportTrainingView() {
  return (
    <Panel title="Training Completion Report" subtitle="Completion rates across the mandatory compliance catalogue.">
      <KpiRow
        items={[
          { label: "Courses", value: TALANTON_COMPLIANCE_COURSES.length, icon: <BookOpen className="h-4 w-4 text-white/40" /> },
          {
            label: "Avg completion",
            value: `${Math.round(TALANTON_COMPLIANCE_COURSES.reduce((s, c) => s + c.completionPct, 0) / TALANTON_COMPLIANCE_COURSES.length)}%`,
          },
          { label: "Mandatory", value: TALANTON_COMPLIANCE_COURSES.filter((c) => c.mandatory).length },
          { label: "Learner samples", value: TALANTON_MY_TRAINING.length },
        ]}
      />
      <TableShell headers={["Course", "Category", "Duration", "Mandatory", "Companies", "Completion"]}>
        {[...TALANTON_COMPLIANCE_COURSES].sort((a, b) => a.completionPct - b.completionPct).map((c) => (
          <tr key={c.id} className="hover:bg-white/[0.03]">
            <td className="px-3 py-2.5 font-medium text-white">{c.title}</td>
            <td className="px-3 py-2.5">{c.category}</td>
            <td className="px-3 py-2.5 tabular-nums">{c.durationMinutes} min</td>
            <td className="px-3 py-2.5">{c.mandatory ? "Yes" : "No"}</td>
            <td className="px-3 py-2.5 tabular-nums">{c.assignedCompanies}</td>
            <td className="px-3 py-2.5 tabular-nums">{c.completionPct}%</td>
          </tr>
        ))}
      </TableShell>
    </Panel>
  );
}

function AnalyticsRiskView() {
  return (
    <Panel title="Risk Dashboard" subtitle="Risk ratings and open register items across the portfolio.">
      <KpiRow
        items={[
          { label: "Critical / High companies", value: TALANTON_PORTFOLIO_COMPANIES.filter((c) => c.riskRating === "High" || c.riskRating === "Critical").length },
          { label: "Open risks", value: TALANTON_RISKS.filter((r) => r.status !== "Closed").length },
          { label: "Mitigating", value: TALANTON_RISKS.filter((r) => r.status === "Mitigating").length },
          { label: "Open actions", value: TALANTON_ACTIONS.filter((a) => a.status !== "Done").length },
        ]}
      />
      <TableShell headers={["Risk", "Company", "Category", "Rating", "Owner", "Status", "Due"]}>
        {TALANTON_RISKS.map((r) => (
          <tr key={r.id} className="hover:bg-white/[0.03]">
            <td className="px-3 py-2.5 font-medium text-white">{r.title}</td>
            <td className="px-3 py-2.5">{companyNameById(r.companyId)}</td>
            <td className="px-3 py-2.5">{r.category}</td>
            <td className="px-3 py-2.5"><Pill className={riskClass(r.rating)}>{r.rating}</Pill></td>
            <td className="px-3 py-2.5">{r.owner}</td>
            <td className="px-3 py-2.5"><Pill className={statusClass(r.status)}>{r.status}</Pill></td>
            <td className="px-3 py-2.5 tabular-nums">{r.dueDate}</td>
          </tr>
        ))}
      </TableShell>
    </Panel>
  );
}

export default function TalantonPortfolioWorkspace({ view }: Props) {
  switch (view) {
    case "portfolio-companies":
    case "portfolio-dashboard":
      return <PortfolioDashboardView />;
    case "portfolio-directory":
    case "portfolio-company":
    case "portfolio-report-company":
      return <DirectoryView />;
    case "portfolio-courses":
      return (
        <div className="space-y-6">
          <LmsReportingDashboard />
          <CoursesView />
        </div>
      );
    case "portfolio-course-management":
      return <CourseManagementView />;
    case "portfolio-my-training":
      return <MyTrainingView />;
    case "portfolio-compliance-dashboard":
    case "portfolio-analytics-compliance":
    case "portfolio-report-compliance":
      return <ComplianceDashboardView />;
    case "portfolio-policies":
      return <PoliciesView />;
    case "portfolio-risk-register":
      return <RiskRegisterView />;
    case "portfolio-action-tracking":
      return <ActionTrackingView />;
    case "portfolio-analytics-performance":
      return <AnalyticsPerformanceView />;
    case "portfolio-analytics-revenue":
      return <AnalyticsRevenueView />;
    case "portfolio-analytics-risk":
      return <AnalyticsRiskView />;
    case "portfolio-analytics-geo":
      return <AnalyticsGeoView />;
    case "portfolio-analytics-quarterly":
    case "portfolio-quarterly-reporting":
      return <QuarterlyReportingView />;
    case "portfolio-report-training":
      return <ReportTrainingView />;
    default:
      return (
        <Panel title="Talanton Impact" subtitle="Select a portfolio module from the sidebar.">
          <p className="text-sm text-white/50">No view selected.</p>
        </Panel>
      );
  }
}
