"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Eye,
  EyeOff,
  GripVertical,
  Lock,
  Plus,
} from "lucide-react";

import type { InternalNavSection } from "@/lib/internal-operations-data";
import { isOnwardAirLockedSectionBundle } from "@/lib/onwardair-nav-order";
import { isTalantonLockedSectionBundle, TALANTON_SIDEBAR_FACTORY_REVISION } from "@/lib/talanton-nav-order";
import {
  getNavSectionKey,
  getNavSectionTitle,
  isFixedPinSection,
  isMovableWorkspaceSection,
  isSettingsSection,
  listSectionLeafItems,
  reorderSectionKeys,
  sidebarNavCustomStorageKey,
  type SidebarNavCustomStorage,
  type SidebarNavLeafItem,
} from "@/lib/sidebar-nav-custom";
import { cn } from "@/lib/utils";

type SettingsSidebarReorderPanelProps = {
  orderedSections: InternalNavSection[];
  navCustom: SidebarNavCustomStorage;
  expandedModules: Record<string, boolean>;
  customNavLabel: string;
  onCustomNavLabelChange: (value: string) => void;
  onPersistNavCustom: (next: SidebarNavCustomStorage) => void;
  onToggleModuleExpanded: (sectionKey: string) => void;
  onToggleNavHidden: (itemId: string) => void;
  onAddCustomNavItem: () => void;
  inputClassName: string;
};

function combineRefs<T>(...refs: Array<(node: T | null) => void>) {
  return (node: T | null) => {
    for (const ref of refs) ref(node);
  };
}

function sectionAccent(section: InternalNavSection) {
  const fixedPin = isFixedPinSection(section) || section.kind === "pin";
  const settingsFixed = isSettingsSection(section);
  return section.color ?? (fixedPin ? "#2F80ED" : settingsFixed ? "#56CCF2" : "#9B51E0");
}

function FixedModuleRow({
  section,
  expanded,
  navCustom,
  onToggleExpanded,
  onToggleNavHidden,
}: {
  section: InternalNavSection;
  expanded: boolean;
  navCustom: SidebarNavCustomStorage;
  onToggleExpanded: () => void;
  onToggleNavHidden: (itemId: string) => void;
}) {
  const sectionKey = getNavSectionKey(section);
  const title = getNavSectionTitle(section);
  const settingsFixed = isSettingsSection(section);
  const leaves = listSectionLeafItems(section);
  const customLeaves =
    settingsFixed || sectionKey === "workspace:Custom" ? navCustom.customItems : [];

  return (
    <li className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1524]/70">
      <ModuleRowChrome
        section={section}
        title={title}
        trailing={
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white/40"
            title="Position locked"
          >
            <Lock className="h-2.5 w-2.5" />
            Fixed
          </span>
        }
        expanded={expanded}
        onToggleExpanded={onToggleExpanded}
      >
        <ModuleLeafList
          leaves={leaves}
          customLeaves={customLeaves}
          navCustom={navCustom}
          onToggleNavHidden={onToggleNavHidden}
        />
      </ModuleRowChrome>
    </li>
  );
}

function DraggableModuleRow({
  section,
  movableKeys,
  expanded,
  navCustom,
  onToggleExpanded,
  onMove,
  onToggleNavHidden,
}: {
  section: InternalNavSection;
  movableKeys: string[];
  expanded: boolean;
  navCustom: SidebarNavCustomStorage;
  onToggleExpanded: () => void;
  onMove: (direction: -1 | 1) => void;
  onToggleNavHidden: (itemId: string) => void;
}) {
  const sectionKey = getNavSectionKey(section);
  const title = getNavSectionTitle(section);
  const leaves = listSectionLeafItems(section);
  const movableIndex = movableKeys.indexOf(sectionKey);

  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: sectionKey,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: sectionKey,
  });

  return (
    <li
      ref={combineRefs(setDragRef, setDropRef)}
      style={{
        transform: CSS.Translate.toString(transform),
        transition: isDragging ? undefined : "transform 180ms ease",
      }}
      className={cn(
        "overflow-hidden rounded-xl border bg-[#0b1524]/70",
        isDragging ? "border-violet-400/40 opacity-60" : "border-white/10",
        isOver && !isDragging && "border-violet-400/35 ring-1 ring-violet-400/20",
      )}
    >
      <ModuleRowChrome
        section={section}
        title={title}
        leading={
          <button
            type="button"
            className="cursor-grab rounded border border-white/10 p-1 text-white/45 hover:bg-white/5 hover:text-white active:cursor-grabbing"
            aria-label={`Drag to reorder ${title}`}
            {...listeners}
            {...attributes}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        }
        trailing={
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={movableIndex <= 0}
              className="rounded border border-white/10 p-0.5 text-white/50 hover:bg-white/5 hover:text-white disabled:opacity-30"
              aria-label={`Move ${title} up`}
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={movableIndex < 0 || movableIndex >= movableKeys.length - 1}
              className="rounded border border-white/10 p-0.5 text-white/50 hover:bg-white/5 hover:text-white disabled:opacity-30"
              aria-label={`Move ${title} down`}
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        }
        expanded={expanded}
        onToggleExpanded={onToggleExpanded}
      >
        <ModuleLeafList leaves={leaves} customLeaves={[]} navCustom={navCustom} onToggleNavHidden={onToggleNavHidden} />
      </ModuleRowChrome>
    </li>
  );
}

