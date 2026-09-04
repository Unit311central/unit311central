"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ListTree, Loader2, Network, Pencil, Plus, Trash2 } from "lucide-react";

import ArchitectureViewer from "@/components/architecture/ArchitectureViewer";
import ArchitectureHierarchyViewer from "@/components/architecture/ArchitectureHierarchyViewer";
import {
  type ArchitectureCatalogEntry,
  type ArchitectureDiagramDocument,
  type SystemArchitectureDiagram,
} from "@/lib/architecture-diagram-data";
import {
  ARCHITECTURE_TREE_SLUGS,
  WORKSPACE_ARCHITECTURE_OPTIONS,
  isArchitectureTreeSlug,
  type ArchitectureTaxonomyNode,
} from "@/lib/architecture-taxonomy-types";
import {
  WOLF_IR_UNIT311_CANVAS_LABELS,
  WOLF_IR_UNIT311_CANVAS_SLUGS,
  WOLF_IR_UNIT311_TREE_TABS,
  WOLF_IR_TREE_TITLES,
  isWolfIrCustomDiagramSlug,
} from "@/lib/wolf/wolf-information-repository-architecture-data";
import { cn } from "@/lib/utils";

const API_BASE = "/api/information-repository/architecture-diagrams";

type TopScope = "unit311" | "wolf";

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  return JSON.parse(text) as T;
}

