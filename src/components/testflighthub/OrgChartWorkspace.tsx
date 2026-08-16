"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Maximize2,
  Minimize2,
  Network,
  Pencil,
  RefreshCw,
  RotateCcw,
  Users,
} from "lucide-react";

import { isBrowserDemoSurface } from "@/lib/demo-enterprise";
import {
  applyNorthstarOrgChartManagers,
  resetNorthstarOrgChartManagers,
  setNorthstarOrgChartManager,
  subscribeNorthstarOrgChart,
} from "@/lib/demo/northstar-org-chart-store";

import type { HrEmployee } from "@/lib/hr-data";
import {
  buildOrgChartForest,
  countReports,
  initialsFromName,
  type OrgChartNode,
} from "@/lib/org-chart-data";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import type { SurveyOperationsBasePath } from "@/lib/survey-operations-mock-data";
import { cn } from "@/lib/utils";
import { useInternalOperationsBasePath } from "./InternalOperationsBasePathContext";
import { HrKpiTile, HrSection, hrPrimaryButtonClass, hrSecondaryButtonClass } from "./hr-ui";

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(response.ok ? "Invalid server response." : text.slice(0, 180));
  }
}

function PersonCard({
  node,
  expanded,
  onToggle,
  basePath,
  editMode,
  managerOptionsFor,
  onManagerChange,
}: {
  node: OrgChartNode;
  expanded: boolean;
  onToggle: () => void;
  basePath: SurveyOperationsBasePath;
  editMode: boolean;
  managerOptionsFor: (employeeId: string) => HrEmployee[];
  onManagerChange: (employeeId: string, managerEmployeeId: string | null) => void;
}) {
  const { employee } = node;
  const managerOptions = managerOptionsFor(employee.id);
  const reports = countReports(node);
  const hasChildren = node.children.length > 0;
  const href = getInternalNavHref("hr", basePath, { employeeId: employee.id });

  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "relative w-[220px] rounded-2xl border bg-[#0b1524]/95 p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl",
          editMode ? "border-teal-400/35" : "border-white/15",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-violet-400/30 bg-violet-500/15 text-sm font-semibold text-violet-100">
            {employee.profilePhotoUrl ? (
              <img
                src={employee.profilePhotoUrl}
                alt=""
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              initialsFromName(employee.fullName)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={href}
              className="block truncate text-sm font-semibold text-white hover:text-violet-200"
              title={employee.fullName}
            >
              {employee.fullName}
            </Link>
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/55" title={employee.role}>
              {employee.role || "Role not set"}
            </p>
            <p className="mt-1 truncate text-[10px] uppercase tracking-[0.08em] text-white/35">
              {employee.department || "Unassigned"}
            </p>
          </div>
        </div>
        {editMode ? (
          <label className="mt-3 block">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-white/45">
              Reports to
            </span>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1524] px-2 py-1.5 text-xs text-white"
              value={employee.managerEmployeeId ?? ""}
              onChange={(event) =>
                onManagerChange(employee.id, event.target.value ? event.target.value : null)
              }
            >
              <option value="">Top level (no manager)</option>
              {managerOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.fullName} · {option.role}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {hasChildren ? (
          <button
            type="button"
            onClick={onToggle}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[11px] font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.07]"
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {expanded ? "Collapse" : "Expand"} · {node.children.length} direct
            {reports !== node.children.length ? ` · ${reports} total` : ""}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function OrgBranch({
  node,
  expandedIds,
  toggle,
  basePath,
  editMode,
  managerOptionsFor,
  onManagerChange,
}: {
  node: OrgChartNode;
  expandedIds: Set<string>;
  toggle: (id: string) => void;
  basePath: SurveyOperationsBasePath;
  editMode: boolean;
  managerOptionsFor: (employeeId: string) => HrEmployee[];
  onManagerChange: (employeeId: string, managerEmployeeId: string | null) => void;
}) {
  const expanded = expandedIds.has(node.id);
  const showChildren = expanded && node.children.length > 0;

  return (
    <li className="relative flex flex-col items-center px-3 pt-6">
      <PersonCard
        node={node}
        expanded={expanded}
        onToggle={() => toggle(node.id)}
        basePath={basePath}
        editMode={editMode}
        managerOptionsFor={managerOptionsFor}
        onManagerChange={onManagerChange}
      />
      {showChildren ? (
        <>
          <div className="h-6 w-px bg-white/20" aria-hidden />
          <ul
            className={cn(
              "relative flex flex-row flex-wrap justify-center gap-x-2 gap-y-0",
              "before:absolute before:left-[12.5%] before:right-[12.5%] before:top-0 before:h-px before:bg-white/20",
            )}
          >
            {node.children.map((child) => (
              <li key={child.id} className="relative flex flex-col items-center">
                <div className="h-6 w-px bg-white/20" aria-hidden />
                <ul className="list-none p-0">
                  <OrgBranch
                    node={child}
                    expandedIds={expandedIds}
                    toggle={toggle}
                    basePath={basePath}
                    editMode={editMode}
                    managerOptionsFor={managerOptionsFor}
                    onManagerChange={onManagerChange}
                  />
                </ul>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </li>
  );
}

function collectExpandableIds(nodes: OrgChartNode[], depth = 0, maxDepth = 1): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    if (node.children.length > 0 && depth < maxDepth) {
      ids.push(node.id);
      ids.push(...collectExpandableIds(node.children, depth + 1, maxDepth));
    }
  }
  return ids;
}

function collectAllWithChildren(nodes: OrgChartNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    if (node.children.length > 0) {
      ids.push(node.id);
      ids.push(...collectAllWithChildren(node.children));
    }
  }
  return ids;
}

export default function OrgChartWorkspace() {
  const basePath = useInternalOperationsBasePath();
  const [employees, setEmployees] = useState<HrEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [orgChartRevision, setOrgChartRevision] = useState(0);
  const [isNorthstarDemo, setIsNorthstarDemo] = useState(false);

  useEffect(() => {
    setIsNorthstarDemo(isBrowserDemoSurface());
  }, []);

  useEffect(() => {
    if (!isNorthstarDemo) return;
    return subscribeNorthstarOrgChart(() => setOrgChartRevision((value) => value + 1));
  }, [isNorthstarDemo]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/hr/employees", { cache: "no-store" });
      const data = await readApiJson<{ employees?: HrEmployee[]; error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to load employees");
      setEmployees(data.employees ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load employees");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  const chartEmployees = useMemo(() => {
    if (!isNorthstarDemo) return employees;
    return applyNorthstarOrgChartManagers(employees);
  }, [employees, isNorthstarDemo, orgChartRevision]);

  const forest = useMemo(() => buildOrgChartForest(chartEmployees), [chartEmployees]);

  const managerOptionsFor = useCallback(
    (employeeId: string) =>
      chartEmployees
        .filter((row) => row.id !== employeeId)
        .sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [chartEmployees],
  );

  const handleManagerChange = useCallback(
    (employeeId: string, managerEmployeeId: string | null) => {
      setNorthstarOrgChartManager(employeeId, managerEmployeeId);
    },
    [],
  );

  useEffect(() => {
    if (initialized || loading) return;
    setExpandedIds(new Set(collectExpandableIds(forest.roots, 0, 1)));
    setInitialized(true);
  }, [forest.roots, initialized, loading]);

  const toggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = () => setExpandedIds(new Set(collectAllWithChildren(forest.roots)));
  const collapseAll = () => setExpandedIds(new Set(collectExpandableIds(forest.roots, 0, 0)));

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-10 text-sm text-white/50">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading live org chart…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <HrKpiTile label="Active headcount" value={forest.activeCount} hint="From HR employees" />
        <HrKpiTile label="Top-level leaders" value={forest.roots.length} hint="No manager assigned" />
        <HrKpiTile
          label="Reporting lines"
          value={Math.max(0, forest.activeCount - forest.roots.length)}
          hint="Resolved from manager links"
        />
      </div>

      <HrSection
        title="Organisation chart"
        subtitle={
          isNorthstarDemo
            ? "Paul Fotheringham leads at the top. Turn on Edit to change reporting lines — saved in this browser."
            : "Live view of reporting lines from the HR employee directory. Changes to managers update here automatically."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {isNorthstarDemo ? (
              <>
                <button
                  type="button"
                  className={editMode ? hrPrimaryButtonClass() : hrSecondaryButtonClass()}
                  onClick={() => setEditMode((value) => !value)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {editMode ? "Done editing" : "Edit chart"}
                </button>
                <button
                  type="button"
                  className={hrSecondaryButtonClass()}
                  onClick={() => {
                    resetNorthstarOrgChartManagers();
                    setEditMode(false);
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset lines
                </button>
              </>
            ) : null}
            <button type="button" className={hrSecondaryButtonClass()} onClick={() => void load()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button type="button" className={hrSecondaryButtonClass()} onClick={expandAll}>
              <Maximize2 className="h-3.5 w-3.5" />
              Expand all
            </button>
            <button type="button" className={hrSecondaryButtonClass()} onClick={collapseAll}>
              <Minimize2 className="h-3.5 w-3.5" />
              Collapse
            </button>
            <Link href={getInternalNavHref("hr", basePath)} className={hrSecondaryButtonClass()}>
              <Users className="h-3.5 w-3.5" />
              Employees
            </Link>
          </div>
        }
      >
        {forest.roots.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Network className="h-8 w-8 text-white/30" />
            <p className="text-sm text-white/50">No active employees to chart yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <ul className="flex min-w-full list-none flex-row flex-wrap justify-center gap-6 p-0">
              {forest.roots.map((root) => (
                <OrgBranch
                  key={root.id}
                  node={root}
                  expandedIds={expandedIds}
                  toggle={toggle}
                  basePath={basePath}
                  editMode={isNorthstarDemo && editMode}
                  managerOptionsFor={managerOptionsFor}
                  onManagerChange={handleManagerChange}
                />
              ))}
            </ul>
          </div>
        )}
      </HrSection>
    </div>
  );
}
