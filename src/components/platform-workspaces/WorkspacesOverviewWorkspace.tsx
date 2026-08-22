"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  Boxes,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Search,
  Settings2,
  Users,
} from "lucide-react";

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import type { WorkspaceAdminRecord, WorkspaceType } from "@/lib/platform-workspaces/types";
import { cn } from "@/lib/utils";
import { WorkspaceDetailPanel } from "@/components/platform-workspaces/WorkspaceDetailPanel";

function statusClass(status: string) {
  switch (status) {
    case "Active":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
    case "Archived":
      return "border-white/15 bg-white/5 text-white/45";
    case "Pending Payment":
      return "border-amber-400/30 bg-amber-500/10 text-amber-100";
    default:
      return "border-sky-400/30 bg-sky-500/10 text-sky-100";
  }
}

function typeClass(type: WorkspaceType) {
  switch (type) {
    case "Internal":
      return "text-violet-200";
    case "Demo":
      return "text-teal-200";
    default:
      return "text-sky-200";
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  return JSON.parse(text) as T;
}

export function WorkspacesOverviewWorkspace() {
  const basePath = useInternalOperationsBasePath();
  const [workspaces, setWorkspaces] = useState<WorkspaceAdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | WorkspaceType>("all");
  const [statusFilter, setStatusFilter] = useState<"Active" | "all">("Active");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<"view" | "edit" | "users" | "modules">("view");

  const loadWorkspaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const response = await fetch(`/api/internal/workspaces?${params.toString()}`);
      if (!response.ok) {
        const payload = await readJson<{ error?: string }>(response).catch(() => ({ error: "" }));
        throw new Error(payload.error || `Failed to load workspaces (${response.status})`);
      }
      const payload = await readJson<{ workspaces: WorkspaceAdminRecord[] }>(response);
      setWorkspaces(payload.workspaces);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspaces.");
    } finally {
      setLoading(false);
    }
  }, [query, typeFilter, statusFilter]);

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  const selected = useMemo(
    () => workspaces.find((workspace) => workspace.workspaceId === selectedId) ?? null,
    [selectedId, workspaces],
  );

  const newWorkspaceHref = getInternalNavHref("workspaces-new", basePath);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-500/15 text-sky-200">
            <Boxes className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Internal Central · Workspaces
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
              Workspace Overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
              Search, review, and administer customer and demo workspaces from Internal Central.
            </p>
          </div>
        </div>
        <Link
          href={newWorkspaceHref}
          className="inline-flex items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-500/25"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New Workspace
        </Link>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, slug, company, or contact email"
              className="w-full rounded-xl border border-white/10 bg-[#0b1524] py-2 pl-10 pr-3 text-sm text-white outline-none focus:border-sky-400/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "Active" | "all")}
            className="rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/50"
          >
            <option value="Active">Active only</option>
            <option value="all">All statuses</option>
          </select>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as "all" | WorkspaceType)}
            className="rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/50"
          >
            <option value="all">All types</option>
            <option value="Customer">Customer</option>
            <option value="Demo">Demo</option>
            <option value="Internal">Internal</option>
          </select>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-white/55">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading workspaces…
          </div>
        ) : workspaces.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-white/50">
            No workspaces match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-[0.14em] text-white/40">
                <tr>
                  <th className="px-4 py-3 font-medium">Workspace</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Users</th>
                  <th className="px-4 py-3 font-medium">Modules</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workspaces.map((workspace) => (
                  <tr
                    key={workspace.workspaceId}
                    className={cn(
                      "border-b border-white/5 transition hover:bg-white/[0.03]",
                      selectedId === workspace.workspaceId && "bg-white/[0.04]",
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{workspace.name}</div>
                      <div className="text-xs text-white/45">{workspace.slug}</div>
                      <a
                        href={workspace.primaryUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-sky-300 hover:text-sky-200"
                      >
                        {workspace.primaryUrl}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className={cn("px-4 py-3 font-medium", typeClass(workspace.type))}>
                      {workspace.type}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
                          statusClass(workspace.status),
                        )}
                      >
                        {workspace.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/70">{workspace.userCount}</td>
                    <td className="px-4 py-3 text-white/70">{workspace.enabledModuleCount}</td>
                    <td className="px-4 py-3 text-white/55">
                      {new Date(workspace.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(workspace.workspaceId);
                            setPanelMode("view");
                          }}
                          className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-white/75 hover:bg-white/5"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(workspace.workspaceId);
                            setPanelMode("edit");
                          }}
                          className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-white/75 hover:bg-white/5"
                        >
                          <span className="inline-flex items-center gap-1">
                            <Pencil className="h-3 w-3" />
                            Edit
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(workspace.workspaceId);
                            setPanelMode("users");
                          }}
                          className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-white/75 hover:bg-white/5"
                        >
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Users
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(workspace.workspaceId);
                            setPanelMode("modules");
                          }}
                          className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-white/75 hover:bg-white/5"
                        >
                          <span className="inline-flex items-center gap-1">
                            <Settings2 className="h-3 w-3" />
                            Modules
                          </span>
                        </button>
                        <a
                          href={workspace.primaryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-sky-400/30 px-2.5 py-1 text-xs text-sky-200 hover:bg-sky-500/10"
                        >
                          Open
                        </a>
                        {workspace.status !== "Archived" ? (
                          <button
                            type="button"
                            onClick={async () => {
                              const response = await fetch(
                                `/api/internal/workspaces/${workspace.workspaceId}`,
                                { method: "DELETE" },
                              );
                              if (response.ok) await loadWorkspaces();
                            }}
                            className="rounded-lg border border-rose-400/30 px-2.5 py-1 text-xs text-rose-200 hover:bg-rose-500/10"
                          >
                            <span className="inline-flex items-center gap-1">
                              <Archive className="h-3 w-3" />
                              Archive
                            </span>
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected ? (
        <WorkspaceDetailPanel
          workspace={selected}
          mode={panelMode}
          onClose={() => setSelectedId(null)}
          onUpdated={async () => {
            await loadWorkspaces();
          }}
        />
      ) : null}
    </div>
  );
}
