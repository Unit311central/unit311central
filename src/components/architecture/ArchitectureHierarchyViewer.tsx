"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Search } from "lucide-react";

import type {
  ArchitectureTaxonomyKind,
  ArchitectureTaxonomyLevel,
  ArchitectureTaxonomyNode,
} from "@/lib/architecture-taxonomy-types";
import { cn } from "@/lib/utils";

type KindFilter = "all" | "core" | "custom";

type WorkspaceOption = { id: string; label: string };

type ArchitectureHierarchyViewerProps = {
  root: ArchitectureTaxonomyNode;
  title: string;
  /** Workspace selector (Workspace Architecture view only). */
  workspaceOptions?: readonly WorkspaceOption[];
  selectedWorkspace?: string;
  onSelectWorkspace?: (id: string) => void;
  height?: number | string;
};

const CONTAINER_LEVELS: ReadonlySet<ArchitectureTaxonomyLevel> = new Set([
  "root",
  "group",
  "workspace",
]);

/** Levels expanded on first render — collapse at Module level by default. */
const DEFAULT_EXPANDED_LEVELS: ReadonlySet<ArchitectureTaxonomyLevel> = new Set([
  "root",
  "group",
  "workspace",
]);

function collectDefaultExpanded(node: ArchitectureTaxonomyNode, acc: Set<string>): void {
  if (DEFAULT_EXPANDED_LEVELS.has(node.level)) acc.add(node.id);
  node.children?.forEach((child) => collectDefaultExpanded(child, acc));
}

function collectAllIds(node: ArchitectureTaxonomyNode, acc: Set<string>): void {
  if (node.children?.length) {
    acc.add(node.id);
    node.children.forEach((child) => collectAllIds(child, acc));
  }
}

function levelBadge(level: ArchitectureTaxonomyLevel): string | null {
  switch (level) {
    case "module":
      return "Module";
    case "feature":
      return "Feature";
    case "sub-feature":
      return "Sub-feature";
    case "workspace":
      return "Workspace";
    default:
      return null;
  }
}

/** Restrained: emerald = Core, violet = Custom, slate = structural. */
function kindAccent(kind: ArchitectureTaxonomyKind): string {
  switch (kind) {
    case "core":
      return "text-emerald-300/90 border-emerald-400/30 bg-emerald-500/10";
    case "custom":
      return "text-violet-300/90 border-violet-400/30 bg-violet-500/10";
    default:
      return "text-white/45 border-white/15 bg-white/[0.04]";
  }
}

function matchesKind(node: ArchitectureTaxonomyNode, filter: KindFilter): boolean {
  if (filter === "all") return true;
  if (node.kind === filter) return true;
  return (node.children ?? []).some((child) => matchesKind(child, filter));
}

function matchesSearch(node: ArchitectureTaxonomyNode, query: string): boolean {
  if (!query) return true;
  if (node.label.toLowerCase().includes(query)) return true;
  return (node.children ?? []).some((child) => matchesSearch(child, query));
}

function nodeDirectlyMatches(node: ArchitectureTaxonomyNode, query: string): boolean {
  return query.length > 0 && node.label.toLowerCase().includes(query);
}

