"use client";

import { useEffect, useMemo, useState } from "react";

import { isBrowserAbhiSurface } from "@/lib/abhi-surface";
import { computeTrainingDashboardKpis } from "@/lib/tqms-mock-store";
import { tqmsStatusClass } from "@/lib/tqms-data";
import { useTqmsMockStore } from "./useTqmsMockStore";
import { TqmsEmpty, TqmsKpiTile, TqmsSection, TqmsStatusPill } from "./tqms-ui";

export default function TrainingDashboardWorkspace() {
  const store = useTqmsMockStore();
  const kpis = useMemo(() => computeTrainingDashboardKpis(store), [store]);
  const [isAbhi, setIsAbhi] = useState(false);

  useEffect(() => {
    setIsAbhi(isBrowserAbhiSurface());
  }, []);

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

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TqmsKpiTile label="Total Courses" value={kpis.totalCourses} />
        <TqmsKpiTile label="Employees Assigned" value={kpis.employeesAssigned} />
        <TqmsKpiTile label="Training Completed" value={kpis.completed} />
        <TqmsKpiTile
          label={isAbhi ? "Not Started" : "Training In Progress"}
          value={isAbhi ? kpis.notStarted : kpis.inProgress}
        />
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

        <TqmsSection
          title={isAbhi ? "External Events" : "Upcoming Training"}
          subtitle="Sessions, deadlines, and renewals."
        >
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
    </div>
  );
}
