"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CalendarDays, ClipboardList, FileText, Package } from "lucide-react";

import { computeManagementSummary } from "@/lib/central-capabilities/management-store";
import { resolveInternalOperationsBasePath } from "@/lib/internal-operations-data";
import { useOperatorEntitlements } from "@/components/testflighthub/OperatorEntitlementsProvider";
import {
  managementAccessFromEntitlements,
  canAccessManagementWorkspace,
} from "@/lib/central-capabilities/access";
import { workspaceSecondaryButtonClass } from "@/components/workspace-ui";
import { cn } from "@/lib/utils";

import { useManagementStore } from "./useManagementStore";
import { useContentStudioStore } from "./useContentStudioStore";

function viewHref(view: string, query?: Record<string, string>) {
  if (typeof window === "undefined") {
    const params = new URLSearchParams({ view, ...query });
    return `/dashboard?${params.toString()}`;
  }
  const base = resolveInternalOperationsBasePath(window.location.hostname);
  const params = new URLSearchParams({ view, ...query });
  return `${base}?${params.toString()}`;
}

export default function ExecutiveMyWorkspace() {
  const entitlements = useOperatorEntitlements();
  const access = useMemo(
    () =>
      managementAccessFromEntitlements({
        roleView: entitlements.roleView,
        roles: entitlements.roles,
        departments: entitlements.departments,
      }),
    [entitlements.departments, entitlements.roleView, entitlements.roles],
  );
  const { state: managementState } = useManagementStore();
  const { state: contentState } = useContentStudioStore();

  const isCeoExperience =
    entitlements.roles.includes("Admin") ||
    entitlements.roles.includes("Exec") ||
    entitlements.role === "Admin" ||
    entitlements.roleView === "c-suite" ||
    entitlements.roleView === "admin";

  if (!isCeoExperience || !canAccessManagementWorkspace(access)) return null;

  const summary = computeManagementSummary(managementState);
  const upcoming = managementState.meetings[0];
  const ceoPack =
    managementState.functionPacks.find((pack) => pack.ownerRole === "CEO") ??
    managementState.functionPacks[0];
  const contentItems = [
    contentState.savedContent.find((row) => row.templateId === "corp-company"),
    contentState.savedContent.find((row) => row.templateId === "fund-pitch"),
    contentState.savedContent.find((row) => row.templateId === "mgmt-ceo"),
    contentState.savedContent.find((row) => row.functionId === "management"),
  ].filter(Boolean);

  const displayContent = [
    { label: "Company Presentation", view: "content-studio", hint: "Corporate master template" },
    { label: "Pitch Deck", view: "content-studio", hint: "Fundraising · Pitch Deck" },
    { label: "Management Presentation", view: "content-studio", hint: "Management · CEO review" },
    ...contentItems.map((item) => ({
      label: item!.name,
      view: "content-studio",
      hint: `${item!.templateName}`,
    })),
  ].slice(0, 3);

  const recentDecisions = managementState.actions
    .filter((row) => row.kind === "decision")
    .slice(0, 2);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
        My workspace
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#0b1524]/70 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-200/80">
            <Package className="h-4 w-4" />
            My management
          </p>
          {ceoPack ? (
            <div className="mt-3">
              <p className="text-sm font-semibold text-white">{ceoPack.title}</p>
              <p className="mt-1 text-xs text-white/50">
                {ceoPack.reportingPeriod} · {ceoPack.status}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={viewHref("management")} className={workspaceSecondaryButtonClass()}>
                  Open
                </Link>
                <Link
                  href={viewHref("management", { section: "function-packs" })}
                  className={workspaceSecondaryButtonClass()}
                >
                  Edit
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0b1524]/70 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-200/80">
            <FileText className="h-4 w-4" />
            My content
          </p>
          <ul className="mt-3 space-y-2">
            {displayContent.map((item) => (
              <li
                key={item.label}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-white/45">{item.hint}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={viewHref(item.view)} className={workspaceSecondaryButtonClass()}>
                    Open
                  </Link>
                  <Link href={viewHref(item.view)} className={workspaceSecondaryButtonClass()}>
                    Edit
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0b1524]/70 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-200/80">
            <CalendarDays className="h-4 w-4" />
            Upcoming
          </p>
          {upcoming ? (
            <div className="mt-3">
              <p className="text-sm font-semibold text-white">{upcoming.name}</p>
              <p className="mt-1 text-xs text-white/55">{upcoming.schedule}</p>
              <p className="mt-2 text-xs text-white/45">
                Pack status: {upcoming.packsReady}/{upcoming.packsTotal} ready
              </p>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0b1524]/70 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-200/80">
            <ClipboardList className="h-4 w-4" />
            Actions & decisions
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-white/45">Open actions</p>
              <p className="font-semibold text-white">{summary.openActions}</p>
            </div>
            <div>
              <p className="text-xs text-white/45">Overdue</p>
              <p className={cn("font-semibold", summary.overdueActions > 0 ? "text-amber-200" : "text-white")}>
                {summary.overdueActions}
              </p>
            </div>
          </div>
          {recentDecisions.length > 0 ? (
            <ul className="mt-3 space-y-1 text-xs text-white/60">
              {recentDecisions.map((row) => (
                <li key={row.id}>• {row.title}</li>
              ))}
            </ul>
          ) : null}
          <Link
            href={viewHref("management")}
            className={cn(workspaceSecondaryButtonClass(), "mt-3 inline-flex")}
          >
            View
          </Link>
        </div>
      </div>
    </section>
  );
}
