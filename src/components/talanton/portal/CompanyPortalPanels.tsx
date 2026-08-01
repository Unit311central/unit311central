import {
  TALANTON_COMPLIANCE_COURSES,
  TALANTON_MY_TRAINING,
  TALANTON_POLICIES,
  TALANTON_PORTFOLIO_COMPANIES,
  TALANTON_QUARTERLY_REPORTS,
  companyById,
} from "@/lib/talanton/portfolio-data";

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-white/8 text-white/80">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2.5">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CompanyPortalHome({ companyId }: { companyId: string }) {
  const company = companyById(companyId) ?? TALANTON_PORTFOLIO_COMPANIES[0];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{company.name}</h1>
        <p className="mt-1 text-sm text-white/55">
          Complete compliance training, submit quarterly reports, and exchange documents with
          Talanton.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Compliance", `${company.compliancePct}%`],
          ["Outstanding training", String(company.outstandingTraining)],
          ["Last quarterly", company.lastQuarterlyReportDate],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
              {label}
            </p>
            <p className="mt-2 text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompanyPortalTrainingHub() {
  return (
    <Panel title="Training">
      <p className="text-sm text-white/60">
        Use Assigned Courses, My Training, and Course Completion to manage compliance learning.
      </p>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-emerald-200/90">
        <li>Assigned Courses</li>
        <li>My Training</li>
        <li>Course Completion</li>
      </ul>
    </Panel>
  );
}

export function CompanyPortalAssignedCourses() {
  return (
    <Panel title="Assigned Courses">
      <Table
        headers={["Course", "Category", "Duration", "Mandatory", "Completion"]}
        rows={TALANTON_COMPLIANCE_COURSES.map((c) => [
          c.title,
          c.category,
          `${c.durationMinutes} min`,
          c.mandatory ? "Yes" : "No",
          `${c.completionPct}%`,
        ])}
      />
    </Panel>
  );
}

export function CompanyPortalMyTraining({ companyId }: { companyId: string }) {
  const rows = TALANTON_MY_TRAINING.filter((r) => r.companyId === companyId);
  const courseTitle = (id: string) => TALANTON_COMPLIANCE_COURSES.find((c) => c.id === id)?.title ?? id;
  return (
    <Panel title="My Training">
      <Table
        headers={["Learner", "Course", "Status", "Progress", "Due"]}
        rows={(rows.length ? rows : TALANTON_MY_TRAINING.slice(0, 5)).map((r) => [
          r.learnerName,
          courseTitle(r.courseId),
          r.status,
          `${r.progress}%`,
          r.dueDate,
        ])}
      />
    </Panel>
  );
}

export function CompanyPortalCourseCompletion({ companyId }: { companyId: string }) {
  const company = companyById(companyId);
  return (
    <Panel title="Course Completion">
      <p className="mb-4 text-sm text-white/60">
        {company?.name ?? "Company"} compliance completion:{" "}
        <span className="font-semibold text-white">{company?.compliancePct ?? 0}%</span>
      </p>
      <Table
        headers={["Course", "Status"]}
        rows={TALANTON_COMPLIANCE_COURSES.slice(0, 8).map((c, i) => [
          c.title,
          i % 3 === 0 ? "Completed" : i % 3 === 1 ? "In Progress" : "Assigned",
        ])}
      />
    </Panel>
  );
}

export function CompanyPortalReportsHub() {
  return (
    <Panel title="Reports">
      <p className="text-sm text-white/60">
        Submit quarterly packs to Talanton and review previously submitted reports.
      </p>
      <p className="mt-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-sm text-white/45">
        Future reporting workflows will appear here.
      </p>
    </Panel>
  );
}

export function CompanyPortalSubmitReport({ companyId }: { companyId: string }) {
  const company = companyById(companyId);
  return (
    <Panel title="Submit Quarterly Report">
      <p className="text-sm text-white/60">
        Prepare and submit the next quarterly report for {company?.name ?? "your company"}.
      </p>
      <form className="mt-4 space-y-3">
        <label className="block text-xs text-white/45">
          Period
          <input
            defaultValue="Q3 2026"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="block text-xs text-white/45">
          Notes
          <textarea
            rows={4}
            placeholder="Key updates for Talanton…"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
          />
        </label>
        <button
          type="button"
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Submit report (demo)
        </button>
      </form>
    </Panel>
  );
}

export function CompanyPortalSubmittedReports({ companyId }: { companyId: string }) {
  const rows = TALANTON_QUARTERLY_REPORTS.filter((r) => r.companyId === companyId);
  return (
    <Panel title="Submitted Reports">
      <Table
        headers={["Period", "Status", "Last submitted", "Score"]}
        rows={(rows.length ? rows : TALANTON_QUARTERLY_REPORTS.slice(0, 4)).map((r) => [
          r.period,
          r.status,
          r.lastSubmitted ?? "—",
          String(r.score),
        ])}
      />
      <p className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-sm text-white/45">
        Placeholder for future reporting workflows.
      </p>
    </Panel>
  );
}

export function CompanyPortalDocumentsHub() {
  return (
    <Panel title="Documents">
      <p className="text-sm text-white/60">
        Access Talanton policies and templates, and share documents with the investment team.
      </p>
    </Panel>
  );
}

export function CompanyPortalPolicies() {
  return (
    <Panel title="Policies">
      <Table
        headers={["Policy", "Owner", "Version", "Status", "Next review"]}
        rows={TALANTON_POLICIES.map((p) => [
          p.title,
          p.owner,
          p.version,
          p.status,
          p.nextReview,
        ])}
      />
    </Panel>
  );
}

export function CompanyPortalTemplates() {
  return (
    <Panel title="Templates">
      <Table
        headers={["Template", "Type", "Updated"]}
        rows={[
          ["Quarterly Report Pack", "Reporting", "2026-01-10"],
          ["Compliance Certificate", "Compliance", "2026-01-10"],
          ["Board Update Brief", "Governance", "2026-02-01"],
        ]}
      />
    </Panel>
  );
}

export function CompanyPortalSharedDocuments({ companyId }: { companyId: string }) {
  const company = companyById(companyId);
  return (
    <Panel title="Shared Documents">
      <Table
        headers={["Document", "Kind", "Updated"]}
        rows={[
          [`${company?.name ?? "Company"} — Investment Memo`, "Investment", "2026-01-10"],
          ["Q2 2026 Quarterly Pack", "Quarterly Report", "2026-01-10"],
          ["Compliance certificate", "Compliance", "2026-01-10"],
        ]}
      />
      <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-center text-sm text-white/45">
        Upload area — drop files here to share with Talanton (demo UI).
      </div>
    </Panel>
  );
}
