"use client";

import { useMemo, useState } from "react";
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

import type { LessonContent, LmsLesson } from "@/lib/lms/types";

type DragContent = Extract<LessonContent, { type: "drag_drop" }>;

type Props = {
  lesson: LmsLesson;
  content: DragContent;
  onComplete: () => void;
};

const ZONE_STYLES = [
  "border-emerald-400/50 bg-emerald-500/10",
  "border-amber-400/50 bg-amber-500/10",
  "border-rose-400/50 bg-rose-500/10",
  "border-sky-400/50 bg-sky-500/10",
];

function DraggableItem({
  id,
  label,
  disabled,
}: {
  id: string;
  label: string;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-lg border border-white/15 bg-[#0d1b2e] px-3 py-2 text-sm text-white shadow-sm active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      } ${disabled ? "cursor-default opacity-60" : ""}`}
    >
      {label}
    </div>
  );
}

function DropZone({
  id,
  label,
  hint,
  styleClass,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  styleClass: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[140px] rounded-2xl border-2 border-dashed p-3 transition ${styleClass} ${
        isOver ? "ring-2 ring-white/30" : ""
      }`}
    >
      <p className="text-sm font-semibold text-white">{label}</p>
      {hint ? <p className="mt-0.5 text-xs text-white/50">{hint}</p> : null}
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

export default function DragDropLesson({ lesson, content, onComplete }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const unplaced = content.items.filter((item) => !placements[item.id]);
  const allPlaced = content.items.every((item) => placements[item.id]);
  const allCorrect =
    checked &&
    content.items.every((item) => placements[item.id] === item.correctZoneId);

  const activeItem = useMemo(
    () => content.items.find((i) => i.id === activeId) ?? null,
    [activeId, content.items],
  );

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const itemId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId) return;
    if (content.zones.some((z) => z.id === overId)) {
      setPlacements((prev) => ({ ...prev, [itemId]: overId }));
      setChecked(false);
    }
  }

  function checkAnswers() {
    setChecked(true);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
          Drag & drop
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{lesson.title}</h2>
        <p className="mt-2 text-sm text-white/65">{content.prompt}</p>
      </header>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">
            Items
          </p>
          <div className="flex flex-wrap gap-2">
            {unplaced.map((item) => (
              <DraggableItem key={item.id} id={item.id} label={item.label} />
            ))}
            {unplaced.length === 0 ? (
              <p className="text-xs text-white/40">All items placed — drag between zones to adjust.</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {content.zones.map((zone, index) => (
            <DropZone
              key={zone.id}
              id={zone.id}
              label={zone.label}
              hint={zone.hint}
              styleClass={ZONE_STYLES[index % ZONE_STYLES.length]!}
            >
              {content.items
                .filter((item) => placements[item.id] === zone.id)
                .map((item) => {
                  const wrong =
                    checked && placements[item.id] !== item.correctZoneId;
                  const right =
                    checked && placements[item.id] === item.correctZoneId;
                  return (
                    <div
                      key={item.id}
                      className={
                        wrong
                          ? "rounded-lg border border-rose-400/50 bg-rose-500/20"
                          : right
                            ? "rounded-lg border border-emerald-400/50 bg-emerald-500/20"
                            : ""
                      }
                    >
                      <DraggableItem id={item.id} label={item.label} />
                    </div>
                  );
                })}
            </DropZone>
          ))}
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="rounded-lg border border-emerald-400/40 bg-[#0d1b2e] px-3 py-2 text-sm text-white shadow-xl">
              {activeItem.label}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={checkAnswers}
          disabled={!allPlaced}
          className="rounded-lg border border-white/15 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.08] disabled:opacity-40"
        >
          Check placement
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={!allCorrect}
          className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue
        </button>
        {checked && !allCorrect ? (
          <p className="self-center text-xs text-amber-200/80">
            Some items are in the wrong zone — try again.
          </p>
        ) : null}
      </div>
    </div>
  );
}
