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
  companyById,
  companyContacts,
  companyDocuments,
  companyNameById,
  courseTitleById,
  formatUsd,
  portfolioComplianceSummary,
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
  const href = getInternalNavHref("portfolio-company", basePath, {
    companyId: company.id,
  });
  return (
    <a href={href} className="font-medium text-sky-300 hover:text-sky-200 hover:underline">
      {company.name}
    </a>
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
      title="Portfolio Companies Directory"
      subtitle="Nineteen impact companies — open a company for the full investment profile."
    >
      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search company, country or sector…"
          className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25"
        />
      </div>
      <TableShell headers={["Company", "Country", "Sector", "Investment", "Ownership", "Compliance", "Risk"]}>
        {rows.map((c) => (
          <tr key={c.id} className="hover:bg-white/[0.03]">
            <td className="px-3 py-2.5"><CompanyLink company={c} /></td>
            <td className="px-3 py-2.5">{c.country}</td>
            <td className="px-3 py-2.5">{c.sector}</td>
            <td className="px-3 py-2.5 tabular-nums">{formatUsd(c.investmentAmountUsd)}</td>
            <td className="px-3 py-2.5 tabular-nums">{c.ownershipPct}%</td>
            <td className="px-3 py-2.5 tabular-nums">{c.compliancePct}%</td>
            <td className="px-3 py-2.5"><Pill className={riskClass(c.riskRating)}>{c.riskRating}</Pill></td>
          </tr>
        ))}
      </TableShell>
    </Panel>
  );
}

function CompanyProfileView() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get("companyId") ?? TALANTON_PORTFOLIO_COMPANIES[0]?.id ?? "";
  const company = companyById(companyId) ?? TALANTON_PORTFOLIO_COMPANIES[0];
  if (!company) {
    return <Panel title="Company Profile" subtitle="No portfolio company selected."><p className="text-sm text-white/50">Select a company from the directory.</p></Panel>;
  }
  const contacts = companyContacts(company);
  const docs = companyDocuments(company);
  const risks = TALANTON_RISKS.filter((r) => r.companyId === company.id);
  const actions = TALANTON_ACTIONS.filter((a) => a.companyId === company.id);
  const training = TALANTON_MY_TRAINING.filter((t) => t.companyId === company.id);
  const reports = TALANTON_QUARTERLY_REPORTS.filter((r) => r.companyId === company.id);

  return (
    <Panel title={company.name} subtitle={`${company.sector} · ${company.city}, ${company.country}`}>
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
          <h2 className="text-sm font-medium text-white/70">Overview</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/80">{company.overview}</p>
        </section>
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="text-sm font-medium text-white/70">Financial summary</h2>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div><dt className="text-white/45">Growth</dt><dd className="tabular-nums text-white">{company.revenueGrowthPct}%</dd></div>
            <div><dt className="text-white/45">Burn / mo</dt><dd className="tabular-nums text-white">{formatUsd(company.burnRateUsdMonthly)}</dd></div>
            <div><dt className="text-white/45">ROI / MOIC</dt><dd className="tabular-nums text-white">{company.roiMoic}x</dd></div>
            <div><dt className="text-white/45">Risk</dt><dd><Pill className={riskClass(company.riskRating)}>{company.riskRating}</Pill></dd></div>
          </dl>
        </section>
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-2 text-sm font-medium text-white/70">Quarterly reports</h2>
          {reports.length === 0 ? <p className="text-sm text-white/45">No reports.</p> : reports.map((r) => (
            <div key={r.id} className="mb-2 flex items-center justify-between text-sm">
              <span>{r.period}</span>
              <Pill className={statusClass(r.status)}>{r.status}</Pill>
            </div>
          ))}
        </section>
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-2 text-sm font-medium text-white/70">Compliance status</h2>
          <p className="text-sm text-white/80">{company.compliancePct}% complete · {company.outstandingTraining} outstanding modules · {company.usersEnrolled} users enrolled</p>
        </section>
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-2 text-sm font-medium text-white/70">Training completion</h2>
          {training.length === 0 ? <p className="text-sm text-white/45">No sample assignments for this company.</p> : training.map((t) => (
            <div key={t.id} className="mb-2 flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{courseTitleById(t.courseId)}</span>
              <Pill className={statusClass(t.status)}>{t.status}</Pill>
            </div>
          ))}
        </section>
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-2 text-sm font-medium text-white/70">Governance actions</h2>
          {actions.length === 0 && risks.length === 0 ? <p className="text-sm text-white/45">No open actions.</p> : null}
          {actions.map((a) => (
            <div key={a.id} className="mb-2 text-sm text-white/80">{a.title} · <Pill className={statusClass(a.status)}>{a.status}</Pill></div>
          ))}
          {risks.map((r) => (
            <div key={r.id} className="mb-2 text-sm text-white/80">{r.title} · <Pill className={riskClass(r.rating)}>{r.rating}</Pill></div>
          ))}
        </section>
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-2 text-sm font-medium text-white/70">Documents</h2>
          <ul className="space-y-1 text-sm text-white/80">
            {docs.map((d) => (
              <li key={d.name}>{d.name} <span className="text-white/40">· {d.kind} · {d.updatedAt}</span></li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-2 text-sm font-medium text-white/70">Contacts</h2>
          <ul className="space-y-2 text-sm">
            {contacts.map((c) => (
              <li key={c.email} className="text-white/80">
                <span className="font-medium text-white">{c.name}</span> · {c.role}
                <div className="text-white/45">{c.email}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Panel>
  );
}

function CoursesView() {
  return (
    <Panel title="Portfolio Courses" subtitle="Mandatory compliance catalogue assigned across all portfolio companies. No QMS / ISO content.">
      <TableShell headers={["Course", "Category", "Duration", "Mandatory", "Companies", "Completion", "Renewal"]}>
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
      <TableShell headers={["Course", "Category", "Completion", "Companies", "Renewal"]}>
        {[...TALANTON_COMPLIANCE_COURSES].sort((a, b) => a.completionPct - b.completionPct).map((c) => (
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
      return <DirectoryView />;
    case "portfolio-company":
      return <CompanyProfileView />;
    case "portfolio-courses":
      return <CoursesView />;
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
    case "portfolio-report-company":
      return <CompanyProfileView />;
    default:
      return (
        <Panel title="Talanton Impact" subtitle="Select a portfolio module from the sidebar.">
          <p className="text-sm text-white/50">No view selected.</p>
        </Panel>
      );
  }
}