function ModuleRowChrome({
  section,
  title,
  leading,
  trailing,
  expanded,
  onToggleExpanded,
  children,
}: {
  section: InternalNavSection;
  title: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  expanded: boolean;
  onToggleExpanded: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-stretch">
      <span className="w-1 shrink-0 self-stretch" style={{ background: sectionAccent(section) }} aria-hidden />
      <div className="min-w-0 flex-1 px-2.5 py-2">
        <div className="flex items-center gap-1.5">
          {leading ?? <span className="w-[26px] shrink-0" aria-hidden />}
          <p className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-[0.06em] text-white/90">
            {title}
          </p>
          {trailing}
          <button
            type="button"
            onClick={onToggleExpanded}
            className="rounded border border-white/10 p-1 text-white/55 hover:bg-white/5 hover:text-white"
            aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`}
            aria-expanded={expanded}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        {expanded ? children : null}
      </div>
    </div>
  );
}

function ModuleLeafList({
  leaves,
  customLeaves,
  navCustom,
  onToggleNavHidden,
}: {
  leaves: ReturnType<typeof listSectionLeafItems>;
  customLeaves: SidebarNavLeafItem[];
  navCustom: SidebarNavCustomStorage;
  onToggleNavHidden: (itemId: string) => void;
}) {
  return (
    <ul className="mt-2 space-y-1 border-t border-white/10 pt-2">
      {leaves.length === 0 && customLeaves.length === 0 ? (
        <li className="px-1 py-1 text-[10px] text-white/35">No sub-modules</li>
      ) : null}
      {leaves.map((item) => (
        <SidebarLeafRow
          key={item.id}
          item={item}
          hidden={navCustom.hidden[item.id] ?? false}
          onToggleNavHidden={onToggleNavHidden}
        />
      ))}
      {customLeaves.map((item) => (
        <SidebarLeafRow
          key={item.id}
          item={item}
          hidden={navCustom.hidden[item.id] ?? false}
          onToggleNavHidden={onToggleNavHidden}
          custom
        />
      ))}
    </ul>
  );
}

function SidebarLeafRow({
  item,
  hidden,
  onToggleNavHidden,
  custom = false,
}: {
  item: SidebarNavLeafItem;
  hidden: boolean;
  onToggleNavHidden: (itemId: string) => void;
  custom?: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-lg border px-2 py-1.5",
        custom
          ? "border-violet-400/20 bg-violet-500/5"
          : "border-white/8 bg-white/[0.02]",
        hidden && "opacity-45",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] text-white/85">
          {item.label}
          {custom ? (
            <span className="ml-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-1 py-px text-[9px] text-violet-200">
              Custom
            </span>
          ) : null}
        </p>
        {item.parentLabel ? (
          <p className="truncate text-[9px] text-white/35">{item.parentLabel}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onToggleNavHidden(item.id)}
        className="rounded border border-white/10 p-0.5 text-white/50 hover:bg-white/5 hover:text-white"
        aria-label={hidden ? "Show item" : "Hide item"}
      >
        {hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
      </button>
    </li>
  );
}

function DragPreview({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-violet-400/35 bg-[#0b1524] px-3 py-2 shadow-lg">
      <GripVertical className="h-3.5 w-3.5 text-white/50" />
      <p className="truncate text-xs font-semibold uppercase tracking-[0.06em] text-white/90">{title}</p>
    </div>
  );
}

export function SettingsSidebarReorderPanel({
  orderedSections,
  navCustom,
  expandedModules,
  customNavLabel,
  onCustomNavLabelChange,
  onPersistNavCustom,
  onToggleModuleExpanded,
  onToggleNavHidden,
  onAddCustomNavItem,
  inputClassName,
}: SettingsSidebarReorderPanelProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const pinSections = useMemo(
    () => orderedSections.filter((section) => section.kind === "pin" || isFixedPinSection(section)),
    [orderedSections],
  );
  const movableSections = useMemo(
    () => orderedSections.filter(isMovableWorkspaceSection),
    [orderedSections],
  );
  const settingsSection = useMemo(
    () => orderedSections.find(isSettingsSection) ?? null,
    [orderedSections],
  );
  const movableKeys = useMemo(
    () => movableSections.map(getNavSectionKey),
    [movableSections],
  );

  const activeTitle = useMemo(() => {
    if (!activeKey) return "";
    const section = movableSections.find((row) => getNavSectionKey(row) === activeKey);
    return section ? getNavSectionTitle(section) : "";
  }, [activeKey, movableSections]);

  function applyMovableOrder(nextKeys: string[]) {
    const lockedHost =
      isTalantonLockedSectionBundle(orderedSections) ||
      isOnwardAirLockedSectionBundle(orderedSections);
    onPersistNavCustom({
      ...navCustom,
      customized: true,
      version: isTalantonLockedSectionBundle(orderedSections)
        ? TALANTON_SIDEBAR_FACTORY_REVISION
        : lockedHost
          ? 6
          : navCustom.version,
      sectionOrder: nextKeys,
    });
  }

  function moveModule(sectionKey: string, direction: -1 | 1) {
    const index = movableKeys.indexOf(sectionKey);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= movableKeys.length) return;
    const next = [...movableKeys];
    [next[index], next[target]] = [next[target]!, next[index]!];
    applyMovableOrder(next);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveKey(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveKey(null);
    const { active, over } = event;
    if (!over) return;
    const next = reorderSectionKeys(movableKeys, String(active.id), String(over.id));
    if (next) applyMovableOrder(next);
  }

  function handleDragCancel() {
    setActiveKey(null);
  }

  return (
    <>
      <p className="mb-3 text-[10px] leading-relaxed text-white/40">
        Home and Executive Assistant stay at the top; Settings stays at the bottom. Drag the grip
        handle or use the arrows to reorder everything in between.
      </p>

      {pinSections.length > 0 ? (
        <div className="mb-3">
          <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/35">
            Fixed at top
          </p>
          <ul className="space-y-1.5">
            {pinSections.map((section) => {
              const sectionKey = getNavSectionKey(section);
              return (
                <FixedModuleRow
                  key={sectionKey}
                  section={section}
                  expanded={Boolean(expandedModules[sectionKey])}
                  navCustom={navCustom}
                  onToggleExpanded={() => onToggleModuleExpanded(sectionKey)}
                  onToggleNavHidden={onToggleNavHidden}
                />
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="mb-3">
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-violet-300/70">
          Reorder modules
        </p>
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <ul className="space-y-1.5">
            {movableSections.map((section) => {
              const sectionKey = getNavSectionKey(section);
              return (
                <DraggableModuleRow
                  key={sectionKey}
                  section={section}
                  movableKeys={movableKeys}
                  expanded={Boolean(expandedModules[sectionKey])}
                  navCustom={navCustom}
                  onToggleExpanded={() => onToggleModuleExpanded(sectionKey)}
                  onMove={(direction) => moveModule(sectionKey, direction)}
                  onToggleNavHidden={onToggleNavHidden}
                />
              );
            })}
          </ul>
          <DragOverlay dropAnimation={null}>
            {activeKey ? <DragPreview title={activeTitle} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {settingsSection ? (
        <div className="mb-3">
          <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/35">
            Fixed at bottom
          </p>
          <ul className="space-y-1.5">
            <FixedModuleRow
              section={settingsSection}
              expanded={Boolean(expandedModules[getNavSectionKey(settingsSection)])}
              navCustom={navCustom}
              onToggleExpanded={() => onToggleModuleExpanded(getNavSectionKey(settingsSection))}
              onToggleNavHidden={onToggleNavHidden}
            />
          </ul>
        </div>
      ) : null}

      <div className="space-y-2 border-t border-white/10 pt-3">
        <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
          Add custom item
        </label>
        <div className="flex gap-2">
          <input
            value={customNavLabel}
            onChange={(event) => onCustomNavLabelChange(event.target.value)}
            placeholder="Menu label"
            className={cn(inputClassName, "mt-0 min-w-0 flex-1")}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onAddCustomNavItem();
              }
            }}
          />
          <button
            type="button"
            onClick={onAddCustomNavItem}
            disabled={!customNavLabel.trim()}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-violet-400/35 bg-violet-500/15 px-2.5 py-2 text-xs font-semibold text-violet-200 hover:bg-violet-500/25 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
        <p className="text-[10px] text-white/35">
          Module order saves to <code className="text-white/50">{sidebarNavCustomStorageKey()}</code>{" "}
          and updates the main left nav immediately.
        </p>
      </div>
    </>
  );
}