export default function ArchitectureHierarchyViewer({
  root,
  title,
  workspaceOptions,
  selectedWorkspace,
  onSelectWorkspace,
  height = "min(72vh, 760px)",
}: ArchitectureHierarchyViewerProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const acc = new Set<string>();
    collectDefaultExpanded(root, acc);
    return acc;
  });
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");

  // Reset expansion to defaults whenever the root changes (e.g. workspace switch).
  useEffect(() => {
    const acc = new Set<string>();
    collectDefaultExpanded(root, acc);
    setExpanded(acc);
  }, [root]);

  const query = search.trim().toLowerCase();

  // Auto-expand ancestors of search matches.
  const searchExpanded = useMemo(() => {
    if (!query) return null;
    const acc = new Set<string>();
    const walk = (node: ArchitectureTaxonomyNode): boolean => {
      const childHit = (node.children ?? []).map(walk).some(Boolean);
      const selfHit = node.label.toLowerCase().includes(query);
      if (childHit) acc.add(node.id);
      return childHit || selfHit;
    };
    walk(root);
    return acc;
  }, [root, query]);

  const isExpanded = useCallback(
    (id: string) => (searchExpanded ? searchExpanded.has(id) : expanded.has(id)),
    [expanded, searchExpanded],
  );

  const toggle = useCallback((id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const acc = new Set<string>();
    collectAllIds(root, acc);
    setSearch("");
    setExpanded(acc);
  }, [root]);

  const collapseAll = useCallback(() => {
    // Keep the root open so the tree is not entirely blank.
    setSearch("");
    setExpanded(new Set(CONTAINER_LEVELS.has(root.level) ? [root.id] : []));
  }, [root]);

  const visible = (node: ArchitectureTaxonomyNode): boolean =>
    matchesKind(node, kindFilter) && matchesSearch(node, query);

  const renderNode = (node: ArchitectureTaxonomyNode, depth: number): React.ReactNode => {
    if (!visible(node)) return null;
    const children = (node.children ?? []).filter(visible);
    const hasChildren = children.length > 0;
    const open = isExpanded(node.id);
    const badge = levelBadge(node.level);
    const directHit = nodeDirectlyMatches(node, query);
    const isContainer = CONTAINER_LEVELS.has(node.level);

    return (
      <div key={node.id}>
        <div
          className={cn(
            "group flex items-start gap-2 rounded-md py-1.5 pr-2 transition-colors",
            hasChildren ? "cursor-pointer hover:bg-white/[0.04]" : "cursor-default",
            directHit && "bg-amber-400/10 ring-1 ring-amber-300/30",
          )}
          style={{ paddingLeft: depth * 18 + 6 }}
          onClick={() => hasChildren && toggle(node.id)}
        >
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-white/40">
            {hasChildren ? (
              open ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )
            ) : (
              <span className="h-1 w-1 rounded-full bg-white/25" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "truncate",
                  isContainer
                    ? "text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50"
                    : node.level === "module"
                      ? "text-sm font-semibold text-white"
                      : node.level === "feature"
                        ? "text-[13px] font-medium text-white/85"
                        : "text-[13px] text-white/70",
                )}
              >
                {node.label}
              </span>

              {badge && !isContainer ? (
                <span
                  className={cn(
                    "rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                    kindAccent(node.kind),
                  )}
                >
                  {node.kind === "custom" ? "Custom " : ""}
                  {badge}
                </span>
              ) : null}

              {node.level === "module" && node.audited === false ? (
                <span className="rounded border border-white/12 bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white/40">
                  Unaudited
                </span>
              ) : null}
            </div>

            {node.note ? (
              <p className="mt-0.5 text-[11px] leading-snug text-white/35">{node.note}</p>
            ) : null}
          </div>
        </div>

        {hasChildren && open ? (
          <div>{children.map((child) => renderNode(child, depth + 1))}</div>
        ) : null}
      </div>
    );
  };

  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#0a1424]"
      style={{ height }}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3">
        <div className="mr-auto">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Living architecture
          </p>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>

        {workspaceOptions?.length ? (
          <label className="flex items-center gap-1.5 text-[11px] text-white/55">
            <span className="uppercase tracking-wide text-white/40">Workspace</span>
            <select
              value={selectedWorkspace ?? "all"}
              onChange={(event) => onSelectWorkspace?.(event.target.value)}
              className="rounded-lg border border-white/12 bg-[#0b1524] px-2 py-1.5 text-xs text-white outline-none focus:border-sky-400/40"
            >
              {workspaceOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="flex items-center rounded-lg border border-white/10 bg-[#0b1524] p-0.5 text-[11px]">
          {(["all", "core", "custom"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setKindFilter(filter)}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium capitalize transition-colors",
                kindFilter === filter
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:text-white/80",
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search…"
            className="w-44 rounded-lg border border-white/10 bg-[#0b1524] py-1.5 pl-7 pr-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-sky-400/40"
          />
        </div>

        <button
          type="button"
          onClick={expandAll}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-[#0b1524] px-2.5 py-1.5 text-[11px] font-medium text-white/80 hover:bg-white/10"
        >
          <ChevronsUpDown className="h-3.5 w-3.5" />
          Expand all
        </button>
        <button
          type="button"
          onClick={collapseAll}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-[#0b1524] px-2.5 py-1.5 text-[11px] font-medium text-white/80 hover:bg-white/10"
        >
          <ChevronsDownUp className="h-3.5 w-3.5" />
          Collapse all
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-2 py-2">
        {visible(root) ? (
          renderNode(root, 0)
        ) : (
          <p className="px-4 py-8 text-center text-sm text-white/45">No matching items.</p>
        )}
      </div>
    </div>
  );
}
