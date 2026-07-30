"use client";

import { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import { useSearchParams } from "next/navigation";

import type { ManagedClient } from "@/lib/client-management-data";
import type { DashboardTileDefinition } from "@/lib/dashboard-view-tiles";
import {
  createBlankProjectInput,
  formatProjectDate,
  projectPhaseClass,
  PROJECT_PHASE_OPTIONS,
  type InternalProject,
  type ProjectPhase,
} from "@/lib/projects-data";
import {
  getPortfolioProject,
  getProjectsForScope,
  isPortfolioProjectId,
  topPortfolioRisk,
  type ProjectPortfolioScope,
} from "@/lib/project-portfolios";
import { isBrowserCorpCentreSurface } from "@/lib/corpcentre-surface";
import { createInitialUsers } from "@/lib/user-management-data";
import { cn } from "@/lib/utils";
import { FolderKanban, Loader2, Plus, Trash2, X } from "lucide-react";

import ProjectDetailWorkspace from "./ProjectDetailWorkspace";
import ProjectsDashboardStrip from "./ProjectsDashboardStrip";
import DashboardTopTilesBar from "@/components/testflighthub/DashboardTopTilesBar";
import {
  DEFAULT_PROJECTS_TILE_LAYOUT,
} from "@/lib/view-dashboard-tile-catalogs";

const operators = createInitialUsers();

function portfolioDeletedStorageKey(scope: ProjectPortfolioScope) {
  return `unit311-portfolio-deleted-projects:${scope}`;
}

function readDeletedPortfolioIds(scope: ProjectPortfolioScope): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(portfolioDeletedStorageKey(scope));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

function writeDeletedPortfolioIds(scope: ProjectPortfolioScope, ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    portfolioDeletedStorageKey(scope),
    JSON.stringify([...new Set(ids)]),
  );
}

function rememberDeletedPortfolioIds(scope: ProjectPortfolioScope, ids: string[]) {
  const next = [...new Set([...readDeletedPortfolioIds(scope), ...ids])];
  writeDeletedPortfolioIds(scope, next);
  return next;
}

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(response.ok ? "Invalid server response." : text.slice(0, 180));
  }
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
      {children}
    </label>
  );
}

function inputClassName() {
  return "mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-sky-400/50";
}

function projectIsAtRisk(project: InternalProject): boolean {
  const portfolio = getPortfolioProject(project.id);
  if (portfolio) {
    const delivery = (portfolio.deliveryStatus ?? "").toLowerCase();
    if (delivery.includes("risk") || delivery === "watch") return true;
    if (portfolio.risks.some((risk) => risk.severity === "high")) return true;
    if (portfolio.milestones.some((milestone) => milestone.status === "at-risk")) return true;
    return false;
  }

  // Live API projects (no demo portfolio record)
  if (project.phase !== "live") return false;
  if (project.notes?.toLowerCase().includes("risk")) return true;
  if (!project.endDate) return project.progressPct < 35;
  const days =
    (new Date(`${project.endDate}T12:00:00`).getTime() - Date.now()) / 86_400_000;
  return days <= 14 && project.progressPct < 70;
}

function sortLatestFirst(projects: InternalProject[]): InternalProject[] {
  return [...projects].sort((a, b) => {
    const aKey = a.updatedAt || a.startDate || a.createdAt;
    const bKey = b.updatedAt || b.startDate || b.createdAt;
    return String(bKey).localeCompare(String(aKey));
  });
}

