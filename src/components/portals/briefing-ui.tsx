"use client";

import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  newPortalsRowId,
  portalsRowBlockEnd,
  portalsRowIndent,
} from "@/lib/portals/briefing/editor-utils";
import type { PortalsIndent, PortalsModuleRow } from "@/lib/portals/types";
import { cn } from "@/lib/utils";

export type PortalsBriefingCredentialBlock = {
  title: string;
  url: string;
  urlLabel: string;
  username: string;
  password: string;
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Ignore clipboard failures.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-white/55 transition hover:border-white/30 hover:text-white"
      aria-label={`Copy ${label}`}
    >
      {copied ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function PortalsBriefingCredentialCard({ block }: { block: PortalsBriefingCredentialBlock }) {
  return (
    <article className="rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.09] to-white/[0.02] p-4">
      <h3 className="text-[15px] font-semibold tracking-tight text-white">{block.title}</h3>
      <a
        href={block.url}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-sky-300/90 transition hover:text-sky-200"
      >
        {block.urlLabel}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </a>
      <dl className="mt-3 space-y-2 text-[12px]">
        <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/25 px-2.5 py-2">
          <div className="min-w-0">
            <dt className="text-[10px] uppercase tracking-[0.12em] text-white/40">Username</dt>
            <dd className="truncate font-medium text-white/90">{block.username}</dd>
          </div>
          <CopyButton value={block.username} label="username" />
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/25 px-2.5 py-2">
          <div className="min-w-0">
            <dt className="text-[10px] uppercase tracking-[0.12em] text-white/40">Password</dt>
            <dd className="truncate font-medium text-white/90">{block.password}</dd>
          </div>
          <CopyButton value={block.password} label="password" />
        </div>
      </dl>
    </article>
  );
}

type ModuleNode = {
  row: PortalsModuleRow;
  index: number;
  children: ModuleNode[];
};

function buildModuleTree(rows: PortalsModuleRow[]): ModuleNode[] {
  const roots: ModuleNode[] = [];
  let current0: ModuleNode | null = null;
  let current1: ModuleNode | null = null;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!;
    const indent = portalsRowIndent(row);
    const node: ModuleNode = { row, index, children: [] };

    if (indent === 0) {
      roots.push(node);
      current0 = node;
      current1 = null;
      continue;
    }
    if (indent === 1) {
      if (current0) {
        current0.children.push(node);
        current1 = node;
      } else {
        roots.push(node);
        current0 = node;
        current1 = null;
      }
      continue;
    }
    if (current1) {
      current1.children.push(node);
    } else if (current0) {
      current0.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export function PortalsBriefingEditableRows({
  rows,
  canEdit,
  accent,
  collapsible = false,
  onChange,
}: {
  rows: PortalsModuleRow[];
  canEdit: boolean;
  accent: "sky" | "pink";
  collapsible?: boolean;
  onChange: (next: PortalsModuleRow[]) => void;
}) {
  const tree = useMemo(() => buildModuleTree(rows), [rows]);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [focusRowId, setFocusRowId] = useState<string | null>(null);

  function isExpanded(id: string) {
    if (!collapsible) return true;
    if (canEdit) return expandedIds[id] !== false;
    return Boolean(expandedIds[id]);
  }

  function toggleExpanded(id: string) {
    setExpandedIds((current) => {
      const open = canEdit ? current[id] !== false : Boolean(current[id]);
      return { ...current, [id]: !open };
    });
  }

  function updateRow(id: string, patch: Partial<PortalsModuleRow>) {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function removeRow(id: string) {
    const index = rows.findIndex((row) => row.id === id);
    if (index < 0) return;
    const end = portalsRowBlockEnd(rows, index);
    onChange([...rows.slice(0, index), ...rows.slice(end)]);
  }

  function addTopLevelRow() {
    const id = newPortalsRowId("r");
    onChange([...rows, { id, text: "", indent: 0 }]);
    setExpandedIds((current) => ({ ...current, [id]: true }));
    setFocusRowId(id);
  }

  function addChildUnder(parentId: string) {
    const parentIndex = rows.findIndex((row) => row.id === parentId);
    if (parentIndex < 0) return;
    const parentIndent = portalsRowIndent(rows[parentIndex]);
    if (parentIndent >= 2) return;
    const childIndent = (parentIndent + 1) as PortalsIndent;
    const insertAt = portalsRowBlockEnd(rows, parentIndex);
    const id = newPortalsRowId(childIndent === 2 ? "nn" : "n");
    const next = [...rows];
    next.splice(insertAt, 0, {
      id,
      text: "",
      indent: childIndent,
    });
    onChange(next);
    setExpandedIds((current) => ({ ...current, [parentId]: true }));
    setFocusRowId(id);
  }

  function moveRow(index: number, direction: -1 | 1) {
    const row = rows[index];
    if (!row) return;
    const indent = portalsRowIndent(row);
    const end = portalsRowBlockEnd(rows, index);
    const block = rows.slice(index, end);

    if (direction === -1) {
      let prev = index - 1;
      while (prev >= 0 && portalsRowIndent(rows[prev]) > indent) prev -= 1;
      if (prev < 0 || portalsRowIndent(rows[prev]) !== indent) return;
      onChange([
        ...rows.slice(0, prev),
        ...block,
        ...rows.slice(prev, index),
        ...rows.slice(end),
      ]);
      return;
    }

    if (end >= rows.length || portalsRowIndent(rows[end]) !== indent) return;
    const nextEnd = portalsRowBlockEnd(rows, end);
    onChange([
      ...rows.slice(0, index),
      ...rows.slice(end, nextEnd),
      ...block,
      ...rows.slice(nextEnd),
    ]);
  }

  function canMove(index: number, direction: -1 | 1) {
    const indent = portalsRowIndent(rows[index]);
    const end = portalsRowBlockEnd(rows, index);
    if (direction === -1) {
      let prev = index - 1;
      while (prev >= 0 && portalsRowIndent(rows[prev]) > indent) prev -= 1;
      return prev >= 0 && portalsRowIndent(rows[prev]) === indent;
    }
    return end < rows.length && portalsRowIndent(rows[end]) === indent;
  }

  function renderNode(node: ModuleNode, depth: 0 | 1 | 2) {
    const hasChildren = node.children.length > 0;
    const open = isExpanded(node.row.id);
    const ExpandIcon = open ? ChevronDown : ChevronRight;
    const childLabel = depth === 0 ? "sub-row" : "sub-sub-row";
    const placeholder =
      depth === 0 ? "Top-level row…" : depth === 1 ? "Sub-row…" : "Sub-sub-row…";

    if (!canEdit && !node.row.text.trim() && !hasChildren) return null;

    return (
      <li key={node.row.id} className="space-y-1">
        <div className="flex items-start gap-1.5">
          {collapsible && depth === 0 ? (
            hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpanded(node.row.id)}
                className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/15 text-white/70 hover:bg-white/5 hover:text-white"
                aria-expanded={open}
                aria-label={open ? "Collapse" : "Expand"}
              >
                <ExpandIcon className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="mt-1 inline-flex h-6 w-6 shrink-0" aria-hidden />
            )
          ) : null}
          {!collapsible && depth === 0 && accent === "pink" ? (
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F48FB1]" />
          ) : null}

          {canEdit ? (
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-start gap-1.5">
                <div className="flex shrink-0 flex-col gap-0.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => moveRow(node.index, -1)}
                    disabled={!canMove(node.index, -1)}
                    className="rounded border border-white/15 p-0.5 text-white/55 hover:bg-white/5 hover:text-white disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveRow(node.index, 1)}
                    disabled={!canMove(node.index, 1)}
                    className="rounded border border-white/15 p-0.5 text-white/55 hover:bg-white/5 hover:text-white disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input
                  value={node.row.text}
                  onChange={(event) => updateRow(node.row.id, { text: event.target.value })}
                  placeholder={placeholder}
                  autoFocus={focusRowId === node.row.id}
                  onFocus={() => {
                    if (focusRowId === node.row.id) setFocusRowId(null);
                  }}
                  className={cn(
                    "min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-white outline-none placeholder:text-white/30 focus:border-sky-400/50",
                    depth === 0 ? "text-[13px] font-medium" : "text-[12px]",
                    depth === 2 && "text-white/85",
                  )}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-8">
                {depth < 2 ? (
                  <button
                    type="button"
                    onClick={() => addChildUnder(node.row.id)}
                    className="inline-flex items-center gap-1 rounded border border-sky-400/30 bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-100 hover:bg-sky-500/20"
                  >
                    <Plus className="h-3 w-3" />
                    Add {childLabel}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => removeRow(node.row.id)}
                  className="inline-flex items-center gap-1 rounded border border-rose-400/25 px-1.5 py-0.5 text-[10px] text-rose-200 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
                {depth === 0 && hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggleExpanded(node.row.id)}
                    className="text-[10px] text-white/45 hover:text-white/70"
                  >
                    {open ? "Hide sub-rows" : `Show ${node.children.length} sub-rows`}
                  </button>
                ) : null}
              </div>
            </div>
          ) : depth === 0 ? (
            <button
              type="button"
              onClick={() => (hasChildren ? toggleExpanded(node.row.id) : undefined)}
              className={cn(
                "min-w-0 flex-1 rounded-lg px-1 py-1 text-left text-[13px] font-medium text-white/90",
                hasChildren && "hover:bg-white/[0.04]",
              )}
            >
              {node.row.text}
              {hasChildren && !open ? (
                <span className="ml-2 text-[11px] font-normal text-white/40">
                  ({node.children.length})
                </span>
              ) : null}
            </button>
          ) : (
            <p
              className={cn(
                "min-w-0 flex-1 py-0.5 leading-snug",
                depth === 1 ? "text-[12px] text-white/55" : "text-[11px] text-white/45",
              )}
            >
              {node.row.text}
            </p>
          )}
        </div>

        {open && hasChildren ? (
          <ul
            className={cn(
              "space-y-1.5 border-l border-white/10 pl-3",
              depth === 0 ? "ml-7" : "ml-5",
            )}
          >
            {node.children.map((child) => renderNode(child, depth === 0 ? 1 : 2))}
          </ul>
        ) : null}
      </li>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ul className="flex-1 space-y-1.5">{tree.map((node) => renderNode(node, 0))}</ul>
      {canEdit ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={addTopLevelRow}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/35 bg-sky-500/15 px-3 py-2 text-[11px] font-semibold text-sky-50 hover:bg-sky-500/25"
          >
            <Plus className="h-3.5 w-3.5" />
            Add top-level row
          </button>
        </div>
      ) : null}
    </div>
  );
}
