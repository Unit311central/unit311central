"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";

import type { InternalOperationsView } from "@/lib/internal-operations-data";
import {
  companyNameById,
  courseTitleById,
  portfolioComplianceSummary,
  TALANTON_ACTIONS,
  TALANTON_COMPLIANCE_COURSES,
  TALANTON_MY_TRAINING,
  TALANTON_POLICIES,
  TALANTON_PORTFOLIO_COMPANIES,
  TALANTON_RISKS,
  type RiskRating,
} from "@/lib/talanton/portfolio-data";
import { cn } from "@/lib/utils";

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
  if (s.includes("complete") || s === "done" || s === "published" || s === "closed") {
    return "bg-emerald-500/15 text-emerald-300";
  }
  if (s.includes("progress") || s === "mitigating" || s === "in review") {
    return "bg-sky-500/15 text-sky-300";
  }
  if (s.includes("overdue") || s === "critical" || s === "open") {
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
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

function TableShell({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2.5 font-medium">
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

function CompaniesView() {
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

  return (
    <Panel
      title="Portfolio Companies"
      subtitle="Nineteen impact companies across East and West Africa — compliance, training and risk at a glance."
    >
      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search company, country or sector…"
          className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25"
        />
      </div>
      <TableShell
        headers={[
          "Company",
          "Country",
          "Sector",
          "Employees",
          "Compliance",
          "Outstanding training",
          "Risk",
        ]}
      >
        {rows.map((c) => (
          <tr key={c.id} className="hover:bg-white/[0.03]">
            <td className="px-3 py-2.5 font-medium text-white">{c.name}</td>
            <td className="px-3 py-2.5">{c.country}</td>
            <td className="px-3 py-2.5">{c.sector}</td>
            <td className="px-3 py-2.5 tabular-nums">{c.employeeCount.toLocaleString()}</td>
            <td className="px-3 py-2.5 tabular-nums">{c.compliancePct}%</td>
            <td className="px-3 py-2.5 tabular-nums">{c.outstandingTraining}</td>
            <td className="px-3 py-2.5">
              <Pill className={riskClass(c.riskRating)}>{c.riskRating}</Pill>
            </td>
          </tr>
        ))}
      </TableShell>
    </Panel>
  );
}

function CoursesView() {
  return (
    <Panel
      title="Portfolio Courses"
      subtitle="Mandatory compliance catalogue assigned across the Talanton Impact portfolio."
    >
      <TableShell
        headers={[
          "Course",
          "Category",
          "Duration",
          "Mandatory",
          "Companies",
          "Completion",
          "Renewal",
        ]}
      >
        {TALANTON_COMPLIANCE_COURSES.map((c) => (
          <tr key={c.id} className="hover:bg-white/[0.03]">
            <td className="px-3 py-2.5 font-medium text-white">{c.title}</td>
            <td className="px-3 py-2.5">{c.category}</td>
            <td className="px-3 py-2.5 tabular-nums">{c.durationMinutes} min</td>
            <td className="px-3 py-2.5">{c.mandatory ? "Yes" : "No"}</td>
            <td className="px-3 py-2.5 tabular-nums">{c.assignedCompanies}</td>
            <td className="px-3 py-2.5 tabular-nums">{c.completionPct}%</td>
            <td className="px-3 py-2.5">{c.renewEveryMonths} mo</td>
          </tr>
        ))}
      </TableShell>
    </Panel>
  );
}

function MyTrainingView() {
  return (
    <Panel
      title="My Training"
      subtitle="Sample learner assignments across portfolio companies for compliance tracking."
    >
      <TableShell
        headers={["Learner", "Course", "Company", "Status", "Progress", "Due"]}
      >
        {TALANTON_MY_TRAINING.map((row) => (
          <tr key={row.id} className="hover:bg-white/[0.03]">
            <td className="px-3 py-2.5 font-medium text-white">{row.learnerName}</td>
            <td className="px-3 py-2.5">{courseTitleById(row.courseId)}</td>
            <td className="px-3 py-2.5">{companyNameById(row.companyId)}</td>
            <td className="px-3 py-2.5">
              <Pill className={statusClass(row.status)}>{row.status}</Pill>
            </td>
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
  const weak = [...TALANTON_PORTFOLIO_COMPANIES]
    .sort((a, b) => a.compliancePct - b.compliancePct)
    .slice(0, 5);

  return (
    <Panel
      title="Compliance Dashboard"
      subtitle="Portfolio-wide compliance health for Talanton Impact."
    >
      <KpiRow
        items={[
          {
            label: "Companies",
            value: summary.companyCount,
            icon: <Building2 className="h-4 w-4 text-white/40" />,
          },
          {
            label: "Avg compliance",
            value: `${summary.avgCompliance}%`,
            icon: <ShieldCheck className="h-4 w-4 text-white/40" />,
          },
          {
            label: "Outstanding training",
            value: summary.outstanding,
            icon: <BookOpen className="h-4 w-4 text-white/40" />,
          },
          {
            label: "High / critical risk",
            value: summary.highRisk,
            icon: <AlertTriangle className="h-4 w-4 text-white/40" />,
          },
        ]}
      />
      <h2 className="mb-2 text-sm font-medium text-white/70">Lowest compliance companies</h2>
      <TableShell headers={["Company", "Country", "Compliance", "Outstanding", "Risk"]}>
        {weak.map((c) => (
          <tr key={c.id} className="hover:bg-white/[0.03]">
            <td className="px-3 py-2.5 font-medium text-white">{c.name}</td>
            <td className="px-3 py-2.5">{c.country}</td>
            <td className="px-3 py-2.5 tabular-nums">{c.compliancePct}%</td>
            <td className="px-3 py-2.5 tabular-nums">{c.outstandingTraining}</td>
            <td className="px-3 py-2.5">
              <Pill className={riskClass(c.riskRating)}>{c.riskRating}</Pill>
            </td>
          </tr>
        ))}
      </TableShell>
    </Panel>
  );
}

function PoliciesView() {
  return (
    <Panel title="Policies" subtitle="Governance policy library for the Talanton Impact platform.">
      <TableShell headers={["Policy", "Owner", "Version", "Status", "Last reviewed", "Next review"]}>
        {TALANTON_POLICIES.map((p) => (
          <tr key={p.id} className="hover:bg-white/[0.03]">
            <td className="px-3 py-2.5 font-medium text-white">{p.title}</td>
            <td className="px-3 py-2.5">{p.owner}</td>
            <td className="px-3 py-2.5">{p.version}</td>
            <td className="px-3 py-2.5">
              <Pill className={statusClass(p.status)}>{p.status}</Pill>
            </td>
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
    <Panel title="Risk Register" subtitle="Active portfolio and thematic risks under monitoring.">
      <TableShell
        headers={[
          "Risk",
          "Company",
          "Category",
          "Likelihood",
          "Impact",
          "Rating",
          "Owner",
          "Status",
          "Due",
        ]}
      >
        {TALANTON_RISKS.map((r) => (
          <tr key={r.id} className="hover:bg-white/[0.03]">
            <td className="px-3 py-2.5 font-medium text-white">{r.title}</td>
            <td className="px-3 py-2.5">{companyNameById(r.companyId)}</td>
            <td className="px-3 py-2.5">{r.category}</td>
            <td className="px-3 py-2.5">{r.likelihood}</td>
            <td className="px-3 py-2.5">{r.impact}</td>
            <td className="px-3 py-2.5">
              <Pill className={riskClass(r.rating)}>{r.rating}</Pill>
            </td>
            <td className="px-3 py-2.5">{r.owner}</td>
            <td className="px-3 py-2.5">
              <Pill className={statusClass(r.status)}>{r.status}</Pill>
            </td>
            <td className="px-3 py-2.5 tabular-nums">{r.dueDate}</td>
          </tr>
        ))}
      </TableShell>
    </Panel>
  );
}

function ActionTrackingView() {
  return (
    <Panel title="Action Tracking" subtitle="Open and completed compliance / governance actions.">
      <TableShell
        headers={["Action", "Company", "Owner", "Priority", "Status", "Due", "Source"]}
      >
        {TALANTON_ACTIONS.map((a) => (
          <tr key={a.id} className="hover:bg-white/[0.03]">
            <td className="px-3 py-2.5 font-medium text-white">{a.title}</td>
            <td className="px-3 py-2.5">{companyNameById(a.companyId)}</td>
            <td className="px-3 py-2.5">{a.owner}</td>
            <td className="px-3 py-2.5">{a.priority}</td>
            <td className="px-3 py-2.5">
              <Pill className={statusClass(a.status)}>{a.status}</Pill>
            </td>
            <td className="px-3 py-2.5 tabular-nums">{a.dueDate}</td>
            <td className="px-3 py-2.5">{a.source}</td>
          </tr>
        ))}
      </TableShell>
    </Panel>
  );
}

function ReportComplianceView() {
  const summary = portfolioComplianceSummary();
  return (
    <Panel
      title="Portfolio Compliance Report"
      subtitle="Aggregate compliance posture across all portfolio companies."
    >
      <KpiRow
        items={[
          { label: "Portfolio companies", value: summary.companyCount },
          { label: "Average compliance", value: `${summary.avgCompliance}%` },
          { label: "Outstanding modules", value: summary.outstanding },
          { label: "Open actions", value: summary.openActions },
        ]}
      />
      <TableShell headers={["Company", "Compliance %", "Users enrolled", "Courses assigned", "Risk"]}>
        {[...TALANTON_PORTFOLIO_COMPANIES]
          .sort((a, b) => b.compliancePct - a.compliancePct)
          .map((c) => (
            <tr key={c.id} className="hover:bg-white/[0.03]">
              <td className="px-3 py-2.5 font-medium text-white">{c.name}</td>
              <td className="px-3 py-2.5 tabular-nums">{c.compliancePct}%</td>
              <td className="px-3 py-2.5 tabular-nums">{c.usersEnrolled}</td>
              <td className="px-3 py-2.5 tabular-nums">{c.coursesAssigned}</td>
              <td className="px-3 py-2.5">
                <Pill className={riskClass(c.riskRating)}>{c.riskRating}</Pill>
              </td>
            </tr>
          ))}
      </TableShell>
    </Panel>
  );
}

function ReportCompanyView() {
  const [companyId, setCompanyId] = useState(TALANTON_PORTFOLIO_COMPANIES[0]?.id ?? "");
  const company = TALANTON_PORTFOLIO_COMPANIES.find((c) => c.id === companyId);
  const companyRisks = TALANTON_RISKS.filter((r) => r.companyId === companyId);
  const companyActions = TALANTON_ACTIONS.filter((a) => a.companyId === companyId);

  return (
    <Panel
      title="Company Compliance Report"
      subtitle="Drill into a single portfolio company for compliance, risk and actions."
    >
      <div className="mb-4">
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/45">
          Company
        </label>
        <select
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          className="w-full max-w-md rounded-lg border border-white/10 bg-[#0b1220] px-3 py-2 text-sm text-white outline-none focus:border-white/25"
        >
          {TALANTON_PORTFOLIO_COMPANIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {company && (
        <>
          <KpiRow
            items={[
              { label: "Compliance", value: `${company.compliancePct}%` },
              { label: "Employees", value: company.employeeCount },
              { label: "Outstanding training", value: company.outstandingTraining },
              { label: "Risk rating", value: company.riskRating },
            ]}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-white/70">
                <AlertTriangle className="h-4 w-4" /> Risks
              </h2>
              {companyRisks.length === 0 ? (
                <p className="text-sm text-white/45">No company-specific risks on the register.</p>
              ) : (
                <ul className="space-y-2">
                  {companyRisks.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-white">{r.title}</span>
                        <Pill className={riskClass(r.rating)}>{r.rating}</Pill>
                      </div>
                      <p className="mt-1 text-white/50">
                        {r.owner} · due {r.dueDate}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-white/70">
                <ClipboardList className="h-4 w-4" /> Actions
              </h2>
              {companyActions.length === 0 ? (
                <p className="text-sm text-white/45">No open company-specific actions.</p>
              ) : (
                <ul className="space-y-2">
                  {companyActions.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-white">{a.title}</span>
                        <Pill className={statusClass(a.status)}>{a.status}</Pill>
                      </div>
                      <p className="mt-1 text-white/50">
                        {a.owner} · due {a.dueDate}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}

function ReportTrainingView() {
  return (
    <Panel
      title="Training Completion Report"
      subtitle="Completion rates across the mandatory compliance catalogue."
    >
      <KpiRow
        items={[
          {
            label: "Courses",
            value: TALANTON_COMPLIANCE_COURSES.length,
            icon: <BookOpen className="h-4 w-4 text-white/40" />,
          },
          {
            label: "Avg completion",
            value: `${Math.round(
              TALANTON_COMPLIANCE_COURSES.reduce((s, c) => s + c.completionPct, 0) /
                TALANTON_COMPLIANCE_COURSES.length,
            )}%`,
            icon: <CheckCircle2 className="h-4 w-4 text-white/40" />,
          },
          {
            label: "Mandatory courses",
            value: TALANTON_COMPLIANCE_COURSES.filter((c) => c.mandatory).length,
          },
          {
            label: "Learner samples",
            value: TALANTON_MY_TRAINING.length,
          },
        ]}
      />
      <TableShell headers={["Course", "Category", "Completion", "Companies assigned", "Renewal"]}>
        {[...TALANTON_COMPLIANCE_COURSES]
          .sort((a, b) => a.completionPct - b.completionPct)
          .map((c) => (
            <tr key={c.id} className="hover:bg-white/[0.03]">
              <td className="px-3 py-2.5 font-medium text-white">{c.title}</td>
              <td className="px-3 py-2.5">{c.category}</td>
              <td className="px-3 py-2.5 tabular-nums">{c.completionPct}%</td>
              <td className="px-3 py-2.5 tabular-nums">{c.assignedCompanies}</td>
              <td className="px-3 py-2.5">{c.renewEveryMonths} months</td>
            </tr>
          ))}
      </TableShell>
    </Panel>
  );
}

export default function TalantonPortfolioWorkspace({ view }: Props) {
  switch (view) {
    case "portfolio-companies":
      return <CompaniesView />;
    case "portfolio-courses":
      return <CoursesView />;
    case "portfolio-my-training":
      return <MyTrainingView />;
    case "portfolio-compliance-dashboard":
      return <ComplianceDashboardView />;
    case "portfolio-policies":
      return <PoliciesView />;
    case "portfolio-risk-register":
      return <RiskRegisterView />;
    case "portfolio-action-tracking":
      return <ActionTrackingView />;
    case "portfolio-report-compliance":
      return <ReportComplianceView />;
    case "portfolio-report-company":
      return <ReportCompanyView />;
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
