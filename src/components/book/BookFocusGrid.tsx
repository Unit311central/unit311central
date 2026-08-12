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

const SUBHEADER_CLASS =
  "mt-1 rounded border border-[#2563eb]/25 bg-[#eff6ff] px-1.5 py-1 text-left text-[8px] font-bold uppercase leading-tight text-[#1d4ed8]";

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
            return (
              <div key={`${column.title}-sub-${entryIndex}`} className={SUBHEADER_CLASS}>
                {entry.label}
              </div>
            );
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
  const homeColumn = BOOK_FOCUS_GRID_ROWS[0][0];
  const row1Rest = BOOK_FOCUS_GRID_ROWS[0].slice(1);

  return (
    <div className="overflow-x-auto" data-book-focus-grid>
      <div className="min-w-[1180px] space-y-3">
        <div className="flex gap-2">
          <div className="flex shrink-0 flex-col gap-2">
            <FocusColumn
              column={homeColumn}
              columnIndex={0}
              selections={selections}
              onToggle={onToggle}
            />
            <FocusColumn
              column={MODULE_REVIEW_EXECUTIVE_ASSISTANT_COLUMN}
              columnIndex={0}
              selections={selections}
              onToggle={onToggle}
            />
          </div>
          {row1Rest.map((column, columnIndex) => (
            <FocusColumn
              key={column.title}
              column={column}
              columnIndex={columnIndex + 1}
              selections={selections}
              onToggle={onToggle}
            />
          ))}
        </div>
        <div className="flex gap-2">
          {BOOK_FOCUS_GRID_ROWS[1].map((column, columnIndex) => (
            <FocusColumn
              key={column.title}
              column={column}
              columnIndex={columnIndex}
              selections={selections}
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
