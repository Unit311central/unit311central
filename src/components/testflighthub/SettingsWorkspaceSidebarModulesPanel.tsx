"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical, Lock, MinusCircle, Plus } from "lucide-react";

import {
  enableWorkspaceSidebarModule,
  type WorkspaceSidebarModuleRecord,
} from "@/lib/platform-workspaces/workspace-sidebar-config";
import { PLATFORM_CACHE_KEYS, invalidateCachedJson } from "@/lib/platform-fetch-cache";
import { SIDEBAR_NAV_CUSTOM_EVENT } from "@/lib/sidebar-nav-custom";
import { cn } from "@/lib/utils";

type SidebarCatalogueEntry = {
  id: string;
  label: string;
  number: number;
};

type SidebarConfigResponse = {
  catalogue: SidebarCatalogueEntry[];
  modules: WorkspaceSidebarModuleRecord[];
  canManage?: boolean;
  error?: string;
};

const collisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args).filter(({ id }) => id !== args.active.id);
  if (pointerHits.length > 0) return pointerHits;
  return closestCenter(args).filter(({ id }) => id !== args.active.id);
};

function labelForModule(catalogue: SidebarCatalogueEntry[], moduleId: string): string {
  return catalogue.find((entry) => entry.id === moduleId)?.label ?? moduleId;
}

const compactIconButtonClass =
  "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-white/10 text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white/80 disabled:pointer-events-none disabled:opacity-30";

function DraggableEnabledRow({
  moduleId,
  label,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  busy,
}: {
  moduleId: string;
  label: string;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  busy: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: moduleId,
    disabled: busy,
  });
  const { setNodeRef: dropRef } = useDroppable({ id: moduleId, disabled: busy });

  return (
    <li
      ref={(node) => {
        setNodeRef(node);
        dropRef(node);
      }}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: isDragging ? 0.45 : 1,
      }}
      className="flex min-w-0 items-center gap-1 rounded-lg border border-violet-400/25 bg-violet-500/10 px-1.5 py-1.5"
    >
      <button
        type="button"
        className="inline-flex shrink-0 cursor-grab touch-none self-center text-white/40 active:cursor-grabbing"
        aria-label={`Drag ${label}`}
        disabled={busy}
        {...listeners}
        {...attributes}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span
        className="min-w-0 flex-1 self-center text-[10px] font-semibold uppercase leading-snug tracking-[0.02em] text-white/90 break-words [overflow-wrap:anywhere]"
        title={label}
      >
        {label}
      </span>
      <div className="flex shrink-0 items-center gap-0.5 self-center">
        <button
          type="button"
          disabled={busy || !canMoveUp}
          onClick={onMoveUp}
          className={compactIconButtonClass}
          aria-label={`Move ${label} up`}
        >
          <ChevronUp className="h-3 w-3" strokeWidth={2} />
        </button>
        <button
          type="button"
          disabled={busy || !canMoveDown}
          onClick={onMoveDown}
          className={compactIconButtonClass}
          aria-label={`Move ${label} down`}
        >
          <ChevronDown className="h-3 w-3" strokeWidth={2} />
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onRemove}
          className="inline-flex h-5 shrink-0 items-center gap-0.5 rounded border border-rose-400/25 bg-rose-500/10 px-1 text-[9px] font-medium text-rose-100/90 transition-colors hover:bg-rose-500/20 disabled:opacity-40"
          aria-label={`Remove ${label} from sidebar`}
        >
          <MinusCircle className="h-2.5 w-2.5 shrink-0" />
          Remove
        </button>
      </div>
    </li>
  );
}

