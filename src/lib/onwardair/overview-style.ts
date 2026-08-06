/**
 * Live style tokens for the OnwardAir /overview invite page.
 * Tuned in-browser via OverviewStyleTuner; paste the exported JSON back to Cursor to persist.
 */

export const OVERVIEW_STYLE_VERSION = 4 as const;

export const OVERVIEW_FONT_OPTIONS = [
  {
    id: "system",
    label: "System UI",
    stack: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
  {
    id: "geist",
    label: "Geist / App default",
    stack: 'var(--font-geist-sans, ui-sans-serif), system-ui, sans-serif',
  },
  {
    id: "serif",
    label: "Georgia serif",
    stack: 'Georgia, "Times New Roman", Times, serif',
  },
  {
    id: "mono",
    label: "UI Mono",
    stack: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  },
  {
    id: "rounded",
    label: "Rounded sans",
    stack: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
  },
] as const;

export type OverviewFontId = (typeof OVERVIEW_FONT_OPTIONS)[number]["id"];

export const OVERVIEW_LEFT_CARD_IDS = ["questions", "highlights", "agenda"] as const;
export type OverviewLeftCardId = (typeof OVERVIEW_LEFT_CARD_IDS)[number];

export const OVERVIEW_LEFT_CARD_LABELS: Record<OverviewLeftCardId, string> = {
  questions: "Questions",
  highlights: "Highlights",
  agenda: "Agenda",
};

/** Per-box chrome — size, border, shadow, visibility, relative height. */
export type OverviewCardChrome = {
  padding: number;
  radius: number;
  borderColor: string;
  borderOpacity: number;
  shadowOpacity: number;
  /** Minimum box height in px (0 = content-driven). */
  minHeight: number;
  /** Maximum box height in px (0 = no cap). */
  maxHeight: number;
  /** Relative row height in the left column (CSS fr / flex-grow weight). */
  heightFr: number;
  visible: boolean;
};

export type OverviewStyleConfig = {
  version: typeof OVERVIEW_STYLE_VERSION;
  accent: string;
  /** Render order of the three left-column boxes. */
  leftColumnOrder: OverviewLeftCardId[];
  page: {
    paddingX: number;
    paddingY: number;
    columnGap: number;
    leftColumnFr: number;
    /** Floor width for the left column in px (used in minmax). */
    leftColumnMinWidth: number;
    rightColumnFr: number;
    cardGap: number;
    heroImageOpacity: number;
    overlayOpacity: number;
  };
  typography: {
    fontFamily: OverviewFontId;
    headerFontSize: number;
    headerFontWeight: number;
    headerLetterSpacing: number;
    headerColor: string;
    headerOpacity: number;
    /** Where the header tagline sits relative to the logos. */
    taglinePlacement: "beside" | "below";
    /** Extra offset when dragging the tagline (px). */
    taglineOffsetX: number;
    taglineOffsetY: number;
  };
  logos: {
    oaHeight: number;
    oaMaxWidth: number;
    unit311Height: number;
    unit311MaxWidth: number;
  };
  /** Shared defaults still used as fallbacks; prefer per-box chrome. */
  cards: {
    padding: number;
    radius: number;
    borderOpacity: number;
  };
  questions: OverviewCardChrome & {
    bg: string;
    textSize: number;
    textColor: string;
    badgeSize: number;
    badgeColor: string;
    itemGap: number;
  };
  highlights: OverviewCardChrome & {
    bg: string;
    titleSize: number;
    titleColor: string;
    /** Space between title and first highlight. */
    titleGap: number;
    itemSize: number;
    itemColor: string;
    bulletColor: string;
    itemGap: number;
  };
  agenda: OverviewCardChrome & {
    bg: string;
    titleSize: number;
    titleColor: string;
    /** Space above the agenda title inside the card. */
    titleTopGap: number;
    /** Space between title and first agenda row. */
    titleGap: number;
    /** Space between agenda rows. */
    rowGap: number;
    rowPaddingX: number;
    rowPaddingY: number;
    rowRadius: number;
    rowBg: string;
    rowBorderColor: string;
    rowBorderOpacity: number;
    waveSize: number;
    waveColor: string;
    whoSize: number;
    whoColor: string;
    whySize: number;
    whyColor: string;
  };
  preview: {
    radius: number;
    minHeight: number;
    borderOpacity: number;
    borderColor: string;
    bg: string;
  };
};

function defaultChrome(partial?: Partial<OverviewCardChrome>): OverviewCardChrome {
  return {
    padding: 14,
    radius: 12,
    borderColor: "#267B90",
    borderOpacity: 0.22,
    shadowOpacity: 0.14,
    minHeight: 0,
    maxHeight: 0,
    heightFr: 1,
    visible: true,
    ...partial,
  };
}

/** Matches the tuned overview layout (user export applied). */
export function defaultOverviewStyleConfig(): OverviewStyleConfig {
  return {
    version: OVERVIEW_STYLE_VERSION,
    accent: "#267B90",
    leftColumnOrder: ["questions", "agenda", "highlights"],
    page: {
      paddingX: 16,
      paddingY: 12,
      columnGap: 14,
      leftColumnFr: 0.7,
      leftColumnMinWidth: 160,
      rightColumnFr: 2.45,
      cardGap: 16,
      heroImageOpacity: 0.42,
      overlayOpacity: 0.78,
    },
    typography: {
      fontFamily: "geist",
      headerFontSize: 20,
      headerFontWeight: 500,
      headerLetterSpacing: 0,
      headerColor: "#ffffff",
      headerOpacity: 0.85,
      taglinePlacement: "beside",
      taglineOffsetX: 0,
      taglineOffsetY: 0,
    },
    logos: {
      oaHeight: 44,
      oaMaxWidth: 187,
      unit311Height: 29,
      unit311MaxWidth: 114,
    },
    cards: {
      padding: 21,
      radius: 13,
      borderOpacity: 0.21,
    },
    questions: {
      ...defaultChrome({
        padding: 24,
        radius: 13,
        borderColor: "#267B90",
        borderOpacity: 0.2,
        shadowOpacity: 0.1,
        heightFr: 0.5,
        visible: true,
      }),
      bg: "rgba(11, 58, 74, 0.85)",
      textSize: 15,
      textColor: "rgba(255, 255, 255, 0.98)",
      badgeSize: 23,
      badgeColor: "#7DD3E8",
      itemGap: 8,
    },
    highlights: {
      ...defaultChrome({
        padding: 21,
        radius: 13,
        borderColor: "#267B90",
        borderOpacity: 0.21,
        shadowOpacity: 0.1,
        heightFr: 0.5,
        maxHeight: 268,
        visible: true,
      }),
      bg: "rgba(11, 58, 74, 0.85)",
      titleSize: 20,
      titleColor: "#7DD3E8",
      titleGap: 18,
      itemSize: 16,
      itemColor: "rgba(255, 255, 255, 0.95)",
      bulletColor: "#7DD3E8",
      itemGap: 6,
    },
    agenda: {
      ...defaultChrome({
        padding: 4,
        radius: 13,
        borderColor: "#267B90",
        borderOpacity: 0.21,
        shadowOpacity: 0.18,
        heightFr: 0.45,
        visible: true,
      }),
      bg: "#ffffff",
      titleSize: 17,
      titleColor: "#1B2430",
      titleTopGap: 22,
      titleGap: 15,
      rowGap: 2,
      rowPaddingX: 22,
      rowPaddingY: 10,
      rowRadius: 7,
      rowBg: "#F4FAFB",
      rowBorderColor: "#267B90",
      rowBorderOpacity: 0.2,
      waveSize: 13,
      waveColor: "#0F5C6E",
      whoSize: 10,
      whoColor: "#1B2430",
      whySize: 11,
      whyColor: "#3D4A5C",
    },
    preview: {
      radius: 12,
      minHeight: 420,
      borderOpacity: 0.1,
      borderColor: "#ffffff",
      bg: "#050B16",
    },
  };
}

export function overviewFontStack(id: OverviewFontId): string {
  return OVERVIEW_FONT_OPTIONS.find((f) => f.id === id)?.stack ?? OVERVIEW_FONT_OPTIONS[0].stack;
}

export function overviewCardBorder(opts: {
  borderColor: string;
  borderOpacity: number;
}): string {
  return `1px solid color-mix(in srgb, ${opts.borderColor} ${Math.round(opts.borderOpacity * 100)}%, transparent)`;
}

export function overviewCardShadow(opacity: number): string {
  return `0 8px 24px rgba(0,0,0,${opacity})`;
}

function asNumber(value: unknown, fallback: number, min?: number, max?: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  let out = n;
  if (min != null) out = Math.max(min, out);
  if (max != null) out = Math.min(max, out);
  return out;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asFontId(value: unknown, fallback: OverviewFontId): OverviewFontId {
  const id = typeof value === "string" ? value : "";
  return OVERVIEW_FONT_OPTIONS.some((f) => f.id === id) ? (id as OverviewFontId) : fallback;
}

function sanitizeChrome(
  raw: Partial<OverviewCardChrome> | undefined,
  fallback: OverviewCardChrome,
): OverviewCardChrome {
  const body = raw ?? {};
  return {
    padding: asNumber(body.padding, fallback.padding, 0, 48),
    radius: asNumber(body.radius, fallback.radius, 0, 40),
    borderColor: asString(body.borderColor, fallback.borderColor),
    borderOpacity: asNumber(body.borderOpacity, fallback.borderOpacity, 0, 1),
    shadowOpacity: asNumber(body.shadowOpacity, fallback.shadowOpacity, 0, 1),
    minHeight: asNumber(body.minHeight, fallback.minHeight, 0, 720),
    maxHeight: asNumber(body.maxHeight, fallback.maxHeight, 0, 720),
    heightFr: asNumber(body.heightFr, fallback.heightFr, 0.25, 4),
    visible: asBool(body.visible, fallback.visible),
  };
}

function sanitizeLeftColumnOrder(raw: unknown): OverviewLeftCardId[] {
  const d = defaultOverviewStyleConfig().leftColumnOrder;
  if (!Array.isArray(raw)) return d;
  const cleaned = raw.filter((id): id is OverviewLeftCardId =>
    OVERVIEW_LEFT_CARD_IDS.includes(id as OverviewLeftCardId),
  );
  const missing = OVERVIEW_LEFT_CARD_IDS.filter((id) => !cleaned.includes(id));
  return [...cleaned, ...missing];
}

/** Merge pasted / partial JSON onto defaults so Cursor can apply incomplete exports safely. */
export function sanitizeOverviewStyleConfig(raw: unknown): OverviewStyleConfig {
  const d = defaultOverviewStyleConfig();
  if (!raw || typeof raw !== "object") return d;
  const body = raw as Partial<OverviewStyleConfig> & { style?: Partial<OverviewStyleConfig> };
  // Accept either bare style object or tuner export `{ style, content }`.
  const root = (body.style && typeof body.style === "object" ? body.style : body) as Partial<OverviewStyleConfig>;
  const page = (root.page ?? {}) as Partial<OverviewStyleConfig["page"]>;
  const typography = (root.typography ?? {}) as Partial<OverviewStyleConfig["typography"]>;
  const logos = (root.logos ?? {}) as Partial<OverviewStyleConfig["logos"]>;
  const cards = (root.cards ?? {}) as Partial<OverviewStyleConfig["cards"]>;
  const questions = (root.questions ?? {}) as Partial<OverviewStyleConfig["questions"]>;
  const highlights = (root.highlights ?? {}) as Partial<OverviewStyleConfig["highlights"]>;
  const agenda = (root.agenda ?? {}) as Partial<OverviewStyleConfig["agenda"]>;
  const preview = (root.preview ?? {}) as Partial<OverviewStyleConfig["preview"]>;

  const qChrome = sanitizeChrome(questions, d.questions);
  const hChrome = sanitizeChrome(highlights, d.highlights);
  const aChrome = sanitizeChrome(agenda, d.agenda);

  return {
    version: OVERVIEW_STYLE_VERSION,
    accent: asString(root.accent, d.accent),
    leftColumnOrder: sanitizeLeftColumnOrder(root.leftColumnOrder),
    page: {
      paddingX: asNumber(page.paddingX, d.page.paddingX, 0, 64),
      paddingY: asNumber(page.paddingY, d.page.paddingY, 0, 64),
      columnGap: asNumber(page.columnGap, d.page.columnGap, 0, 48),
      leftColumnFr: asNumber(page.leftColumnFr, d.page.leftColumnFr, 0.3, 2),
      leftColumnMinWidth: asNumber(page.leftColumnMinWidth, d.page.leftColumnMinWidth, 100, 420),
      rightColumnFr: asNumber(page.rightColumnFr, d.page.rightColumnFr, 0.5, 4),
      cardGap: asNumber(page.cardGap, d.page.cardGap, 0, 48),
      heroImageOpacity: asNumber(page.heroImageOpacity, d.page.heroImageOpacity, 0, 1),
      overlayOpacity: asNumber(page.overlayOpacity, d.page.overlayOpacity, 0, 1),
    },
    typography: {
      fontFamily: asFontId(typography.fontFamily, d.typography.fontFamily),
      headerFontSize: asNumber(typography.headerFontSize, d.typography.headerFontSize, 8, 36),
      headerFontWeight: asNumber(typography.headerFontWeight, d.typography.headerFontWeight, 300, 800),
      headerLetterSpacing: asNumber(
        typography.headerLetterSpacing,
        d.typography.headerLetterSpacing,
        -1,
        4,
      ),
      headerColor: asString(typography.headerColor, d.typography.headerColor),
      headerOpacity: asNumber(typography.headerOpacity, d.typography.headerOpacity, 0, 1),
      taglinePlacement:
        typography.taglinePlacement === "beside" || typography.taglinePlacement === "below"
          ? typography.taglinePlacement
          : d.typography.taglinePlacement,
      taglineOffsetX: asNumber(typography.taglineOffsetX, d.typography.taglineOffsetX, -400, 800),
      taglineOffsetY: asNumber(typography.taglineOffsetY, d.typography.taglineOffsetY, -200, 400),
    },
    logos: {
      oaHeight: asNumber(logos.oaHeight, d.logos.oaHeight, 16, 80),
      oaMaxWidth: asNumber(logos.oaMaxWidth, d.logos.oaMaxWidth, 60, 320),
      unit311Height: asNumber(logos.unit311Height, d.logos.unit311Height, 10, 48),
      unit311MaxWidth: asNumber(logos.unit311MaxWidth, d.logos.unit311MaxWidth, 40, 200),
    },
    cards: {
      padding: asNumber(cards.padding, d.cards.padding, 4, 40),
      radius: asNumber(cards.radius, d.cards.radius, 0, 32),
      borderOpacity: asNumber(cards.borderOpacity, d.cards.borderOpacity, 0, 1),
    },
    questions: {
      ...qChrome,
      bg: asString(questions.bg, d.questions.bg),
      textSize: asNumber(questions.textSize, d.questions.textSize, 10, 24),
      textColor: asString(questions.textColor, d.questions.textColor),
      badgeSize: asNumber(questions.badgeSize, d.questions.badgeSize, 14, 36),
      badgeColor: asString(questions.badgeColor, d.questions.badgeColor),
      itemGap: asNumber(questions.itemGap, d.questions.itemGap, 0, 24),
    },
    highlights: {
      ...hChrome,
      bg: asString(highlights.bg, d.highlights.bg),
      titleSize: asNumber(highlights.titleSize, d.highlights.titleSize, 9, 22),
      titleColor: asString(highlights.titleColor, d.highlights.titleColor),
      titleGap: asNumber(highlights.titleGap, d.highlights.titleGap, 0, 48),
      itemSize: asNumber(highlights.itemSize, d.highlights.itemSize, 9, 22),
      itemColor: asString(highlights.itemColor, d.highlights.itemColor),
      bulletColor: asString(highlights.bulletColor, d.highlights.bulletColor),
      itemGap: asNumber(highlights.itemGap, d.highlights.itemGap, 0, 24),
    },
    agenda: {
      ...aChrome,
      bg: asString(agenda.bg, d.agenda.bg),
      titleSize: asNumber(agenda.titleSize, d.agenda.titleSize, 9, 22),
      titleColor: asString(agenda.titleColor, d.agenda.titleColor),
      titleTopGap: asNumber(agenda.titleTopGap, d.agenda.titleTopGap, 0, 80),
      titleGap: asNumber(agenda.titleGap, d.agenda.titleGap, 0, 80),
      rowGap: asNumber(agenda.rowGap, d.agenda.rowGap, 0, 24),
      rowPaddingX: asNumber(agenda.rowPaddingX, d.agenda.rowPaddingX, 0, 28),
      rowPaddingY: asNumber(agenda.rowPaddingY, d.agenda.rowPaddingY, 0, 24),
      rowRadius: asNumber(agenda.rowRadius, d.agenda.rowRadius, 0, 24),
      rowBg: asString(agenda.rowBg, d.agenda.rowBg),
      rowBorderColor: asString(agenda.rowBorderColor, d.agenda.rowBorderColor),
      rowBorderOpacity: asNumber(agenda.rowBorderOpacity, d.agenda.rowBorderOpacity, 0, 1),
      waveSize: asNumber(agenda.waveSize, d.agenda.waveSize, 8, 18),
      waveColor: asString(agenda.waveColor, d.agenda.waveColor),
      whoSize: asNumber(agenda.whoSize, d.agenda.whoSize, 8, 20),
      whoColor: asString(agenda.whoColor, d.agenda.whoColor),
      whySize: asNumber(agenda.whySize, d.agenda.whySize, 8, 18),
      whyColor: asString(agenda.whyColor, d.agenda.whyColor),
    },
    preview: {
      radius: asNumber(preview.radius, d.preview.radius, 0, 32),
      minHeight: asNumber(preview.minHeight, d.preview.minHeight, 200, 800),
      borderOpacity: asNumber(preview.borderOpacity, d.preview.borderOpacity, 0, 1),
      borderColor: asString(preview.borderColor, d.preview.borderColor),
      bg: asString(preview.bg, d.preview.bg),
    },
  };
}

export function overviewStyleConfigToClipboardJson(style: OverviewStyleConfig): string {
  return JSON.stringify(
    {
      _note: "OnwardAir overview style config — paste into Cursor to persist & deploy",
      ...style,
    },
    null,
    2,
  );
}

/** Combined style + editable copy for Cursor paste-back. */
export function overviewTunerExportToClipboardJson(
  style: OverviewStyleConfig,
  content: {
    headline: string;
    subheadline: string;
    questionsTitle: string;
    questions: string[];
    highlightsTitle: string;
    highlights: string[];
    agendaTitle: string;
    agenda: Array<{ wave: string; who: string; why: string }>;
    agendaNote?: string;
  },
): string {
  return JSON.stringify(
    {
      _note: "OnwardAir overview tuner export — paste into Cursor to persist style + text & deploy",
      style: sanitizeOverviewStyleConfig(style),
      content: {
        headline: content.headline,
        subheadline: content.subheadline,
        questionsTitle: content.questionsTitle,
        questions: content.questions,
        highlightsTitle: content.highlightsTitle,
        highlights: content.highlights,
        agendaTitle: content.agendaTitle,
        agenda: content.agenda,
        agendaNote: content.agendaNote ?? "",
      },
    },
    null,
    2,
  );
}

export function moveLeftColumnCard(
  order: OverviewLeftCardId[],
  id: OverviewLeftCardId,
  direction: -1 | 1,
): OverviewLeftCardId[] {
  const index = order.indexOf(id);
  if (index < 0) return order;
  const next = index + direction;
  if (next < 0 || next >= order.length) return order;
  const copy = [...order];
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item);
  return copy;
}
