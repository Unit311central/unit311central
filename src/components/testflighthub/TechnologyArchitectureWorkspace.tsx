"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ListTree, Loader2, Network } from "lucide-react";

import ArchitectureViewer from "@/components/architecture/ArchitectureViewer";
import ArchitectureHierarchyViewer from "@/components/architecture/ArchitectureHierarchyViewer";
import GreenDesertInformationRepositoryArchitectureWorkspace from "@/components/greendesert/GreenDesertInformationRepositoryArchitectureWorkspace";
import CustomerArchitectureWorkspace from "@/components/testflighthub/CustomerArchitectureWorkspace";
import { isBrowserCustomerWorkspaceSurface } from "@/lib/customer-workspace-surface";
import { isBrowserGreenDesertSurface } from "@/lib/greendesert-surface";
import {
  ARCHITECTURE_DIAGRAM_CATALOG,
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
import { cn } from "@/lib/utils";

const CORE_DIAGRAM_SLUGS = [
  "platform-overview",
  "vercel-stack",
  "supabase-stack",
  "codebase-stack",
] as const;

const CORE_DIAGRAM_LABELS: Record<(typeof CORE_DIAGRAM_SLUGS)[number], string> = {
  "platform-overview": "Unit311Central platform",
  "vercel-stack": "Vercel deployment stack",
  "supabase-stack": "Supabase data stack",
  "codebase-stack": "Application codebase stack",
};

const TREE_DIAGRAM_TABS = [
  { slug: ARCHITECTURE_TREE_SLUGS.coreProduct, title: "Core Product" },
  { slug: ARCHITECTURE_TREE_SLUGS.customProduct, title: "Custom Product" },
  { slug: ARCHITECTURE_TREE_SLUGS.workspaceArchitecture, title: "Workspace Architecture" },
] as const;

const TREE_TITLE: Record<string, string> = {
  "core-product": "Core Product",
  "custom-product": "Custom Product",
  "workspace-architecture": "Workspace Architecture",
};

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  return JSON.parse(text) as T;
}

export default function TechnologyArchitectureWorkspace() {
  if (isBrowserGreenDesertSurface()) {
    return <GreenDesertInformationRepositoryArchitectureWorkspace />;
  }
  if (isBrowserCustomerWorkspaceSurface()) {
    return <CustomerArchitectureWorkspace />;
  }
  return <PlatformTechnologyArchitectureWorkspace />;
}

