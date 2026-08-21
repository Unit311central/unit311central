"use client";

import { useMemo, useState, type ReactNode } from "react";
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
import { isAbhiLockedSectionBundle, ABHI_SIDEBAR_FACTORY_REVISION } from "@/lib/abhi-nav-order";
import { isOnwardAirLockedSectionBundle } from "@/lib/onwardair-nav-order";
import { isTalantonLockedSectionBundle, TALANTON_SIDEBAR_FACTORY_REVISION } from "@/lib/talanton-nav-order";
import {
  getNavSectionKey,
  getNavSectionTitle,
  isFixedPinSection,
  isMovableWorkspaceSection,
  isSettingsSection,
  listSectionLeafItems,
  moveSectionKey,
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

const sidebarReorderCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args).filter(({ id }) => id !== args.active.id);
  if (pointerHits.length > 0) return pointerHits;
  return closestCenter(args).filter(({ id }) => id !== args.active.id);
};

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
    <li className="overflow-hidden rounded-lg border border-white/10 bg-[#0b1524]/70 2xl:rounded-xl">
      <ModuleRowChrome
        section={section}
        title={title}
        trailing={
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wide text-white/40 2xl:text-[9px]"
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
  index,
  lastIndex,
  expanded,
  navCustom,
  onToggleExpanded,
  onToggleNavHidden,
  onMoveUp,
  onMoveDown,
}: {
  section: InternalNavSection;
  index: number;
  lastIndex: number;
  expanded: boolean;
  navCustom: SidebarNavCustomStorage;
  onToggleExpanded: () => void;
  onToggleNavHidden: (itemId: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const sectionKey = getNavSectionKey(section);
  const title = getNavSectionTitle(section);
  const leaves = listSectionLeafItems(section);
  const canMoveUp = index > 0;
  const canMoveDown = index < lastIndex;

  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: sectionKey,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: sectionKey,
  });

  return (
    <li
      ref={setDragRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition: isDragging ? undefined : "transform 180ms ease",
      }}
      className={cn(
        "overflow-hidden rounded-lg border bg-[#0b1524]/70 2xl:rounded-xl",
        isDragging ? "border-violet-400/40 opacity-60" : "border-white/10",
        isOver && !isDragging && "border-violet-400/35 ring-1 ring-violet-400/20",
      )}
    >
      <ModuleRowChrome
        section={section}
        title={title}
        dropRef={setDropRef}
        leading={
          <button
            type="button"
            className="cursor-grab touch-none rounded border border-white/10 p-0.5 text-white/45 hover:bg-white/5 hover:text-white active:cursor-grabbing 2xl:p-1"
            aria-label={`Drag to reorder ${title}`}
            {...listeners}
            {...attributes}
          >
            <GripVertical className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" />
          </button>
        }
        trailing={
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="rounded border border-white/10 p-0.5 text-white/55 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 2xl:p-1"
              aria-label={`Move ${title} up`}
            >
              <ChevronUp className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="rounded border border-white/10 p-0.5 text-white/55 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 2xl:p-1"
              aria-label={`Move ${title} down`}
            >
              <ChevronDown className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" />
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
  dropRef,
  children,
}: {
  section: InternalNavSection;
  title: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  expanded: boolean;
  onToggleExpanded: () => void;
  dropRef?: (node: HTMLElement | null) => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-stretch">
      <span className="w-1 shrink-0 self-stretch" style={{ background: sectionAccent(section) }} aria-hidden />
      <div className="min-w-0 flex-1">
        <div
          ref={dropRef}
          className="flex items-center gap-1 px-2 py-1.5 2xl:gap-1.5 2xl:px-2.5 2xl:py-2"
        >
          {leading ?? <span className="w-[22px] shrink-0 2xl:w-[26px]" aria-hidden />}
          <p className="min-w-0 flex-1 truncate text-[10px] font-semibold uppercase tracking-[0.05em] text-white/90 2xl:text-xs 2xl:tracking-[0.06em]">
            {title}
          </p>
          {trailing}
          <button
            type="button"
            onClick={onToggleExpanded}
            className="rounded border border-white/10 p-0.5 text-white/55 hover:bg-white/5 hover:text-white 2xl:p-1"
            aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`}
            aria-expanded={expanded}
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" />
            ) : (
              <ChevronRight className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" />
            )}
          </button>
        </div>
        {expanded ? <div className="px-2 pb-1.5 2xl:px-2.5 2xl:pb-2">{children}</div> : null}
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
    <ul className="space-y-1 border-t border-white/10 pt-1.5 2xl:pt-2">
      {leaves.length === 0 && customLeaves.length === 0 ? (
        <li className="px-1 py-0.5 text-[9px] text-white/35 2xl:py-1 2xl:text-[10px]">No sub-modules</li>
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
        "flex items-center gap-1.5 rounded-md border px-1.5 py-1 2xl:gap-2 2xl:rounded-lg 2xl:px-2 2xl:py-1.5",
        custom
          ? "border-violet-400/20 bg-violet-500/5"
          : "border-white/8 bg-white/[0.02]",
        hidden && "opacity-45",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] text-white/85 2xl:text-[11px]">
          {item.label}
          {custom ? (
            <span className="ml-1 rounded-full border border-violet-400/30 bg-violet-500/10 px-1 py-px text-[8px] text-violet-200 2xl:ml-1.5 2xl:text-[9px]">
              Custom
            </span>
          ) : null}
        </p>
        {item.parentLabel ? (
          <p className="truncate text-[8px] text-white/35 2xl:text-[9px]">{item.parentLabel}</p>
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
    <div className="flex items-center gap-1.5 rounded-lg border border-violet-400/35 bg-[#0b1524] px-2.5 py-1.5 shadow-lg 2xl:gap-2 2xl:rounded-xl 2xl:px-3 2xl:py-2">
      <GripVertical className="h-3 w-3 text-white/50 2xl:h-3.5 2xl:w-3.5" />
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.05em] text-white/90 2xl:text-xs 2xl:tracking-[0.06em]">
        {title}
      </p>
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
      activationConstraint: { distance: 4 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 4 },
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
  const lastMovableIndex = movableSections.length - 1;

  const activeTitle = useMemo(() => {
    if (!activeKey) return "";
    const section = movableSections.find((row) => getNavSectionKey(row) === activeKey);
    return section ? getNavSectionTitle(section) : "";
  }, [activeKey, movableSections]);

  function applyMovableOrder(nextKeys: string[]) {
    const lockedHost =
      isTalantonLockedSectionBundle(orderedSections) ||
      isOnwardAirLockedSectionBundle(orderedSections) ||
      isAbhiLockedSectionBundle(orderedSections);
    onPersistNavCustom({
      ...navCustom,
      customized: true,
      version: isTalantonLockedSectionBundle(orderedSections)
        ? TALANTON_SIDEBAR_FACTORY_REVISION
        : isAbhiLockedSectionBundle(orderedSections)
          ? ABHI_SIDEBAR_FACTORY_REVISION
          : lockedHost
            ? 6
            : navCustom.version,
      sectionOrder: nextKeys,
    });
  }

  function moveMovableSection(sectionKey: string, direction: "up" | "down") {
    const next = moveSectionKey(movableKeys, sectionKey, direction);
    if (next) applyMovableOrder(next);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveKey(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveKey(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const next = reorderSectionKeys(movableKeys, String(active.id), String(over.id));
    if (next) applyMovableOrder(next);
  }

  function handleDragCancel() {
    setActiveKey(null);
  }

  return (
    <>
      <p className="mb-2 text-[9px] leading-snug text-white/40 2xl:mb-3 2xl:text-[10px] 2xl:leading-relaxed">
        Home and Executive Assistant stay at the top; Settings stays at the bottom. Drag the{" "}
        <span className="text-white/55">⠿ grip</span> or use the arrow buttons to reorder — the same
        order applies across the whole workspace shell.
      </p>

      {pinSections.length > 0 ? (
        <div className="mb-2 2xl:mb-3">
          <p className="mb-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/35 2xl:mb-1.5 2xl:text-[9px] 2xl:tracking-[0.14em]">
            Fixed at top
          </p>
          <ul className="space-y-1 2xl:space-y-1.5">
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

      <div className="mb-2 2xl:mb-3">
        <p className="mb-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-violet-300/70 2xl:mb-1.5 2xl:text-[9px] 2xl:tracking-[0.14em]">
          Reorder modules
        </p>
        <DndContext
          sensors={sensors}
          collisionDetection={sidebarReorderCollisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <ul className="space-y-1 2xl:space-y-1.5">
            {movableSections.map((section, index) => {
              const sectionKey = getNavSectionKey(section);
              return (
                <DraggableModuleRow
                  key={sectionKey}
                  section={section}
                  index={index}
                  lastIndex={lastMovableIndex}
                  expanded={Boolean(expandedModules[sectionKey])}
                  navCustom={navCustom}
                  onToggleExpanded={() => onToggleModuleExpanded(sectionKey)}
                  onToggleNavHidden={onToggleNavHidden}
                  onMoveUp={() => moveMovableSection(sectionKey, "up")}
                  onMoveDown={() => moveMovableSection(sectionKey, "down")}
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
        <div className="mb-2 2xl:mb-3">
          <p className="mb-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/35 2xl:mb-1.5 2xl:text-[9px] 2xl:tracking-[0.14em]">
            Fixed at bottom
          </p>
          <ul className="space-y-1 2xl:space-y-1.5">
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

      <div className="space-y-1.5 border-t border-white/10 pt-2 2xl:space-y-2 2xl:pt-3">
        <label className="text-[9px] font-medium uppercase tracking-[0.1em] text-white/45 2xl:text-[10px] 2xl:tracking-[0.12em]">
          Add custom item
        </label>
        <div className="flex gap-1.5 2xl:gap-2">
          <input
            value={customNavLabel}
            onChange={(event) => onCustomNavLabelChange(event.target.value)}
            placeholder="Menu label"
            className={cn(inputClassName, "mt-0 min-w-0 flex-1 text-xs 2xl:text-sm")}
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
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-violet-400/35 bg-violet-500/15 px-2 py-1.5 text-[11px] font-semibold text-violet-200 hover:bg-violet-500/25 disabled:opacity-50 2xl:px-2.5 2xl:py-2 2xl:text-xs"
          >
            <Plus className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" />
            Add
          </button>
        </div>
        <p className="text-[9px] text-white/35 2xl:text-[10px]">
          Module order saves to <code className="text-white/50">{sidebarNavCustomStorageKey()}</code>{" "}
          and updates the main left nav immediately.
        </p>
      </div>
    </>
  );
}