function buildPortfolioTiles(projects: InternalProject[]): DashboardTileDefinition[] {
  const live = projects.filter((project) => project.phase === "live");
  const upcoming = projects.filter((project) => project.phase === "upcoming");
  const avg =
    live.length === 0
      ? 0
      : Math.round(live.reduce((sum, project) => sum + project.progressPct, 0) / live.length);
  const atRisk = projects.filter(projectIsAtRisk).length;

  return [
    {
      id: "live-projects",
      label: "Live projects",
      value: String(live.length),
      hint: "In delivery",
    },
    {
      id: "upcoming",
      label: "Upcoming",
      value: String(upcoming.length),
      hint: "Mobilising soon",
    },
    {
      id: "avg-progress",
      label: "Avg progress",
      value: `${avg}%`,
      hint: "Live portfolio",
    },
    {
      id: "at-risk",
      label: "At risk",
      value: String(atRisk),
      hint: "Needs attention",
      accent: atRisk > 0 ? "increasing" : "improving",
    },
  ];
}

type ProjectsWorkspaceProps = {
  clients: ManagedClient[];
  /** Separates Internal vs External portfolios from shared field-ops API data. */
  scope?: ProjectPortfolioScope;
};

export default function ProjectsWorkspace({
  clients,
  scope = "all",
}: ProjectsWorkspaceProps) {
  const searchParams = useSearchParams();
  const clientFilterId = searchParams.get("clientId");
  const projectFilterId = searchParams.get("projectId");
  const filteredClient = useMemo(
    () => clients.find((client) => client.id === clientFilterId) ?? null,
    [clients, clientFilterId],
  );
  // CorpCentre Internal Projects use the AU/AUD portfolio fixtures (20 programmes).
  // External / dashboard keep live API projects so client delivery work stays visible.
  const usesPortfolio = scope === "internal" && isBrowserCorpCentreSurface();
  const isPortfolioLayout = scope === "internal" || scope === "external";

  const [projects, setProjects] = useState<InternalProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draft, setDraft] = useState(createBlankProjectInput);

  const liveProjects = useMemo(() => {
    const live = projects.filter((project) => project.phase === "live");
    if (isPortfolioLayout) return sortLatestFirst(live);
    if (!filteredClient) return live;
    return live.filter(
      (project) =>
        project.clientId === filteredClient.id ||
        project.clientName === filteredClient.companyName,
    );
  }, [filteredClient, projects, isPortfolioLayout]);

  const upcomingProjects = useMemo(() => {
    const upcoming = projects.filter((project) => project.phase === "upcoming");
    if (!filteredClient || scope === "internal") return upcoming;
    return upcoming.filter(
      (project) =>
        project.clientId === filteredClient.id ||
        project.clientName === filteredClient.companyName,
    );
  }, [filteredClient, projects, scope]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const allLiveSelected =
    liveProjects.length > 0 && liveProjects.every((project) => selectedIds.includes(project.id));
  const someLiveSelected = liveProjects.some((project) => selectedIds.includes(project.id));

  const portfolioTiles = useMemo(() => buildPortfolioTiles(projects), [projects]);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (usesPortfolio) {
      const deleted = new Set(readDeletedPortfolioIds(scope));
      const next = getProjectsForScope(scope).filter((project) => !deleted.has(project.id));
      setProjects(next);
      setSelectedIds((current) => current.filter((id) => next.some((project) => project.id === id)));
      const live = sortLatestFirst(next.filter((project) => project.phase === "live"));
      setSelectedProjectId((current) => {
        if (current && next.some((project) => project.id === current)) return current;
        return live[0]?.id ?? next[0]?.id ?? null;
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/projects", { cache: "no-store" });
      const data = await readApiJson<{ projects?: InternalProject[]; error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to load projects");
      const all = data.projects ?? [];
      const next =
        scope === "internal"
          ? all.filter((project) => !project.clientId)
          : scope === "external"
            ? all.filter((project) => Boolean(project.clientId))
            : all;
      setProjects(next);
      setSelectedIds((current) => current.filter((id) => next.some((project) => project.id === id)));
      const live = sortLatestFirst(next.filter((project) => project.phase === "live"));
      setSelectedProjectId((current) => {
        if (current && next.some((project) => project.id === current)) return current;
        return live[0]?.id ?? next[0]?.id ?? null;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load projects");
      setProjects([]);
      setSelectedProjectId(null);
    } finally {
      setLoading(false);
    }
  }, [scope, usesPortfolio]);

  useEffect(() => {
    startTransition(() => {
      void loadProjects();
    });
  }, [loadProjects]);

  useEffect(() => {
    if (!projectFilterId || loading) return;
    const match = projects.find((project) => project.id === projectFilterId);
    if (match) {
      startTransition(() => {
        setSelectedProjectId(match.id);
      });
    }
  }, [loading, projectFilterId, projects]);

  function handleClientChange(clientId: string) {
    const client = clients.find((item) => item.id === clientId);
    setDraft((current) => ({
      ...current,
      clientId,
      clientName: client?.companyName ?? "",
      region: client?.region ?? current.region,
    }));
  }

  async function handleCreateProject() {
    if (!draft.name.trim()) {
      setError("Project name is required");
      return;
    }
    if (scope !== "internal" && !draft.clientName.trim()) {
      setError("Project name and client are required");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          clientId: scope === "internal" ? undefined : draft.clientId || undefined,
          clientName:
            scope === "internal"
              ? draft.region.trim() || draft.clientName.trim() || "Internal programme"
              : draft.clientName.trim(),
          site: draft.site.trim() || undefined,
          region: draft.region.trim() || undefined,
          operator: draft.operator.trim() || undefined,
          phase: draft.phase,
          startDate: draft.startDate || null,
          endDate: draft.endDate || null,
          notes: draft.notes.trim() || undefined,
        }),
      });

      const data = await readApiJson<{ project?: InternalProject; error?: string }>(response);
      if (!response.ok || !data.project) throw new Error(data.error ?? "Failed to create project");

      setProjects((current) => [data.project!, ...current]);
      if (data.project.phase === "live") setSelectedProjectId(data.project.id);
      setDraft(createBlankProjectInput());
      setShowForm(false);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create project");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteProject(id: string) {
    if (!window.confirm("Delete this project?")) return;
    await deleteProjectsByIds([id]);
  }

  function toggleProjectSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }

  function toggleSelectAllLive() {
    if (allLiveSelected) {
      const visible = new Set(liveProjects.map((project) => project.id));
      setSelectedIds((current) => current.filter((id) => !visible.has(id)));
      return;
    }
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const project of liveProjects) next.add(project.id);
      return [...next];
    });
  }

  async function deleteProjectsByIds(ids: string[]) {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (uniqueIds.length === 0) return;

    setBusy(true);
    setError(null);

    try {
      const portfolioIds = uniqueIds.filter(
        (id) => usesPortfolio || isPortfolioProjectId(id) || id.startsWith(`${scope}-`),
      );
      const apiIds = uniqueIds.filter((id) => !portfolioIds.includes(id));

      if (portfolioIds.length > 0) {
        if (usesPortfolio) {
          rememberDeletedPortfolioIds(
            scope,
            portfolioIds.filter((id) => isPortfolioProjectId(id)),
          );
        }
        setProjects((current) => current.filter((project) => !portfolioIds.includes(project.id)));
      }

      if (apiIds.length > 0) {
        const response = await fetch("/api/projects/bulk-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: apiIds }),
        });
        const data = await readApiJson<{ deletedIds?: string[]; error?: string }>(response);
        if (!response.ok) throw new Error(data.error ?? "Failed to delete projects");
        const removed = new Set(data.deletedIds ?? apiIds);
        setProjects((current) => current.filter((project) => !removed.has(project.id)));
      }

      const removedSet = new Set(uniqueIds);
      setSelectedIds((current) => current.filter((id) => !removedSet.has(id)));
      setSelectedProjectId((current) => {
        if (!current || !removedSet.has(current)) return current;
        const remaining = projects.filter((project) => !removedSet.has(project.id));
        const live = sortLatestFirst(remaining.filter((project) => project.phase === "live"));
        return live[0]?.id ?? null;
      });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete projects");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSelectedProjects() {
    if (selectedIds.length === 0 || busy) return;
    const count = selectedIds.length;
    if (
      !window.confirm(
        `Delete ${count} project${count === 1 ? "" : "s"}? This cannot be undone.`,
      )
    ) {
      return;
    }
    await deleteProjectsByIds(selectedIds);
  }

  const handleProjectProgressChange = useCallback((projectId: string, progressPct: number) => {
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? { ...project, progressPct, updatedAt: new Date().toISOString() }
          : project,
      ),
    );
  }, []);

  if (isPortfolioLayout) {
    return (
      <div className="space-y-5">
        <DashboardTopTilesBar
          storageKey={`unit311-projects-portfolio-tiles-${scope}`}
          catalog={portfolioTiles}
          defaultLayout={DEFAULT_PROJECTS_TILE_LAYOUT}
          tiles={portfolioTiles}
          title="Portfolio summary"
          showCustomizeHint={false}
        />

        <div className="flex flex-wrap items-center justify-end gap-3">
          {selectedIds.length > 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleDeleteSelectedProjects()}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-100 transition-colors hover:bg-rose-500/25 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete ({selectedIds.length})
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setShowForm((open) => !open)}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-300 transition-colors hover:border-sky-400/60 hover:bg-sky-500/25"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "New project"}
          </button>
        </div>

        {error ? (
          <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        {showForm ? (
          <section className="rounded-2xl border border-white/10 bg-[#0a1422]/80 p-4 sm:p-5">
            <h3 className="text-base font-semibold text-white">Add project</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:col-span-1">
                <FieldLabel>Project name</FieldLabel>
                <input
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder={
                    scope === "internal"
                      ? "Internal programme name…"
                      : "Customer delivery programme…"
                  }
                  className={inputClassName()}
                />
              </div>
              {scope === "internal" ? (
                <div>
                  <FieldLabel>Sponsoring department</FieldLabel>
                  <input
                    value={draft.region}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        region: event.target.value,
                        clientName: event.target.value,
                      }))
                    }
                    placeholder="e.g. Human Resources"
                    className={inputClassName()}
                  />
                </div>
              ) : (
                <div>
                  <FieldLabel>Client</FieldLabel>
                  <select
                    value={draft.clientId}
                    onChange={(event) => handleClientChange(event.target.value)}
                    className={inputClassName()}
                  >
                    <option value="">Select client…</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <FieldLabel>Phase</FieldLabel>
                <select
                  value={draft.phase}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      phase: event.target.value as ProjectPhase,
                    }))
                  }
                  className={inputClassName()}
                >
                  {PROJECT_PHASE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Project manager</FieldLabel>
                <select
                  value={draft.operator}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, operator: event.target.value }))
                  }
                  className={inputClassName()}
                >
                  <option value="">Unassigned</option>
                  {operators.map((operator) => (
                    <option key={operator.id} value={operator.fullName}>
                      {operator.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Start date</FieldLabel>
                <input
                  type="date"
                  value={draft.startDate}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, startDate: event.target.value }))
                  }
                  className={inputClassName()}
                />
              </div>
              <div>
                <FieldLabel>End date</FieldLabel>
                <input
                  type="date"
                  value={draft.endDate}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, endDate: event.target.value }))
                  }
                  className={inputClassName()}
                />
              </div>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleCreateProject()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-400 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Create project
            </button>
          </section>
        ) : null}

        {loading ? (
          <div className="flex min-h-[20rem] items-center justify-center text-white/50">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-white/15 bg-white/[0.04] p-3 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-4">
              <div className="mb-3 flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-emerald-300" />
                  <h3 className="text-sm font-semibold text-white">Live projects</h3>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                    projectPhaseClass("live"),
                  )}
                >
                  {liveProjects.length}
                </span>
              </div>

              {liveProjects.length > 0 ? (
                <label className="mb-2 inline-flex items-center gap-2 px-1 text-xs text-white/55">
                  <input
                    type="checkbox"
                    checked={allLiveSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someLiveSelected && !allLiveSelected;
                    }}
                    onChange={toggleSelectAllLive}
                  />
                  {allLiveSelected ? "Clear selection" : "Select all"}
                  {selectedIds.length > 0 ? (
                    <span className="text-white/35">· {selectedIds.length} selected</span>
                  ) : null}
                </label>
              ) : null}

              <div className="max-h-[min(70vh,46rem)] space-y-1.5 overflow-y-auto pr-1">
                {liveProjects.length === 0 ? (
                  <p className="px-2 py-6 text-center text-sm text-white/45">No live projects.</p>
                ) : (
                  liveProjects.map((project) => {
                    const portfolio = getPortfolioProject(project.id);
                    const active = project.id === selectedProjectId;
                    const checked = selectedIds.includes(project.id);
                    const risk = portfolio ? topPortfolioRisk(portfolio) : null;
                    const subtitle =
                      scope === "internal"
                        ? portfolio?.department ?? project.clientName
                        : project.clientName;

                    return (
                      <div
                        key={project.id}
                        className={cn(
                          "flex w-full items-start gap-2 rounded-xl border px-3 py-3 transition-colors",
                          active
                            ? "border-sky-400/40 bg-sky-500/15 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.18)]"
                            : checked
                              ? "border-rose-400/25 bg-rose-500/5"
                              : "border-transparent bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.05]",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={checked}
                          onChange={() => toggleProjectSelected(project.id)}
                          onClick={(event) => event.stopPropagation()}
                          aria-label={`Select ${project.name}`}
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedProjectId(project.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                "text-sm font-semibold leading-snug",
                                active ? "text-white" : "text-white/90",
                              )}
                            >
                              {project.name}
                            </p>
                            <span className="shrink-0 font-mono text-[11px] text-white/55">
                              {project.progressPct.toFixed(0)}%
                            </span>
                          </div>
                          <p className="mt-1 truncate text-[11px] text-white/45">{subtitle}</p>
                          <p className="mt-1 text-[11px] text-white/40">
                            PM {portfolio?.projectManager ?? project.operator ?? "Unassigned"}
                            {risk?.severity === "high" ? " · At risk" : ""}
                          </p>
                          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
                              style={{ width: `${Math.min(100, project.progressPct)}%` }}
                            />
                          </div>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            <section className="min-w-0 rounded-2xl border border-white/15 bg-white/[0.03] p-3 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-5">
              {selectedProject ? (
                <ProjectDetailWorkspace
                  key={selectedProject.id}
                  project={selectedProject}
                  clients={clients}
                  embedded
                  onProjectProgressChange={handleProjectProgressChange}
                />
              ) : (
                <div className="flex min-h-[20rem] items-center justify-center text-sm text-white/45">
                  Select a live project to view details.
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    );
  }

  // Field-ops / dashboard path (scope=all)
  return (
    <div className="space-y-6">
      <DashboardTopTilesBar
        storageKey="unit311-projects-dashboard-tiles-all"
        catalog={portfolioTiles}
        defaultLayout={DEFAULT_PROJECTS_TILE_LAYOUT}
        tiles={portfolioTiles}
        title="Project key details"
        showCustomizeHint={false}
      />
      <ProjectsDashboardStrip projects={projects} clients={clients} scope={scope} />

      {filteredClient ? (
        <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
          Showing projects for <span className="font-semibold">{filteredClient.companyName}</span>
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setShowForm((open) => !open)}
          className="inline-flex items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-300 transition-colors hover:border-sky-400/60 hover:bg-sky-500/25"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "New project"}
        </button>
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {showForm ? (
        <section className="rounded-2xl border border-white/10 bg-[#0a1422]/80 p-4 sm:p-5">
          <h3 className="text-base font-semibold text-white">Add project</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <FieldLabel>Project name</FieldLabel>
              <input
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Site survey, inspection…"
                className={inputClassName()}
              />
            </div>
            <div>
              <FieldLabel>Client</FieldLabel>
              <select
                value={draft.clientId}
                onChange={(event) => handleClientChange(event.target.value)}
                className={inputClassName()}
              >
                <option value="">Select client…</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Phase</FieldLabel>
              <select
                value={draft.phase}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    phase: event.target.value as ProjectPhase,
                  }))
                }
                className={inputClassName()}
              >
                {PROJECT_PHASE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Site / location</FieldLabel>
              <input
                value={draft.site}
                onChange={(event) => setDraft((current) => ({ ...current, site: event.target.value }))}
                className={inputClassName()}
              />
            </div>
            <div>
              <FieldLabel>Region</FieldLabel>
              <input
                value={draft.region}
                onChange={(event) => setDraft((current) => ({ ...current, region: event.target.value }))}
                className={inputClassName()}
              />
            </div>
            <div>
              <FieldLabel>Lead operator</FieldLabel>
              <select
                value={draft.operator}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, operator: event.target.value }))
                }
                className={inputClassName()}
              >
                <option value="">Unassigned</option>
                {operators.map((operator) => (
                  <option key={operator.id} value={operator.fullName}>
                    {operator.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Start date</FieldLabel>
              <input
                type="date"
                value={draft.startDate}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, startDate: event.target.value }))
                }
                className={inputClassName()}
              />
            </div>
            <div>
              <FieldLabel>End date</FieldLabel>
              <input
                type="date"
                value={draft.endDate}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, endDate: event.target.value }))
                }
                className={inputClassName()}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <FieldLabel>Notes</FieldLabel>
              <textarea
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                rows={3}
                className={cn(inputClassName(), "resize-y")}
              />
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleCreateProject()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-400 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Create project
          </button>
        </section>
      ) : null}

      {loading ? (
        <div className="flex min-h-[16rem] items-center justify-center text-white/50">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : selectedProject ? (
        <ProjectDetailWorkspace
          project={selectedProject}
          clients={clients}
          onBack={() => setSelectedProjectId(null)}
          onProjectProgressChange={handleProjectProgressChange}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-emerald-300" />
                <h3 className="text-base font-semibold text-white">Live projects</h3>
              </div>
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                  projectPhaseClass("live"),
                )}
              >
                {liveProjects.length}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {liveProjects.length === 0 ? (
                <p className="text-sm text-white/45">No live projects.</p>
              ) : (
                liveProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setSelectedProjectId(project.id)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:border-sky-400/30 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white">{project.name}</h3>
                        <p className="mt-1 text-xs text-white/45">{project.clientName}</p>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDeleteProject(project.id);
                        }}
                        aria-label={`Delete ${project.name}`}
                        className="shrink-0 rounded-lg border border-white/10 p-1.5 text-white/40 transition-colors hover:border-rose-400/30 hover:text-rose-300 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-white/50">
                      Start {formatProjectDate(project.startDate)}
                      {project.endDate ? ` · End ${formatProjectDate(project.endDate)}` : ""}
                    </p>
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-white/45">
                        <span>Progress</span>
                        <span className="font-mono text-white/70">{project.progressPct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
                          style={{ width: `${Math.min(100, project.progressPct)}%` }}
                        />
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-sky-300" />
                <h3 className="text-base font-semibold text-white">Upcoming projects</h3>
              </div>
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                  projectPhaseClass("upcoming"),
                )}
              >
                {upcomingProjects.length}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {upcomingProjects.length === 0 ? (
                <p className="text-sm text-white/45">No upcoming projects.</p>
              ) : (
                upcomingProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setSelectedProjectId(project.id)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:border-sky-400/30 hover:bg-white/[0.05]"
                  >
                    <h3 className="font-semibold text-white">{project.name}</h3>
                    <p className="mt-1 text-xs text-white/45">{project.clientName}</p>
                    <p className="mt-2 text-xs text-white/50">
                      Start {formatProjectDate(project.startDate)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
