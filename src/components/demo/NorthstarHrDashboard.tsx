"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { HrKpiTile, HrSection } from "@/components/testflighthub/hr-ui";
import {
  computeHrDashboardKpis,
  computeWorkforceStatus,
  formatVacationRange,
  listProbationReviewsDue,
  listUpcomingBirthdays,
  type HrAttentionItem,
} from "@/lib/hr-dashboard-data";
import {
  getNorthstarFlightRisks,
  getNorthstarPeopleByDepartment,
  getNorthstarPeopleByLocation,
  listNorthstarAttentionContracts,
} from "@/lib/demo/northstar-hr-data";
import type { HrEmployee } from "@/lib/hr-data";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import { useHrMockStore } from "@/components/testflighthub/useHrMockStore";

const chartTooltipStyle = {
  background: "#0b1524",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  fontSize: 12,
  color: "#fff",
} as const;

const DEPT_COLORS = ["#38bdf8", "#34d399", "#fbbf24", "#a78bfa", "#f472b6", "#fb7185", "#94a3b8"];

function AttentionList({ items, empty }: { items: HrAttentionItem[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-white/45">{empty}</p>;
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{item.name}</p>
            <p className="text-xs text-white/45">{item.detail}</p>
            {item.meta ? <p className="mt-0.5 text-[11px] text-white/35">{item.meta}</p> : null}
          </div>
          {item.when ? (
            <p className="shrink-0 text-xs tabular-nums text-white/50">
              {formatVacationRange(item.when, item.when)}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

type NorthstarHrDashboardProps = {
  employees: HrEmployee[];
};

export default function NorthstarHrDashboard({ employees }: NorthstarHrDashboardProps) {
  const basePath = useInternalOperationsBasePath();
  const store = useHrMockStore();
  const kpis = useMemo(() => computeHrDashboardKpis(employees), [employees, store]);
  const workforce = useMemo(() => computeWorkforceStatus(employees), [employees, store]);
  const probation = useMemo(() => listProbationReviewsDue(employees), [employees]);
  const birthdays = useMemo(() => listUpcomingBirthdays(employees), [employees]);
  const contracts = useMemo(() => listNorthstarAttentionContracts(), []);
  const flightRisks = getNorthstarFlightRisks();
  const byLocation = getNorthstarPeopleByLocation();
  const byDepartment = getNorthstarPeopleByDepartment();

  const workforceChart = [
    { name: "Active", value: workforce.active, fill: "#34d399" },
    { name: "Annual leave", value: workforce.annualLeave, fill: "#38bdf8" },
    { name: "Sick leave", value: workforce.sickLeave, fill: "#fb7185" },
    { name: "Paternity", value: workforce.maternityPaternity, fill: "#a78bfa" },
    { name: "Remote", value: workforce.remote, fill: "#fbbf24" },
    { name: "Training", value: workforce.training, fill: "#22d3ee" },
  ].filter((row) => row.value > 0);

  return (
    <div className="space-y-5">
      <header className="relative overflow-hidden rounded-2xl border border-white/12 bg-[radial-gradient(ellipse_at_top_left,_rgba(20,184,166,0.18),_transparent_55%),linear-gradient(135deg,#0b1826_0%,#0a1420_55%,#070d14_100%)] px-5 py-5 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-300/85">
          Northstar · Human Resources
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          25 people across Manchester, Bristol, and Austin — headcount, leave, and hiring at a glance.
        </p>
      </header>

      <section className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <HrKpiTile label="Total Employees" value={kpis.totalEmployees} hint="Active headcount 25" tone="teal" />
        <HrKpiTile label="Active Employees" value={kpis.activeEmployees} tone="emerald" />
        <HrKpiTile label="Employees On Leave" value={kpis.onLeave} hint="3 on leave today" tone="sky" />
        <HrKpiTile label="New Starters (30 days)" value={kpis.newStarters30} tone="cyan" />
        <HrKpiTile label="Open Vacancies" value={kpis.openVacancies} hint="3 open roles" tone="amber" />
        <HrKpiTile label="Performance Reviews Due" value={kpis.reviewsDue} tone="violet" />
        <HrKpiTile label="Probation Reviews Due" value={kpis.probationReviews} tone="rose" />
        <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-200/80">
            Employee flight risk
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{flightRisks.length}</p>
          <ul className="mt-3 space-y-2">
            {flightRisks.map((risk) => (
              <li key={risk.id} className="text-xs text-white/70">
                <span className="font-medium text-white">{risk.name}</span>
                <span className="text-white/40"> · {risk.role}</span>
                <p className="mt-0.5 text-[11px] leading-snug text-white/45">{risk.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <HrSection title="People by location" subtitle="UK & US offices — 25 total.">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byLocation} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="location" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value) => [`${Number(value ?? 0)} people`, "Headcount"]}
                />
                <Bar dataKey="count" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {byLocation.map((row) => (
              <span
                key={row.location}
                className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1 text-xs text-sky-100"
              >
                {row.location} ({row.region}) · {row.count}
              </span>
            ))}
          </div>
        </HrSection>

        <HrSection title="People by department" subtitle="Headcount distribution.">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byDepartment}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={88}
                  tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 10 }}
                />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {byDepartment.map((row, index) => (
                    <Cell key={row.label} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </HrSection>

        <HrSection title="Workforce status" subtitle="Today — leave, remote, and training.">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={workforceChart}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                >
                  {workforceChart.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {workforceChart.map((row) => (
              <div key={row.name} className="flex items-center justify-between rounded-lg border border-white/10 px-2 py-1.5">
                <span className="text-white/55">{row.name}</span>
                <span className="font-semibold tabular-nums text-white">{row.value}</span>
              </div>
            ))}
          </div>
        </HrSection>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <HrSection title="Contract renewals" subtitle="Fixed-term endings within 60 days.">
          <AttentionList items={contracts} empty="No contract renewals in the next 60 days." />
        </HrSection>
        <HrSection title="Probations due" subtitle="Reviews before probation ends.">
          <AttentionList items={probation} empty="No probation reviews due." />
        </HrSection>
        <HrSection title="Birthdays" subtitle="Next 45 days.">
          <AttentionList items={birthdays} empty="No upcoming birthdays in range." />
        </HrSection>
      </section>

      <p className="text-center text-xs text-white/35">
        <Link href={getInternalNavHref("hr", basePath)} className="text-teal-300/80 hover:text-teal-200">
          View all employees →
        </Link>
      </p>
    </div>
  );
}
