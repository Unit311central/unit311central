"use client";

import type { ReactNode } from "react";

import {
  BOOK_FOCUS_GRID_ROW_1,
  BOOK_FOCUS_GRID_ROW_2,
  MODULE_REVIEW_EXECUTIVE_ASSISTANT_COLUMN,
  type BookFocusGridColumn,
  bookFocusItemKey,
} from "@/lib/book-focus-grid-data";
import {
  MODULE_REVIEW_TILE_SURFACE,
  moduleReviewAlternatingHeader,
} from "@/lib/module-review-accents";

type ModuleReviewGridProps = {
  selections: Record<string, boolean>;
  onToggle: (key: string, checked: boolean) => void;
};

const MODULE_REVIEW_ROWS: readonly (readonly BookFocusGridColumn[])[] = (() => {
  const all: BookFocusGridColumn[] = [
    BOOK_FOCUS_GRID_ROW_1[0],
    MODULE_REVIEW_EXECUTIVE_ASSISTANT_COLUMN,
    ...BOOK_FOCUS_GRID_ROW_1.slice(1),
    ...BOOK_FOCUS_GRID_ROW_2,
  ];
  return [all.slice(0, 7), all.slice(7, 14), all.slice(14, 21)];
})();

function ModuleCheckbox({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-0.5 rounded px-0.5 py-0.5 text-left transition-colors hover:bg-white/45 sm:gap-1"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-2.5 w-2.5 shrink-0 rounded border-slate-400/80 text-[#2563eb] focus:ring-[#2563eb] sm:h-3 sm:w-3"
      />
      <span className="min-w-0 truncate text-[6.5px] leading-none text-slate-700 sm:text-[7px] lg:text-[7.5px]">
        {label}
      </span>
    </label>
  );
}

function ModuleColumn({
  column,
  columnIndex,
  selections,
  onToggle,
  idPrefix = "module-review",
}: {
  column: BookFocusGridColumn;
  columnIndex: number;
  selections: Record<string, boolean>;
  onToggle: (key: string, checked: boolean) => void;
  idPrefix?: string;
}) {
  return (
    <div
      className="min-w-0 rounded-md border border-slate-400/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_2px_8px_rgba(15,23,42,0.12)]"
      style={MODULE_REVIEW_TILE_SURFACE}
    >
      <div
        className="border-b border-white/25 px-1 py-1.5 text-left text-[8px] font-semibold uppercase leading-[1.1] tracking-wide text-white shadow-sm sm:px-1.5 sm:text-[9px] lg:text-[10px]"
        style={{ background: moduleReviewAlternatingHeader(columnIndex) }}
      >
        {column.title}
      </div>
      <div className="space-y-0.5 p-0.5 sm:p-1">
        {column.items.map((entry, entryIndex) => {
          if (entry.kind === "subheader") {
            return null;
          }

          const key = bookFocusItemKey(column.title, entry.label);
          return (
            <ModuleCheckbox
              key={key}
              id={`${idPrefix}-${columnIndex}-${entryIndex}`}
              label={entry.label}
              checked={selections[key] ?? false}
              onChange={(checked) => onToggle(key, checked)}
            />
          );
        })}
      </div>
    </div>
  );
}

function ModuleReviewRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid w-full min-w-0 grid-cols-7 gap-1 sm:gap-1.5 lg:gap-2">{children}</div>
  );
}

export default function ModuleReviewGrid({ selections, onToggle }: ModuleReviewGridProps) {
  return (
    <div data-module-review-grid className="w-full min-w-0 max-w-full">
      <div className="space-y-4 sm:space-y-5 lg:space-y-6">
        {MODULE_REVIEW_ROWS.map((row, rowIndex) => (
          <ModuleReviewRow key={`row-${rowIndex}`}>
            {row.map((column, columnIndex) => (
              <ModuleColumn
                key={column.title}
                column={column}
                columnIndex={rowIndex * 7 + columnIndex}
                selections={selections}
                onToggle={onToggle}
                idPrefix={column.title === "EXECUTIVE ASSISTANT" ? "module-review-ea" : "module-review"}
              />
            ))}
          </ModuleReviewRow>
        ))}
      </div>
    </div>
  );
}
