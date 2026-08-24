"use client";

import { useEffect } from "react";

import { ENGINEERING_SOP_CHILD_VIEWS, type EngineeringSopChildView } from "@/lib/engineering-nav";
import { engSopStatusClass } from "@/lib/engineering-sop-data";

import EngineeringSopWorkspace from "./EngineeringSopWorkspace";
import { WsEmpty, WsSection, WsStatusPill } from "./domain-workspace-ui";
import { useEngineeringSopsApi } from "./useEngineeringSopsApi";

type Props = {
  view: string;
};

function resolveView(view: string): EngineeringSopChildView {
  if ((ENGINEERING_SOP_CHILD_VIEWS as readonly string[]).includes(view)) {
    return view as EngineeringSopChildView;
  }
  return "engineering-sops-library";
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default function EngineeringSopRouter({ view }: Props) {
  const resolved = resolveView(view);
  const { dashboard, tasks, runs, templates, report, loading, apiAvailable, refresh } = useEngineeringSopsApi();

  useEffect(() => {
    void refresh();
  }, [refresh, resolved]);

  if (resolved === "engineering-sops-library") {
    return <EngineeringSopWorkspace />;
  }

  if (!apiAvailable && !loading) {
    return (
      <WsSection title="Engineering SOPs">
        <WsEmpty message="Connect Supabase to use the central Engineering SOP workspace. The SOP Library still works in local demo mode." />
      </WsSection>
    );
  }

  if (resolved === "engineering-sops-dashboard") {
    const totals = dashboard?.totals;
    return (
      <div className="space-y-6">
        <WsSection title="SOP Dashboard" subtitle="Workspace-scoped engineering procedure health.">
          {loading && !dashboard ? <p className="text-sm text-white/60">Loading…</p> : null}
          {totals ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Total SOPs" value={totals.sops} />
              <MetricCard label="Approved" value={totals.approved} />
              <MetricCard label="Active runs" value={totals.activeRuns} />
              <MetricCard label="Overdue tasks" value={totals.overdueTasks} />
              <MetricCard label="In review" value={totals.inReview} />
              <MetricCard label="Draft" value={totals.draft} />
              <MetricCard label="Templates" value={totals.templates} />
              <MetricCard label="Reviews overdue" value={totals.overdueReviews} />
            </div>
          ) : (
            <WsEmpty message="Create SOPs in the library or open this workspace again after central starter data loads." />
          )}
        </WsSection>
        {dashboard?.activeRuns?.length ? (
          <WsSection title="Active runs">
            <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
              {dashboard.activeRuns.map((run) => (
                <li key={run.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-white">{run.sopTitle}</p>
                    <p className="text-white/50">
                      {run.sopNumber} · {run.startedBy}
                    </p>
                  </div>
                  <span className="text-white/70">{run.progressPct}%</span>
                </li>
              ))}
            </ul>
          </WsSection>
        ) : null}
      </div>
    );
  }

  if (resolved === "engineering-sops-tasks") {
    return (
      <WsSection title="My Tasks" subtitle="Open step tasks from active SOP runs.">
        {tasks.length ? (
          <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
            {tasks.map((task) => (
              <li key={task.id} className="px-4 py-3 text-sm">
                <p className="font-medium text-white">{task.title}</p>
                <p className="text-white/50">
                  {task.sopTitle} · {task.assignedTo ?? "Unassigned"}
                  {task.dueAt ? ` · due ${task.dueAt.slice(0, 10)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <WsEmpty message="Tasks appear when approved SOPs are run." />
        )}
      </WsSection>
    );
  }

  if (resolved === "engineering-sops-runs") {
    const active = runs.filter((r) => r.status === "in_progress" || r.status === "paused");
    return (
      <WsSection title="Active Runs" subtitle="In-progress and paused procedure executions.">
        {active.length ? (
          <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
            {active.map((run) => (
              <li key={run.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-white">{run.sopTitle}</p>
                  <p className="text-white/50">
                    {run.sopNumber} v{run.version} · {run.startedBy}
                  </p>
                </div>
                <WsStatusPill className="capitalize">{run.status.replace("_", " ")}</WsStatusPill>
              </li>
            ))}
          </ul>
        ) : (
          <WsEmpty message="Run an approved SOP from the library." />
        )}
      </WsSection>
    );
  }

  if (resolved === "engineering-sops-reviews") {
    const reviews = dashboard?.reviewsAwaiting ?? [];
    return (
      <WsSection title="Reviews & Approvals" subtitle="SOPs awaiting approver action.">
        {reviews.length ? (
          <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
            {reviews.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="text-white/50">
                    {item.sopNumber} v{item.version} · {item.ownerName}
                  </p>
                </div>
                <span className={engSopStatusClass(item.status)}>{item.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <WsEmpty message="Submit a draft SOP for review from the library." />
        )}
      </WsSection>
    );
  }

  if (resolved === "engineering-sops-templates") {
    return (
      <WsSection title="SOP Templates" subtitle="Approved templates for new procedures.">
        {templates.length ? (
          <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
            {templates.map((tpl) => (
              <li key={tpl.id} className="px-4 py-3 text-sm">
                <p className="font-medium text-white">{tpl.title}</p>
                <p className="text-white/50">
                  {tpl.number} · {tpl.category ?? "General"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <WsEmpty message="Templates are workspace-scoped approved starter procedures." />
        )}
      </WsSection>
    );
  }

  if (resolved === "engineering-sops-reports") {
    return (
      <WsSection title="SOP Reports" subtitle="Aggregate compliance and execution metrics.">
        {report ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Total SOPs" value={report.totals.sops} />
              <MetricCard label="Runs" value={report.totals.runs} />
              <MetricCard label="Completed runs" value={report.totals.completedRuns} />
              <MetricCard label="Failed runs" value={report.totals.failedRuns} />
            </div>
            {report.byCategory.length ? (
              <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
                {report.byCategory.map((row) => (
                  <li key={row.category} className="flex justify-between px-4 py-2 text-sm text-white/80">
                    <span>{row.category}</span>
                    <span>{row.count}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <WsEmpty message="Reports populate once SOPs and runs exist in this workspace." />
        )}
      </WsSection>
    );
  }

  return <EngineeringSopWorkspace />;
}