export default function WolfInformationRepositoryArchitectureWorkspace() {
  const [topScope, setTopScope] = useState<TopScope>("unit311");
  const [activeSlug, setActiveSlug] = useState<string>(WOLF_IR_UNIT311_CANVAS_SLUGS[0]);
  const [diagramCatalog, setDiagramCatalog] = useState<ArchitectureCatalogEntry[]>([]);
  const [existingDiagrams, setExistingDiagrams] = useState<
    Array<Pick<SystemArchitectureDiagram, "sectionSlug" | "title" | "updatedAt">>
  >([]);
  const [diagram, setDiagram] = useState<SystemArchitectureDiagram | null>(null);
  const [taxonomy, setTaxonomy] = useState<ArchitectureTaxonomyNode | null>(null);
  const [workspaceFilter, setWorkspaceFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [diagramLoading, setDiagramLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [renamingSlug, setRenamingSlug] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [newDiagramTitle, setNewDiagramTitle] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const activeIsTree = isArchitectureTreeSlug(activeSlug);

  const unit311Tabs = useMemo(() => {
    const canvasTabs = WOLF_IR_UNIT311_CANVAS_SLUGS.map((slug) => ({
      slug,
      title: WOLF_IR_UNIT311_CANVAS_LABELS[slug],
      kind: "canvas" as const,
    }));
    const treeTabs = WOLF_IR_UNIT311_TREE_TABS.map((item) => ({
      slug: item.slug,
      title: item.title,
      kind: "tree" as const,
    }));
    return [...canvasTabs, ...treeTabs];
  }, []);

  const wolfTabs = useMemo(() => {
    return existingDiagrams
      .slice()
      .sort((a, b) => {
        const catalogA = diagramCatalog.find((entry) => entry.sectionSlug === a.sectionSlug);
        const catalogB = diagramCatalog.find((entry) => entry.sectionSlug === b.sectionSlug);
        const orderA = catalogA?.navOrder ?? 9999;
        const orderB = catalogB?.navOrder ?? 9999;
        if (orderA !== orderB) return orderA - orderB;
        return a.title.localeCompare(b.title);
      })
      .map((item) => ({
        slug: item.sectionSlug,
        title: item.title,
        isCustom: isWolfIrCustomDiagramSlug(item.sectionSlug),
      }));
  }, [diagramCatalog, existingDiagrams]);

  const loadDiagramIndex = useCallback(async (scope: TopScope) => {
    const listResponse = await fetch(`${API_BASE}?scope=${scope}&catalog=1`, { cache: "no-store" });
    const listData = await readApiJson<{
      diagrams?: SystemArchitectureDiagram[];
      catalog?: ArchitectureCatalogEntry[];
      error?: string;
    }>(listResponse);
    if (!listResponse.ok) {
      throw new Error(listData.error ?? "Failed to load architecture catalog");
    }
    setExistingDiagrams(
      (listData.diagrams ?? []).map((item) => ({
        sectionSlug: item.sectionSlug,
        title: item.title,
        updatedAt: item.updatedAt,
      })),
    );
    if (listData.catalog?.length) setDiagramCatalog(listData.catalog);
  }, []);

  const loadDiagram = useCallback(async (scope: TopScope, sectionSlug: string) => {
    setDiagramLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}?scope=${scope}&section=${encodeURIComponent(sectionSlug)}&catalog=1`,
        { cache: "no-store" },
      );
      const data = await readApiJson<{
        diagram?: SystemArchitectureDiagram;
        error?: string;
      }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to load architecture diagram");
      setDiagram(data.diagram ?? null);
    } catch (loadError) {
      setDiagram(null);
      setError(loadError instanceof Error ? loadError.message : "Failed to load diagram");
    } finally {
      setDiagramLoading(false);
    }
  }, []);

  const loadTaxonomy = useCallback(async (sectionSlug: string, workspace: string) => {
    setDiagramLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        scope: "unit311",
        section: sectionSlug,
      });
      if (sectionSlug === ARCHITECTURE_TREE_SLUGS.workspaceArchitecture) {
        params.set("workspace", workspace);
      }
      const response = await fetch(`${API_BASE}?${params.toString()}`, { cache: "no-store" });
      const data = await readApiJson<{ taxonomy?: ArchitectureTaxonomyNode; error?: string }>(
        response,
      );
      if (!response.ok) throw new Error(data.error ?? "Failed to load architecture hierarchy");
      setTaxonomy(data.taxonomy ?? null);
    } catch (loadError) {
      setTaxonomy(null);
      setError(loadError instanceof Error ? loadError.message : "Failed to load hierarchy");
    } finally {
      setDiagramLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await loadDiagramIndex(topScope);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load diagrams");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadDiagramIndex, topScope]);

  useEffect(() => {
    if (topScope === "unit311") {
      if (isArchitectureTreeSlug(activeSlug)) {
        void loadTaxonomy(activeSlug, workspaceFilter);
      } else {
        void loadDiagram("unit311", activeSlug);
      }
      return;
    }

    if (!isArchitectureTreeSlug(activeSlug)) {
      void loadDiagram("wolf", activeSlug);
    }
  }, [topScope, activeSlug, workspaceFilter, loadDiagram, loadTaxonomy]);

  useEffect(() => {
    if (topScope === "unit311") {
      setActiveSlug(WOLF_IR_UNIT311_CANVAS_SLUGS[0]);
      return;
    }
    setActiveSlug("wolf-architecture");
  }, [topScope]);

  async function handleDiagramChange(next: ArchitectureDiagramDocument) {
    if (!diagram) return;
    setDiagram({ ...diagram, diagramJson: next });
    await fetch(API_BASE, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: topScope,
        sectionSlug: diagram.sectionSlug,
        title: diagram.title,
        diagramJson: next,
      }),
    });
  }

  async function handleCreateDiagram() {
    const title = newDiagramTitle.trim();
    if (!title) return;
    setCreating(true);
    setError(null);
    try {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "wolf", title }),
      });
      const data = await readApiJson<{ diagram?: SystemArchitectureDiagram; error?: string }>(
        response,
      );
      if (!response.ok || !data.diagram) {
        throw new Error(data.error ?? "Failed to create diagram.");
      }
      await loadDiagramIndex("wolf");
      setActiveSlug(data.diagram.sectionSlug);
      setDiagram(data.diagram);
      setNewDiagramTitle("");
      setShowAddForm(false);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create diagram.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteDiagram(sectionSlug: string) {
    if (!isWolfIrCustomDiagramSlug(sectionSlug)) return;
    if (!window.confirm("Delete this custom architecture diagram?")) return;
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}?section=${encodeURIComponent(sectionSlug)}`,
        { method: "DELETE" },
      );
      const data = await readApiJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to delete diagram.");
      await loadDiagramIndex("wolf");
      if (activeSlug === sectionSlug) {
        setActiveSlug("wolf-architecture");
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete diagram.");
    }
  }

  async function handleRenameDiagram(sectionSlug: string) {
    const title = renameDraft.trim();
    if (!title) return;
    setError(null);
    try {
      const response = await fetch(API_BASE, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "wolf",
          sectionSlug,
          title,
          renameOnly: true,
        }),
      });
      const data = await readApiJson<{ diagram?: SystemArchitectureDiagram; error?: string }>(
        response,
      );
      if (!response.ok || !data.diagram) {
        throw new Error(data.error ?? "Failed to rename diagram.");
      }
      await loadDiagramIndex("wolf");
      if (diagram?.sectionSlug === sectionSlug) {
        setDiagram(data.diagram);
      }
      setRenamingSlug(null);
      setRenameDraft("");
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : "Failed to rename diagram.");
    }
  }

  const activeCanvasTitle =
    topScope === "unit311"
      ? WOLF_IR_UNIT311_CANVAS_LABELS[
          activeSlug as (typeof WOLF_IR_UNIT311_CANVAS_SLUGS)[number]
        ] ?? diagram?.title
      : diagram?.title;

  return (
    <div className="flex min-h-[calc(100vh-14rem)] flex-col gap-4">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
          Information Repository
        </p>
        <h1 className="mt-1 text-xl font-semibold text-white">Architecture Diagrams</h1>
        <p className="mt-1 max-w-3xl text-sm text-white/55">
          Living architecture for WOLF Central — Unit311 platform blueprints and WOLF-specific
          workspace, PAILEX, and AI model diagrams.
        </p>
      </header>

      <nav
        aria-label="Architecture scope"
        className="flex flex-wrap gap-2 border-b border-white/10 pb-3"
      >
        {(
          [
            { id: "unit311" as const, label: "Unit311" },
            { id: "wolf" as const, label: "WOLF" },
          ] as const
        ).map((item) => {
          const isActive = topScope === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTopScope(item.id)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
                isActive
                  ? "border-amber-400/40 bg-amber-500/15 text-amber-100"
                  : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white/80",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-white/55">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading architecture diagrams…
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <nav
              aria-label={topScope === "unit311" ? "Unit311 diagrams" : "WOLF diagrams"}
              className="flex min-w-0 flex-1 flex-wrap gap-1.5"
            >
              {topScope === "unit311"
                ? unit311Tabs.map((item) => {
                    const isActive = activeSlug === item.slug;
                    const isTree = item.kind === "tree";
                    return (
                      <button
                        key={item.slug}
                        type="button"
                        onClick={() => setActiveSlug(item.slug)}
                        className={cn(
                          "inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors",
                          isActive
                            ? isTree
                              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                              : "border-indigo-400/40 bg-indigo-500/15 text-indigo-100"
                            : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white/80",
                        )}
                      >
                        {isTree ? (
                          <ListTree
                            className={cn(
                              "h-3.5 w-3.5",
                              isActive ? "text-emerald-200" : "text-white/35",
                            )}
                          />
                        ) : (
                          <Network
                            className={cn(
                              "h-3.5 w-3.5",
                              isActive ? "text-indigo-200" : "text-white/35",
                            )}
                          />
                        )}
                        {item.title}
                      </button>
                    );
                  })
                : wolfTabs.map((item) => {
                    const isActive = activeSlug === item.slug;
                    const isRenaming = renamingSlug === item.slug;
                    return (
                      <div key={item.slug} className="inline-flex items-center gap-1">
                        {isRenaming ? (
                          <div className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/[0.04] px-2 py-1">
                            <input
                              value={renameDraft}
                              onChange={(event) => setRenameDraft(event.target.value)}
                              className="w-36 bg-transparent text-xs text-white outline-none"
                              autoFocus
                              onKeyDown={(event) => {
                                if (event.key === "Enter") void handleRenameDiagram(item.slug);
                                if (event.key === "Escape") setRenamingSlug(null);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => void handleRenameDiagram(item.slug)}
                              className="rounded-lg px-2 py-1 text-[10px] font-semibold text-emerald-200 hover:bg-emerald-500/10"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveSlug(item.slug)}
                            className={cn(
                              "inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors",
                              isActive
                                ? "border-amber-400/40 bg-amber-500/15 text-amber-100"
                                : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white/80",
                            )}
                          >
                            <Network
                              className={cn(
                                "h-3.5 w-3.5",
                                isActive ? "text-amber-200" : "text-white/35",
                              )}
                            />
                            {item.title}
                          </button>
                        )}
                        {!isRenaming ? (
                          <>
                            <button
                              type="button"
                              title="Rename diagram"
                              onClick={() => {
                                setRenamingSlug(item.slug);
                                setRenameDraft(item.title);
                              }}
                              className="rounded-lg border border-white/10 p-1.5 text-white/45 hover:bg-white/[0.05] hover:text-white/75"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            {item.isCustom ? (
                              <button
                                type="button"
                                title="Delete diagram"
                                onClick={() => void handleDeleteDiagram(item.slug)}
                                className="rounded-lg border border-white/10 p-1.5 text-rose-300/70 hover:bg-rose-500/10 hover:text-rose-200"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    );
                  })}
            </nav>

            {topScope === "wolf" ? (
              <div className="flex items-center gap-2">
                {showAddForm ? (
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-1.5">
                    <input
                      value={newDiagramTitle}
                      onChange={(event) => setNewDiagramTitle(event.target.value)}
                      placeholder="New diagram title"
                      className="w-44 bg-transparent text-xs text-white outline-none placeholder:text-white/35"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void handleCreateDiagram();
                        if (event.key === "Escape") setShowAddForm(false);
                      }}
                    />
                    <button
                      type="button"
                      disabled={creating}
                      onClick={() => void handleCreateDiagram()}
                      className="rounded-lg bg-amber-500/20 px-2 py-1 text-[10px] font-semibold text-amber-100 hover:bg-amber-500/30 disabled:opacity-50"
                    >
                      {creating ? "Adding…" : "Add"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add diagram
                  </button>
                )}
              </div>
            ) : null}
          </div>

          <div className="flex min-h-[28rem] min-w-0 flex-1 flex-col rounded-2xl border border-white/10 bg-[#0b1524]/50 p-3 sm:p-4">
            {error ? (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-rose-400/25 bg-rose-500/10 px-6 text-center text-sm text-rose-100">
                {error}
              </div>
            ) : diagramLoading ? (
              <div className="flex flex-1 items-center justify-center text-sm text-white/60">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading diagram…
              </div>
            ) : topScope === "unit311" && activeIsTree ? (
              taxonomy ? (
                <ArchitectureHierarchyViewer
                  root={taxonomy}
                  title={WOLF_IR_TREE_TITLES[activeSlug] ?? "Architecture"}
                  height="min(72vh, 760px)"
                  workspaceOptions={
                    activeSlug === ARCHITECTURE_TREE_SLUGS.workspaceArchitecture
                      ? WORKSPACE_ARCHITECTURE_OPTIONS
                      : undefined
                  }
                  selectedWorkspace={workspaceFilter}
                  onSelectWorkspace={setWorkspaceFilter}
                />
              ) : (
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/15 bg-[#0b1524]/40 px-6 text-center text-sm text-white/50">
                  Hierarchy unavailable.
                </div>
              )
            ) : diagram ? (
              <ArchitectureViewer
                title={activeCanvasTitle ?? diagram.title}
                sectionSlug={diagram.sectionSlug}
                diagramDocument={diagram.diagramJson}
                catalog={diagramCatalog}
                existingDiagrams={existingDiagrams}
                knownDocSections={[]}
                height="min(72vh, 760px)"
                onDocumentChange={(next) => void handleDiagramChange(next)}
                onSelectDiagram={(slug) => setActiveSlug(slug)}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/15 bg-[#0b1524]/40 px-6 text-center text-sm text-white/50">
                Diagram unavailable. Select another diagram above.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
