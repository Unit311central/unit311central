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
import {
  MODULE_REVIEW_COL_GAP,
  MODULE_REVIEW_ITEM_LABEL,
  MODULE_REVIEW_ITEM_ROW,
  MODULE_REVIEW_MOCK_CHECKBOX,
  MODULE_REVIEW_ROW_GAP,
  MODULE_REVIEW_TILE_BODY,
  MODULE_REVIEW_TILE_HEADER,
} from "@/lib/module-review-tile-styles";

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
        className={MODULE_REVIEW_TILE_HEADER}
        style={{ background: moduleReviewAlternatingHeader(columnIndex) }}
      >
        {column.title}
      </div>
      <div className={MODULE_REVIEW_TILE_BODY}>
        {column.items
          .filter((entry) => entry.kind === "item")
          .map((entry) => (
            <label
              key={bookFocusItemKey(column.title, entry.label)}
              className={MODULE_REVIEW_ITEM_ROW}
            >
              <span className={MODULE_REVIEW_MOCK_CHECKBOX} aria-hidden />
              <span className={MODULE_REVIEW_ITEM_LABEL}>{entry.label}</span>
            </label>
          ))}
      </div>
    </div>
  );
}

export default function ModuleReviewGridMockup() {
  return (
    <div data-module-review-mockup className="w-full min-w-0 max-w-full">
      <div className={MODULE_REVIEW_ROW_GAP}>
        {MOCKUP_ROWS.map((row, rowIndex) => (
          <div key={`mock-row-${rowIndex}`} className={`grid w-full grid-cols-7 ${MODULE_REVIEW_COL_GAP}`}>
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
