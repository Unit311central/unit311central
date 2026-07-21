"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  Plus,
  UserPlus,
} from "lucide-react";

import { getInternalNavHref } from "@/lib/internal-operations-data";
import {
  computeTrainingDashboardKpis,
  createCourse,
  createReport,
} from "@/lib/tqms-mock-store";
import { tqmsStatusClass } from "@/lib/tqms-data";
import { useInternalOperationsBasePath } from "./InternalOperationsBasePathContext";
import { useTqmsMockStore } from "./useTqmsMockStore";
import {
  TqmsEmpty,
  TqmsKpiTile,
  tqmsPrimaryButtonClass,
  TqmsSection,
  tqmsSecondaryButtonClass,
  TqmsStatusPill,
} from "./tqms-ui";

export default function TrainingDashboardWorkspace() {
  const basePath = useInternalOperationsBasePath();
  const store = useTqmsMockStore();
  const kpis = useMemo(() => computeTrainingDashboardKpis(store), [store]);
  const [notice, setNotice] = useState<string | null>(null);

  const overdueMandatory = store.assignments.filter(
    (row) => row.mandatory && row.status === "Overdue",
  );
  const newStarters = store.learners.filter((row) => {
    const start = Date.parse(row.startDate);
    return Date.now() - start < 1000 * 60 * 60 * 24 * 45 && row.status !== "Complete";
  });
  const renewals = store.certificates.filter((cert) => {
    const exp = Date.parse(cert.expiresAt);
    return exp - Date.now() < 1000 * 60 * 60 * 24 * 90;
  });
  const incompletePaths = store.learners.filter(
    (row) => row.status === "In Progress" || row.status === "Overdue",
  );

  const healthCards = [
    {
      title: "Mandatory training overdue",
      count: overdueMandatory.length,
      detail: "Assignments past due date",
    },
    {
      title: "New starters awaiting induction",
      count: newStarters.length,
      detail: "Joined within 45 days",
    },
    {
      title: "Courses requiring renewal",
      count: store.courses.filter((c) => c.mandatory).length,
      detail: "Mandatory catalogue items",
    },
    {
      title: "Expiring certifications",
      count: renewals.length,
      detail: "Within 90 days",
    },
    {
      title: "Incomplete learning paths",
      count: incompletePaths.length,
      detail: "Employees still in progress",
    },
  ];

  const quickActions = [
    {
      label: "Assign Training",
      href: getInternalNavHref("training", basePath),
      icon: UserPlus,
    },
    {
      label: "Create Course",
      href: getInternalNavHref("training", basePath),
      icon: Plus,
      onClick: () => {
        createCourse({
          code: `TRN-${String(store.courses.length + 100).padStart(3, "0")}`,
          title: "New Operations Course",
          category: "Operations",
          mandatory: false,
          durationHours: 2,
          status: "Published",
          owner: "People Ops",
        });
        setNotice("Course created in the catalogue.");
      },
    },
    {
      label: "Schedule Session",
      href: getInternalNavHref("training", basePath),
      icon: CalendarDays,
    },
    {
      label: "Generate Training Report",
      href: getInternalNavHref("qms-reports", basePath),
      icon: FileText,
      onClick: () => {
        createReport({
          name: `Training Compliance — ${new Date().toLocaleDateString("en-GB")}`,
          kind: "Training",
          format: "PDF",
          createdBy: "Operations",
        });
        setNotice("Training report saved to history.");
      },
    },
    {
      label: "Add Certification",
      href: getInternalNavHref("training", basePath),
      icon: Award,
    },
  ];

  return (
    <div className="space-y-5">
      {notice ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TqmsKpiTile label="Total Courses" value={kpis.totalCourses} />
        <TqmsKpiTile label="Employees Assigned" value={kpis.employeesAssigned} />
        <TqmsKpiTile label="Training Completed" value={kpis.completed} />
        <TqmsKpiTile label="Training In Progress" value={kpis.inProgress} />
        <TqmsKpiTile label="Overdue Training" value={kpis.overdue} />
        <TqmsKpiTile label="Certifications Expiring" value={kpis.expiring} />
        <TqmsKpiTile label="Compliance Score" value={`${kpis.complianceScore}%`} />
        <TqmsKpiTile label="Average Completion Rate" value={`${kpis.avgCompletion}%`} />
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <TqmsSection title="Training Health" subtitle="Items that need attention this week.">
          <ul className="space-y-2">
            {healthCards.map((card) => (
              <li
                key={card.title}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-white">{card.title}</p>
                  <p className="text-xs text-white/45">{card.detail}</p>
                </div>
                <p className="text-xl font-semibold tabular-nums text-white">{card.count}</p>
              </li>
            ))}
          </ul>
        </TqmsSection>

        <TqmsSection title="Upcoming Events" subtitle="Sessions, deadlines, and renewals.">
          {store.events.length === 0 ? (
            <TqmsEmpty message="No upcoming training events." />
          ) : (
            <ul className="space-y-2">
              {store.events.map((event) => (
                <li
                  key={event.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{event.title}</p>
                    <p className="text-xs text-white/45">
                      {event.kind} · {event.owner}
                    </p>
                  </div>
                  <TqmsStatusPill className={tqmsStatusClass(event.kind)}>
                    {event.when}
                  </TqmsStatusPill>
                </li>
              ))}
            </ul>
          )}
        </TqmsSection>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <TqmsSection title="Recent Activity" subtitle="Latest learning activity across the organisation.">
          <ul className="space-y-2">
            {store.activity.slice(0, 8).map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
              >
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-white/45">{item.detail}</p>
              </li>
            ))}
          </ul>
        </TqmsSection>

        <TqmsSection
          title="Quick Actions"
          subtitle="Common training operations."
          actions={
            <Link href={getInternalNavHref("qms-training", basePath)} className={tqmsSecondaryButtonClass()}>
              <BookOpen className="h-3.5 w-3.5" />
              QMS Training
            </Link>
          }
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              if (action.onClick) {
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.onClick}
                    className={tqmsPrimaryButtonClass()}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {action.label}
                  </button>
                );
              }
              return (
                <Link key={action.label} href={action.href} className={tqmsPrimaryButtonClass()}>
                  <Icon className="h-3.5 w-3.5" />
                  {action.label}
                </Link>
              );
            })}
            <Link
              href={getInternalNavHref("quality-management", basePath)}
              className={tqmsSecondaryButtonClass()}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Open QMS
            </Link>
          </div>
        </TqmsSection>
      </div>
    </div>
  );
}