function PlatformTechnologyArchitectureWorkspace() {
  const [diagramCatalog, setDiagramCatalog] = useState<ArchitectureCatalogEntry[]>([
    ...ARCHITECTURE_DIAGRAM_CATALOG,
  ]);
  const [existingDiagrams, setExistingDiagrams] = useState<
    Array<Pick<SystemArchitectureDiagram, "sectionSlug" | "title" | "updatedAt">>
  >([]);
  const [activeSlug, setActiveSlug] = useState<string>(CORE_DIAGRAM_SLUGS[0]);
  const [diagram, setDiagram] = useState<SystemArchitectureDiagram | null>(null);
  const [taxonomy, setTaxonomy] = useState<ArchitectureTaxonomyNode | null>(null);
  const [workspaceFilter, setWorkspaceFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [diagramLoading, setDiagramLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeIsTree = isArchitectureTreeSlug(activeSlug);

  const diagramTabs = useMemo(() => {
    return CORE_DIAGRAM_SLUGS.map((slug) => {
      const catalog = diagramCatalog.find((entry) => entry.sectionSlug === slug);
      const existing = existingDiagrams.find((entry) => entry.sectionSlug === slug);
      return {
        slug,
        title: CORE_DIAGRAM_LABELS[slug],
        description:
          catalog?.description ??
          existing?.title ??
          "Living architecture diagram for the Demo workspace",
      };
    });
  }, [diagramCatalog, existingDiagrams]);

  const loadDiagramIndex = useCallback(async () => {
    const listResponse = await fetch("/api/architecture-diagrams?catalog=1", {
      cache: "no-store",
    });
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

  const loadDiagram = useCallback(async (sectionSlug: string) => {
    setDiagramLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/architecture-diagrams?section=${encodeURIComponent(sectionSlug)}&catalog=1`,
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

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await loadDiagramIndex();
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load diagrams");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadDiagramIndex]);

  const loadTaxonomy = useCallback(async (sectionSlug: string, workspace: string) => {
    setDiagramLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ section: sectionSlug });
      if (sectionSlug === ARCHITECTURE_TREE_SLUGS.workspaceArchitecture) {
        params.set("workspace", workspace);
      }
      const response = await fetch(`/api/architecture-diagrams?${params.toString()}`, {
        cache: "no-store",
      });
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
    if (isArchitectureTreeSlug(activeSlug)) {
      void loadTaxonomy(activeSlug, workspaceFilter);
    } else {
      void loadDiagram(activeSlug);
    }
  }, [activeSlug, workspaceFilter, loadDiagram, loadTaxonomy]);

  async function handleDiagramChange(next: ArchitectureDiagramDocument) {
    if (!diagram) return;
    setDiagram({ ...diagram, diagramJson: next });
    await fetch("/api/architecture-diagrams", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionSlug: diagram.sectionSlug,
        title: diagram.title,
        diagramJson: next,
      }),
    });
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-4">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
          Technology Management
        </p>
        <h1 className="mt-1 text-xl font-semibold text-white">Living Diagrams</h1>
        <p className="mt-1 max-w-3xl text-sm text-white/55">
          Editable architecture diagrams for the Demo workspace — platform overview, Vercel deployment,
          Supabase data layer, and application codebase stack.
        </p>
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-white/55">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading living diagrams…
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <nav
            aria-label="Living diagrams"
            className="flex flex-wrap gap-1.5 overflow-x-auto border-b border-white/10 pb-3"
          >
            {diagramTabs.map((item) => {
              const isActive = activeSlug === item.slug;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setActiveSlug(item.slug)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors",
                    isActive
                      ? "border-indigo-400/40 bg-indigo-500/15 text-indigo-100"
                      : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white/80",
                  )}
                >
                  <Network className={cn("h-3.5 w-3.5", isActive ? "text-indigo-200" : "text-white/35")} />
                  {item.title}
                </button>
              );
            })}

            <span className="mx-1 hidden self-center text-white/15 sm:inline">|</span>

            {TREE_DIAGRAM_TABS.map((item) => {
              const isActive = activeSlug === item.slug;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setActiveSlug(item.slug)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors",
                    isActive
                      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                      : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white/80",
                  )}
                >
                  <ListTree
                    className={cn("h-3.5 w-3.5", isActive ? "text-emerald-200" : "text-white/35")}
                  />
                  {item.title}
                </button>
              );
            })}
          </nav>

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
            ) : activeIsTree ? (
              taxonomy ? (
                <ArchitectureHierarchyViewer
                  root={taxonomy}
                  title={TREE_TITLE[activeSlug] ?? "Architecture"}
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
                title={CORE_DIAGRAM_LABELS[activeSlug as (typeof CORE_DIAGRAM_SLUGS)[number]] ?? diagram.title}
                sectionSlug={diagram.sectionSlug}
                diagramDocument={diagram.diagramJson}
                catalog={diagramCatalog.filter((entry) =>
                  CORE_DIAGRAM_SLUGS.includes(
                    entry.sectionSlug as (typeof CORE_DIAGRAM_SLUGS)[number],
                  ),
                )}
                existingDiagrams={existingDiagrams.filter((entry) =>
                  CORE_DIAGRAM_SLUGS.includes(
                    entry.sectionSlug as (typeof CORE_DIAGRAM_SLUGS)[number],
                  ),
                )}
                knownDocSections={[]}
                height="min(72vh, 760px)"
                onDocumentChange={(next) => void handleDiagramChange(next)}
                onSelectDiagram={(slug) => setActiveSlug(slug)}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/15 bg-[#0b1524]/40 px-6 text-center text-sm text-white/50">
                Diagram unavailable. Select another living diagram above.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
