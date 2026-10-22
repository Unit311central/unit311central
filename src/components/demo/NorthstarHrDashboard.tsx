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

import { DemoDashboardMotionShell } from "@/components/dashboard-framework/motion/DemoDashboardMotionShell";
import { DemoDashboardReveal } from "@/components/dashboard-framework/motion/DemoDashboardReveal";
import { useDemoRechartsMotion } from "@/components/dashboard-framework/motion/demo-dashboard-motion";
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

  const locationBarMotion = useDemoRechartsMotion(0);
  const departmentBarMotion = useDemoRechartsMotion(1);
  const workforcePieMotion = useDemoRechartsMotion(2);

  const kpiTiles = [
    { label: "Total Employees", value: kpis.totalEmployees, hint: "Active headcount 25", tone: "teal" as const },
    { label: "Active Employees", value: kpis.activeEmployees, tone: "emerald" as const },
    { label: "Employees On Leave", value: kpis.onLeave, hint: "3 on leave today", tone: "sky" as const },
    { label: "New Starters (30 days)", value: kpis.newStarters30, tone: "cyan" as const },
    { label: "Open Vacancies", value: kpis.openVacancies, hint: "3 open roles", tone: "amber" as const },
    { label: "Performance Reviews Due", value: kpis.reviewsDue, tone: "violet" as const },
    { label: "Probation Reviews Due", value: kpis.probationReviews, tone: "rose" as const },
    {
      label: "Employee flight risk",
      value: flightRisks.length,
      hint: "Retention watch list",
      tone: "rose" as const,
    },
  ];

  return (
    <DemoDashboardMotionShell moduleId="hr">
    <div className="space-y-5">
      <DemoDashboardReveal index={0}>
      <header className="rounded-2xl border border-white/12 bg-[radial-gradient(ellipse_at_top_left,_rgba(20,184,166,0.14),_transparent_55%),linear-gradient(135deg,#0b1826_0%,#0a1420_100%)] px-4 py-4 sm:px-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-300/85">
          Northstar · Human Resources
        </p>
        <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-white sm:text-2xl">Dashboard</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          25 employees across Manchester, Bristol, and Austin — headcount, leave, and hiring at a glance.
        </p>
      </header>
      </DemoDashboardReveal>

      <DemoDashboardReveal index={1}>
      <section className="grid auto-rows-fr gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {kpiTiles.map((tile, index) => (
          <HrKpiTile
            key={tile.label}
            label={tile.label}
            value={tile.value}
            hint={tile.hint}
            tone={tile.tone}
            staggerIndex={index}
          />
        ))}
      </section>
      </DemoDashboardReveal>

      {flightRisks.length > 0 ? (
        <DemoDashboardReveal index={2}>
        <HrSection title="Flight risk watch list" subtitle="People flagged for retention conversations.">
          <ul className="grid gap-2 sm:grid-cols-2">
            {flightRisks.map((risk) => (
              <li
                key={risk.id}
                className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2.5"
              >
                <p className="text-sm font-medium text-white">{risk.name}</p>
                <p className="text-xs text-white/45">{risk.role}</p>
                <p className="mt-1 text-[11px] leading-snug text-white/55">{risk.detail}</p>
              </li>
            ))}
          </ul>
        </HrSection>
        </DemoDashboardReveal>
      ) : null}

      <DemoDashboardReveal index={3}>
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
                <Bar
                  dataKey="count"
                  fill="#38bdf8"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={locationBarMotion.isAnimationActive}
                  animationDuration={locationBarMotion.animationDuration}
                  animationBegin={locationBarMotion.animationBegin}
                />
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
                <Bar
                  dataKey="count"
                  radius={[0, 6, 6, 0]}
                  isAnimationActive={departmentBarMotion.isAnimationActive}
                  animationDuration={departmentBarMotion.animationDuration}
                  animationBegin={departmentBarMotion.animationBegin}
                >
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
                  isAnimationActive={workforcePieMotion.isAnimationActive}
                  animationDuration={workforcePieMotion.animationDuration}
                  animationBegin={workforcePieMotion.animationBegin}
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
      </DemoDashboardReveal>

      <DemoDashboardReveal index={4}>
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
      </DemoDashboardReveal>

      <p className="text-center text-xs text-white/35">
        <Link href={getInternalNavHref("hr", basePath)} className="text-teal-300/80 hover:text-teal-200">
          View all employees →
        </Link>
      </p>
    </div>
    </DemoDashboardMotionShell>
  );
}
