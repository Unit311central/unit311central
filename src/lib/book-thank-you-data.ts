import {
  BOOK_FOCUS_GRID_ROWS,
  MODULE_REVIEW_EXECUTIVE_ASSISTANT_COLUMN,
  bookFocusItemKey,
  getAllBookFocusItemKeys,
} from "@/lib/book-focus-grid-data";

export type BookThankYouSelections = {
  items: Record<string, boolean>;
};

export type LegacyBookThankYouSelections = {
  general: Record<string, boolean>;
  modules: Record<string, boolean>;
};

export function createEmptyBookThankYouSelections(): BookThankYouSelections {
  return {
    items: Object.fromEntries(getAllBookFocusItemKeys().map((key) => [key, false])),
  };
}

export function normalizeBookThankYouSelections(
  value: unknown,
): BookThankYouSelections | null {
  if (!value || typeof value !== "object") return null;
  const record = value as {
    items?: unknown;
    general?: unknown;
    modules?: unknown;
  };

  if (record.items && typeof record.items === "object") {
    return { items: record.items as Record<string, boolean> };
  }

  if (typeof record.general === "object" && typeof record.modules === "object") {
    const items: Record<string, boolean> = Object.fromEntries(
      getAllBookFocusItemKeys().map((key) => [key, false]),
    );
    const legacyGeneral = record.general as Record<string, boolean>;
    const legacyModules = record.modules as Record<string, boolean>;
    for (const [label, checked] of Object.entries(legacyGeneral)) {
      if (checked) items[`Legacy General::${label}`] = true;
    }
    for (const [label, checked] of Object.entries(legacyModules)) {
      if (checked) items[`Legacy Modules::${label}`] = true;
    }
    return { items };
  }

  return null;
}

export function getSelectedBookThankYouItems(selections: BookThankYouSelections) {
  const selectedKeys = Object.entries(selections.items)
    .filter(([, checked]) => checked)
    .map(([key]) => key);

  const byColumn: Record<string, string[]> = {};
  const allColumns = [
    ...BOOK_FOCUS_GRID_ROWS.flat(),
    MODULE_REVIEW_EXECUTIVE_ASSISTANT_COLUMN,
  ];
  for (const column of allColumns) {
    const selectedInColumn = column.items
      .filter((entry) => entry.kind === "item")
      .map((entry) => entry.label)
      .filter((label) => selections.items[bookFocusItemKey(column.title, label)]);
    if (selectedInColumn.length > 0) {
      byColumn[column.title] = selectedInColumn;
    }
  }

  const legacyKeys = selectedKeys.filter((key) => key.startsWith("Legacy "));
  return { byColumn, legacyKeys, totalSelected: selectedKeys.length };
}

export function formatBookThankYouSelectionsNotes(selections: BookThankYouSelections) {
  const { byColumn, legacyKeys, totalSelected } = getSelectedBookThankYouItems(selections);
  const lines = ["Pre-meeting focus areas submitted via /book:", ""];

  if (totalSelected === 0) {
    lines.push("(none selected)");
    return lines.join("\n");
  }

  for (const [columnTitle, items] of Object.entries(byColumn)) {
    lines.push(`${columnTitle}:`);
    items.forEach((item) => lines.push(`- ${item}`));
    lines.push("");
  }

  if (legacyKeys.length > 0) {
    lines.push("Legacy selections:");
    legacyKeys.forEach((key) => lines.push(`- ${key.replace(/^Legacy (General|Modules)::/, "")}`));
  }

  return lines.join("\n").trimEnd();
}

export const PRE_MEETING_FOCUS_PDF_FILE_ID_PREFIX = "Pre-meeting focus PDF file id:";

export function buildPreMeetingFocusPdfNote(fileId: string) {
  return `${PRE_MEETING_FOCUS_PDF_FILE_ID_PREFIX} ${fileId}`;
}

export function parsePreMeetingFocusPdfFileId(notes: string | null | undefined) {
  const match = notes?.match(
    /Pre-meeting focus PDF file id:\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  );
  return match?.[1] ?? null;
}
