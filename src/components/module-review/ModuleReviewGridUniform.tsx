"use client";

import {
  BOOK_FOCUS_GRID_ROWS,
  type BookFocusGridColumn,
  bookFocusItemKey,
} from "@/lib/book-focus-grid-data";

type ModuleReviewGridUniformProps = {
  selections: Record<string, boolean>;
  onToggle: (key: string, checked: boolean) => void;
};

const COLUMN_HEADER_STYLE = {
  background: "linear-gradient(135deg, #0b2d63 0%, #1e4a8a 52%, #3b82f6 100%)",
};

const SUBHEADER_CLASS =
  "mt-1.5 rounded border border-[#2563eb]/30 bg-gradient-to-r from-[#eff6ff] to-[#dbeafe] px-1.5 py-1 text-left text-[8px] font-bold uppercase leading-tight tracking-wide text-[#1d4ed8]";

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
      className="flex cursor-pointer items-center gap-1.5 rounded px-0.5 py-0.5 text-left transition-colors hover:bg-slate-50"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]"
      />
      <span className="whitespace-nowrap text-[8px] leading-none text-slate-700">{label}</span>
    </label>
  );
}

function ModuleColumn({
  column,
  columnIndex,
  selections,
  onToggle,
}: {
  column: BookFocusGridColumn;
  columnIndex: number;
  selections: Record<string, boolean>;
  onToggle: (key: string, checked: boolean) => void;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <div
        className="border-b border-white/15 px-1.5 py-1.5 text-left text-[8px] font-semibold uppercase leading-tight tracking-wide text-white"
        style={COLUMN_HEADER_STYLE}
      >
        {column.title}
      </div>
      <div className="space-y-0.5 p-1">
        {column.items.map((entry, entryIndex) => {
          if (entry.kind === "subheader") {
            return (
              <div key={`${column.title}-sub-${entryIndex}`} className={SUBHEADER_CLASS}>
                {entry.label}
              </div>
            );
          }

          const key = bookFocusItemKey(column.title, entry.label);
          return (
            <ModuleCheckbox
              key={key}
              id={`module-review-${columnIndex}-${entryIndex}`}
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

/** Snapshot of the uniform-blue header grid (pre per-module accent colours). */
export default function ModuleReviewGridUniform({
  selections,
  onToggle,
}: ModuleReviewGridUniformProps) {
  return (
    <div data-module-review-grid className="w-full">
      <div className="space-y-2">
        {BOOK_FOCUS_GRID_ROWS.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="grid w-full grid-cols-10 gap-1.5">
            {row.map((column, columnIndex) => (
              <ModuleColumn
                key={column.title}
                column={column}
                columnIndex={rowIndex * 10 + columnIndex}
                selections={selections}
                onToggle={onToggle}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
