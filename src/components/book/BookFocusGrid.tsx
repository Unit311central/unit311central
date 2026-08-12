"use client";

import {
  BOOK_FOCUS_GRID_ROWS,
  MODULE_REVIEW_EXECUTIVE_ASSISTANT_COLUMN,
  bookFocusItemKey,
} from "@/lib/book-focus-grid-data";

type BookFocusGridProps = {
  selections: Record<string, boolean>;
  onToggle: (key: string, checked: boolean) => void;
};

const COLUMN_HEADER_CLASS =
  "border-b border-[#0b2d63]/20 bg-[#0b2d63] px-2 py-1.5 text-left text-[9px] font-semibold uppercase leading-tight tracking-wide text-white";

function FocusCheckbox({
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
      className="flex cursor-pointer items-center gap-1.5 rounded px-0.5 py-0.5 text-left transition-colors hover:bg-white/50"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3.5 w-3.5 shrink-0 rounded border-[#94a3b8] text-[#2563eb] focus:ring-[#2563eb]"
      />
      <span className="whitespace-nowrap text-[9px] leading-none text-[#1a2b4a]/90">{label}</span>
    </label>
  );
}

function FocusColumn({
  column,
  columnIndex,
  selections,
  onToggle,
}: {
  column: import("@/lib/book-focus-grid-data").BookFocusGridColumn;
  columnIndex: number;
  selections: Record<string, boolean>;
  onToggle: (key: string, checked: boolean) => void;
}) {
  return (
    <div className="min-w-[108px] shrink-0 rounded border border-[#dbe4f0] bg-white/90">
      <div className={COLUMN_HEADER_CLASS}>{column.title}</div>
      <div className="space-y-0.5 p-1">
        {column.items.map((entry, entryIndex) => {
          if (entry.kind === "subheader") {
            return null;
          }

          const key = bookFocusItemKey(column.title, entry.label);
          return (
            <FocusCheckbox
              key={key}
              id={`focus-${columnIndex}-${entryIndex}`}
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

export default function BookFocusGrid({ selections, onToggle }: BookFocusGridProps) {
  const allColumns = [
    BOOK_FOCUS_GRID_ROWS[0][0],
    MODULE_REVIEW_EXECUTIVE_ASSISTANT_COLUMN,
    ...BOOK_FOCUS_GRID_ROWS[0].slice(1),
    ...BOOK_FOCUS_GRID_ROWS[1],
  ];
  const rows = [allColumns.slice(0, 7), allColumns.slice(7, 14), allColumns.slice(14, 21)];

  return (
    <div className="overflow-x-auto" data-book-focus-grid>
      <div className="min-w-[1180px] space-y-3">
        {rows.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex gap-2">
            {row.map((column, columnIndex) => (
              <FocusColumn
                key={column.title}
                column={column}
                columnIndex={rowIndex * 7 + columnIndex}
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
