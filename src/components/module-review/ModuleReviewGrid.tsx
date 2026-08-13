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
import {
  MODULE_REVIEW_COL_GAP,
  MODULE_REVIEW_ITEM_CHECKBOX,
  MODULE_REVIEW_ITEM_LABEL,
  MODULE_REVIEW_ITEM_ROW,
  MODULE_REVIEW_ROW_GAP,
  MODULE_REVIEW_TILE_BODY,
  MODULE_REVIEW_TILE_HEADER,
} from "@/lib/module-review-tile-styles";

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
    <label htmlFor={id} className={MODULE_REVIEW_ITEM_ROW}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className={MODULE_REVIEW_ITEM_CHECKBOX}
      />
      <span className={MODULE_REVIEW_ITEM_LABEL}>{label}</span>
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
        className={MODULE_REVIEW_TILE_HEADER}
        style={{ background: moduleReviewAlternatingHeader(columnIndex) }}
      >
        {column.title}
      </div>
      <div className={MODULE_REVIEW_TILE_BODY}>
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
    <div className={`grid w-full min-w-0 grid-cols-7 ${MODULE_REVIEW_COL_GAP}`}>{children}</div>
  );
}

export default function ModuleReviewGrid({ selections, onToggle }: ModuleReviewGridProps) {
  return (
    <div data-module-review-grid className="w-full min-w-0 max-w-full">
      <div className={MODULE_REVIEW_ROW_GAP}>
        {MODULE_REVIEW_ROWS.map((row, rowIndex) => (
          <ModuleReviewRow key={`row-${rowIndex}`}>
            {row.map((column, columnIndex) => {
              const globalIndex = rowIndex * 7 + columnIndex;
              return (
                <ModuleColumn
                  key={column.title}
                  column={column}
                  columnIndex={globalIndex}
                  selections={selections}
                  onToggle={onToggle}
                  idPrefix={
                    column.title === "EXECUTIVE ASSISTANT" ? "module-review-ea" : "module-review"
                  }
                />
              );
            })}
          </ModuleReviewRow>
        ))}
      </div>
    </div>
  );
}