export function SettingsWorkspaceSidebarModulesPanel() {
  const [catalogue, setCatalogue] = useState<SidebarCatalogueEntry[]>([]);
  const [modules, setModules] = useState<WorkspaceSidebarModuleRecord[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 4 } }),
  );

  const refreshConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/workspace/sidebar-config", { cache: "no-store" });
      const body = (await response.json()) as SidebarConfigResponse;
      if (!response.ok) {
        throw new Error(body.error ?? `HTTP ${response.status}`);
      }
      setCatalogue(body.catalogue ?? []);
      setModules(body.modules ?? []);
      setCanManage(Boolean(body.canManage));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load sidebar configuration.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshConfig();
  }, [refreshConfig]);

  const enabledModules = useMemo(
    () =>
      [...modules]
        .filter((row) => row.enabled)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [modules],
  );

  const disabledModules = useMemo(
    () =>
      [...modules]
        .filter((row) => !row.enabled)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [modules],
  );

  const persist = useCallback(
    async (nextRows: WorkspaceSidebarModuleRecord[]) => {
      if (!canManage) return;
      setSaving(true);
      setNotice(null);
      setError(null);
      try {
        const response = await fetch("/api/workspace/sidebar-config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modules: nextRows }),
        });
        const body = (await response.json()) as { error?: string; modules?: WorkspaceSidebarModuleRecord[] };
        if (!response.ok) {
          throw new Error(body.error ?? `HTTP ${response.status}`);
        }
        setModules(body.modules ?? nextRows);
        invalidateCachedJson(PLATFORM_CACHE_KEYS.whoami);
        window.dispatchEvent(new Event(SIDEBAR_NAV_CUSTOM_EVENT));
        setNotice("Sidebar updated for this workspace.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save sidebar configuration.");
      } finally {
        setSaving(false);
      }
    },
    [canManage],
  );

  function reorderEnabled(activeIdValue: string, overId: string) {
    const ids = enabledModules.map((row) => row.moduleId);
    const from = ids.indexOf(activeIdValue);
    const to = ids.indexOf(overId);
    if (from < 0 || to < 0 || from === to) return;
    const nextIds = [...ids];
    const [item] = nextIds.splice(from, 1);
    nextIds.splice(to, 0, item!);
    const nextRows = modules.map((row) => {
      const orderIndex = nextIds.indexOf(row.moduleId);
      if (orderIndex >= 0) {
        return { ...row, enabled: true, displayOrder: (orderIndex + 1) * 10 };
      }
      return row;
    });
    setModules(nextRows);
    void persist(nextRows);
  }

  function moveEnabled(moduleId: string, direction: "up" | "down") {
    const ids = enabledModules.map((row) => row.moduleId);
    const index = ids.indexOf(moduleId);
    if (index < 0) return;
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= ids.length) return;
    reorderEnabled(moduleId, ids[target]!);
  }

  function enableModule(moduleId: string) {
    const nextRows = enableWorkspaceSidebarModule(modules, moduleId);
    if (!nextRows) return;
    setModules(nextRows);
    void persist(nextRows);
  }

  function disableModule(moduleId: string) {
    const nextRows = modules.map((row) =>
      row.moduleId === moduleId ? { ...row, enabled: false } : row,
    );
    setModules(nextRows);
    void persist(nextRows);
  }

  if (loading) {
    return <p className="text-xs text-white/45">Loading sidebar modules…</p>;
  }

  return (
    <div className="min-w-0 -mx-2 space-y-3 px-1">
      <p className="text-[9px] leading-snug text-white/40 2xl:text-[10px]">
        Choose which platform modules appear in the left navigation for this workspace. Removing a
        module hides it from the sidebar only — data and settings are kept.
      </p>

      {error ? (
        <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
          {notice}
        </p>
      ) : null}

      <div>
        <p className="mb-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/35 2xl:text-[9px]">
          Fixed at top
        </p>
        <ul className="space-y-1">
          {["HOME", "EXECUTIVE ASSISTANT"].map((label) => (
            <li
              key={label}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0b1524]/70 px-2.5 py-1.5"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-white/80">
                {label}
              </span>
              <span className="inline-flex items-center gap-1 text-[8px] uppercase tracking-wide text-white/40">
                <Lock className="h-2.5 w-2.5" />
                Fixed
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-violet-300/70 2xl:text-[9px]">
          Workspace modules
        </p>
        {!canManage ? (
          <p className="text-[10px] text-white/45">You can view modules but cannot change them.</p>
        ) : null}
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={(event: DragStartEvent) => setActiveId(String(event.active.id))}
          onDragEnd={(event: DragEndEvent) => {
            setActiveId(null);
            const { active, over } = event;
            if (!over || active.id === over.id) return;
            reorderEnabled(String(active.id), String(over.id));
          }}
          onDragCancel={() => setActiveId(null)}
        >
          <ul className="space-y-1">
            {enabledModules.map((row, index) => (
              <DraggableEnabledRow
                key={row.moduleId}
                moduleId={row.moduleId}
                label={labelForModule(catalogue, row.moduleId)}
                onRemove={() => disableModule(row.moduleId)}
                onMoveUp={() => moveEnabled(row.moduleId, "up")}
                onMoveDown={() => moveEnabled(row.moduleId, "down")}
                canMoveUp={index > 0}
                canMoveDown={index < enabledModules.length - 1}
                busy={saving || !canManage}
              />
            ))}
          </ul>
          <DragOverlay dropAnimation={null}>
            {activeId ? (
              <div className="rounded-lg border border-violet-400/35 bg-[#0b1524] px-2.5 py-1.5 shadow-lg">
                <p className="text-[10px] font-semibold uppercase text-white/90">
                  {labelForModule(catalogue, activeId)}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {disabledModules.length > 0 ? (
        <div>
          <p className="mb-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/35 2xl:text-[9px]">
            Available modules
          </p>
          <ul className="space-y-1">
            {disabledModules.map((row) => {
              const label = labelForModule(catalogue, row.moduleId);
              return (
                <li
                  key={row.moduleId}
                  className="flex min-w-0 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-1.5 py-1.5"
                >
                  <span
                    className="min-w-0 flex-1 text-[10px] font-medium uppercase leading-snug tracking-[0.02em] text-white/60 break-words [overflow-wrap:anywhere]"
                    title={label}
                  >
                    {label}
                  </span>
                  <button
                    type="button"
                    disabled={saving || !canManage}
                    onClick={() => enableModule(row.moduleId)}
                    className={cn(
                      "inline-flex h-5 shrink-0 items-center gap-0.5 rounded border border-emerald-400/30 bg-emerald-500/10 px-1 text-[9px] font-medium text-emerald-100 transition-colors hover:bg-emerald-500/20 disabled:opacity-40",
                    )}
                    aria-label={`Add ${label} to sidebar`}
                  >
                    <Plus className="h-2.5 w-2.5 shrink-0" />
                    Add
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div>
        <p className="mb-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/35 2xl:text-[9px]">
          Fixed at bottom
        </p>
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0b1524]/70 px-2.5 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-white/80">
            Settings
          </span>
          <span className="inline-flex items-center gap-1 text-[8px] uppercase tracking-wide text-white/40">
            <Lock className="h-2.5 w-2.5" />
            Fixed
          </span>
        </div>
      </div>
    </div>
  );
}
