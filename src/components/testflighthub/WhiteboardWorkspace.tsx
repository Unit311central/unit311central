"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";
import { Loader2, PenLine, Plus, Save } from "lucide-react";

import {
  EMPTY_WHITEBOARD_SCENE,
  normalizeWhiteboardScene,
  type WhiteboardProject,
  type WhiteboardProjectSummary,
  type WhiteboardScene,
} from "@/lib/whiteboard-data";
import { cn } from "@/lib/utils";
import ResponsiveMasterDetail, { useMobileDetailPanel } from "@/components/ui/ResponsiveMasterDetail";

import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[480px] items-center justify-center text-sm text-white/50">
        Loading editor…
      </div>
    ),
  },
);

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(response.ok ? "Invalid server response." : text.slice(0, 180));
  }
}

function inputClassName() {
  return "h-10 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 text-sm text-white outline-none transition-colors focus:border-sky-400/50";
}

export default function WhiteboardWorkspace() {
  const [projects, setProjects] = useState<WhiteboardProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [loadedScene, setLoadedScene] = useState<WhiteboardScene>(EMPTY_WHITEBOARD_SCENE);
  const [editorKey, setEditorKey] = useState(0);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingProject, setLoadingProject] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showDetail, openDetail, closeDetail } = useMobileDetailPanel();

  const pendingSceneRef = useRef<WhiteboardScene>(EMPTY_WHITEBOARD_SCENE);
  const skipNextChangeRef = useRef(true);

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    setError(null);

    try {
      const response = await fetch("/api/whiteboard/projects", { cache: "no-store" });
      const data = await readApiJson<{
        projects?: WhiteboardProjectSummary[];
        error?: string;
      }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to load whiteboard projects");
      setProjects(data.projects ?? []);
      return data.projects ?? [];
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load whiteboard projects");
      setProjects([]);
      return [];
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const loadProject = useCallback(async (projectId: string) => {
    setLoadingProject(true);
    setError(null);
    skipNextChangeRef.current = true;

    try {
      const response = await fetch(`/api/whiteboard/projects/${projectId}`, { cache: "no-store" });
      const data = await readApiJson<{ project?: WhiteboardProject; error?: string }>(response);
      if (!response.ok || !data.project) throw new Error(data.error ?? "Failed to load project");

      const project = data.project;
      setSelectedProjectId(project.id);
      setProjectName(project.name);
      setOwnerName(project.ownerName);
      setLoadedScene(project.scene);
      pendingSceneRef.current = project.scene;
      setDirty(false);
      setEditorKey((current) => current + 1);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load project");
    } finally {
      setLoadingProject(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const nextProjects = await loadProjects();
      if (nextProjects[0]) {
        await loadProject(nextProjects[0].id);
      }
    })();
  }, [loadProjects, loadProject]);

  const handleSelectProject = useCallback(
    async (projectId: string) => {
      if (projectId === selectedProjectId) return;
      if (dirty && !window.confirm("Discard unsaved changes on this project?")) return;
      await loadProject(projectId);
      openDetail();
    },
    [dirty, loadProject, openDetail, selectedProjectId],
  );

  const handleNewProject = useCallback(async () => {
    if (dirty && !window.confirm("Discard unsaved changes and start a new project?")) return;

    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/whiteboard/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New project" }),
      });

      const data = await readApiJson<{ project?: WhiteboardProject; error?: string }>(response);
      if (!response.ok || !data.project) throw new Error(data.error ?? "Failed to create project");

      const project = data.project;
      setProjects((current) => [
        {
          id: project.id,
          name: project.name,
          ownerUserId: project.ownerUserId,
          ownerName: project.ownerName,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
        ...current,
      ]);
      setSelectedProjectId(project.id);
      setProjectName(project.name);
      setOwnerName(project.ownerName);
      setLoadedScene(project.scene);
      pendingSceneRef.current = project.scene;
      setDirty(false);
      setEditorKey((current) => current + 1);
      skipNextChangeRef.current = true;
      openDetail();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create project");
    } finally {
      setCreating(false);
    }
  }, [dirty, openDetail]);

  const handleSave = useCallback(async () => {
    if (!selectedProjectId) return;

    setSaving(true);
    setError(null);

    try {
      const scene = pendingSceneRef.current;
      const response = await fetch(`/api/whiteboard/projects/${selectedProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          ownerName,
          elements: scene.elements,
          appState: scene.appState,
          files: scene.files,
        }),
      });

      const data = await readApiJson<{ project?: WhiteboardProject; error?: string }>(response);
      if (!response.ok || !data.project) throw new Error(data.error ?? "Failed to save project");

      const project = data.project;
      setProjectName(project.name);
      setOwnerName(project.ownerName);
      setLoadedScene(project.scene);
      pendingSceneRef.current = project.scene;
      setDirty(false);
      setProjects((current) =>
        current
          .map((item) =>
            item.id === project.id
              ? {
                  id: project.id,
                  name: project.name,
                  ownerUserId: project.ownerUserId,
                  ownerName: project.ownerName,
                  createdAt: project.createdAt,
                  updatedAt: project.updatedAt,
                }
              : item,
          )
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save project");
    } finally {
      setSaving(false);
    }
  }, [ownerName, projectName, selectedProjectId]);

  const handleChange = useCallback(
    (elements: WhiteboardScene["elements"], appState: AppState, files: BinaryFiles) => {
      if (skipNextChangeRef.current) {
        skipNextChangeRef.current = false;
        return;
      }

      pendingSceneRef.current = normalizeWhiteboardScene(elements, appState, files);
      setDirty(true);
    },
    [],
  );

  const hasStoredContent =
    (loadedScene.elements?.length ?? 0) > 0 || Object.keys(loadedScene.files).length > 0;

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <section className="shrink-0 rounded-2xl border border-white/15 bg-white/[0.04] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-[#60a5fa]">
            <PenLine className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Whiteboard</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/50">
              Create and manage named whiteboard projects. Select a project from the list, sketch
              your ideas, then click Save.
            </p>
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      <ResponsiveMasterDetail
        showDetail={showDetail && !!selectedProjectId}
        onBack={closeDetail}
        backLabel="Back to projects"
        columnsClassName="xl:grid-cols-[280px_minmax(0,1fr)]"
        className="min-h-[calc(100dvh-14rem)]"
        master={
        <aside className="flex min-h-0 flex-col rounded-2xl border border-white/15 bg-white/[0.04] shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Projects</h3>
              <p className="text-xs text-white/45">{projects.length} saved</p>
            </div>
            <button
              type="button"
              onClick={() => void handleNewProject()}
              disabled={creating || saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/15 px-2.5 py-1.5 text-xs font-semibold text-sky-300 transition-colors hover:border-sky-400/60 hover:bg-sky-500/25 disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              New
            </button>
          </div>

          {loadingProjects ? (
            <div className="flex items-center gap-2 px-4 py-8 text-sm text-white/55">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading projects…
            </div>
          ) : projects.length === 0 ? (
            <p className="px-4 py-8 text-sm text-white/45">
              No projects yet. Click New to create your first whiteboard.
            </p>
          ) : (
            <ul className="max-h-[420px] flex-1 space-y-1 overflow-y-auto p-2 xl:max-h-none">
              {projects.map((project) => {
                const selected = project.id === selectedProjectId;
                return (
                  <li key={project.id}>
                    <button
                      type="button"
                      onClick={() => void handleSelectProject(project.id)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-3 text-left transition-colors",
                        selected
                          ? "border-sky-400/40 bg-sky-500/10"
                          : "border-transparent bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05]",
                      )}
                    >
                      <p className="truncate text-sm font-semibold text-white">{project.name}</p>
                      <p className="mt-1 truncate text-xs text-white/45">Owner: {project.ownerName}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
        }
        detail={
        <div className="flex min-h-0 min-h-[min(60dvh,640px)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#1e1e1e] shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] xl:min-h-0">
          <div className="flex flex-wrap items-end gap-3 border-b border-white/10 bg-[#121212] px-4 py-3 sm:px-5">
            <div className="min-w-[180px] flex-1">
              <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
                Project name
              </label>
              <input
                value={projectName}
                onChange={(event) => {
                  setProjectName(event.target.value);
                  setDirty(true);
                }}
                disabled={!selectedProjectId}
                className={inputClassName()}
              />
            </div>
            <div className="min-w-[160px]">
              <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
                Owner
              </label>
              <input
                value={ownerName}
                onChange={(event) => {
                  setOwnerName(event.target.value);
                  setDirty(true);
                }}
                disabled={!selectedProjectId}
                placeholder="Project owner"
                className={inputClassName()}
              />
            </div>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!selectedProjectId || saving || loadingProject}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/15 px-4 text-sm font-semibold text-sky-300 transition-colors hover:border-sky-400/60 hover:bg-sky-500/25 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </button>
            {dirty && (
              <span className="pb-2 text-xs text-amber-200/80">Unsaved changes</span>
            )}
          </div>

          <div className="relative min-h-[520px] flex-1">
            {loadingProject || !selectedProjectId ? (
              <div className="flex h-full min-h-[520px] items-center justify-center gap-2 text-sm text-white/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                {selectedProjectId ? "Loading project…" : "Select or create a project"}
              </div>
            ) : (
              <div className="absolute inset-0">
                <Excalidraw
                  key={editorKey}
                  theme="dark"
                  initialData={
                    hasStoredContent
                      ? {
                          elements: loadedScene.elements,
                          appState: loadedScene.appState,
                          files: loadedScene.files,
                        }
                      : { appState: { theme: "dark" } }
                  }
                  onChange={handleChange}
                />
              </div>
            )}
          </div>
        </div>
        }
      />
    </div>
  );
}
