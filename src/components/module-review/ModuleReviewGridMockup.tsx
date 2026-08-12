"use client";

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

const MOCKUP_ROWS: readonly (readonly BookFocusGridColumn[])[] = (() => {
  const all: BookFocusGridColumn[] = [
    BOOK_FOCUS_GRID_ROW_1[0],
    MODULE_REVIEW_EXECUTIVE_ASSISTANT_COLUMN,
    ...BOOK_FOCUS_GRID_ROW_1.slice(1),
    ...BOOK_FOCUS_GRID_ROW_2,
  ];
  return [all.slice(0, 7), all.slice(7, 14), all.slice(14, 21)];
})();

function MockTile({ column, columnIndex }: { column: BookFocusGridColumn; columnIndex: number }) {
  return (
    <div
      className="min-w-0 rounded border border-slate-400/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_1px_6px_rgba(15,23,42,0.12)]"
      style={MODULE_REVIEW_TILE_SURFACE}
    >
      <div
        className="border-b border-white/25 px-1 py-1 text-left text-[7.5px] font-semibold uppercase leading-[1.1] tracking-wide text-white sm:text-[8.5px]"
        style={{ background: moduleReviewAlternatingHeader(columnIndex) }}
      >
        {column.title}
      </div>
      <div className="space-y-0.5 p-0.5">
        {column.items
          .filter((entry) => entry.kind === "item")
          .map((entry) => (
            <label
              key={bookFocusItemKey(column.title, entry.label)}
              className="flex items-center gap-0.5 px-0.5 py-0.5 text-left"
            >
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded border border-slate-400/80 bg-white"
                aria-hidden
              />
              <span className="truncate text-[6.5px] leading-none text-slate-700 sm:text-[7px]">
                {entry.label}
              </span>
            </label>
          ))}
      </div>
    </div>
  );
}

export default function ModuleReviewGridMockup() {
  return (
    <div data-module-review-mockup className="w-full min-w-0 max-w-full">
      <div className="space-y-4 sm:space-y-5">
        {MOCKUP_ROWS.map((row, rowIndex) => (
          <div key={`mock-row-${rowIndex}`} className="grid w-full grid-cols-7 gap-1 sm:gap-1.5 lg:gap-2">
            {row.map((column, columnIndex) => (
              <MockTile
                key={column.title}
                column={column}
                columnIndex={rowIndex * 7 + columnIndex}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
