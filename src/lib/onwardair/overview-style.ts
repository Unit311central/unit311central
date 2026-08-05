/**
 * Live style tokens for the OnwardAir /overview invite page.
 * Tuned in-browser via OverviewStyleTuner; paste the exported JSON back to Cursor to persist.
 */

export const OVERVIEW_STYLE_VERSION = 1 as const;

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

export type OverviewStyleConfig = {
  version: typeof OVERVIEW_STYLE_VERSION;
  accent: string;
  page: {
    paddingX: number;
    paddingY: number;
    columnGap: number;
    leftColumnFr: number;
    rightColumnFr: number;
    cardGap: number;
    heroImageOpacity: number;
    overlayOpacity: number;
  };
  typography: {
    fontFamily: OverviewFontId;
    headerFontSize: number;
    headerColor: string;
    headerOpacity: number;
  };
  logos: {
    oaHeight: number;
    oaMaxWidth: number;
    unit311Height: number;
    unit311MaxWidth: number;
  };
  cards: {
    padding: number;
    radius: number;
    borderOpacity: number;
  };
  questions: {
    bg: string;
    textSize: number;
    textColor: string;
    badgeSize: number;
    itemGap: number;
  };
  highlights: {
    bg: string;
    titleSize: number;
    titleColor: string;
    itemSize: number;
    itemColor: string;
  };
  agenda: {
    bg: string;
    titleSize: number;
    titleColor: string;
    rowPaddingX: number;
    rowPaddingY: number;
    rowRadius: number;
    rowBg: string;
    waveSize: number;
    whoSize: number;
    whySize: number;
    whyColor: string;
  };
  preview: {
    radius: number;
    minHeight: number;
    borderOpacity: number;
  };
};

/** Matches the current hardcoded overview layout (baseline before tuning). */
export function defaultOverviewStyleConfig(): OverviewStyleConfig {
  return {
    version: OVERVIEW_STYLE_VERSION,
    accent: "#267B90",
    page: {
      paddingX: 16,
      paddingY: 12,
      columnGap: 14,
      leftColumnFr: 0.7,
      rightColumnFr: 2.45,
      cardGap: 16,
      heroImageOpacity: 0.42,
      overlayOpacity: 0.78,
    },
    typography: {
      fontFamily: "geist",
      headerFontSize: 13,
      headerColor: "#ffffff",
      headerOpacity: 0.85,
    },
    logos: {
      oaHeight: 36,
      oaMaxWidth: 160,
      unit311Height: 20,
      unit311MaxWidth: 92,
    },
    cards: {
      padding: 14,
      radius: 12,
      borderOpacity: 0.22,
    },
    questions: {
      bg: "#ffffff",
      textSize: 14,
      textColor: "#1B2430",
      badgeSize: 20,
      itemGap: 8,
    },
    highlights: {
      bg: "rgba(11, 58, 74, 0.85)",
      titleSize: 13,
      titleColor: "#7DD3E8",
      itemSize: 13,
      itemColor: "rgba(255, 255, 255, 0.95)",
    },
    agenda: {
      bg: "#ffffff",
      titleSize: 13,
      titleColor: "#1B2430",
      rowPaddingX: 10,
      rowPaddingY: 6,
      rowRadius: 8,
      rowBg: "#F4FAFB",
      waveSize: 10,
      whoSize: 12,
      whySize: 11,
      whyColor: "#5B6577",
    },
    preview: {
      radius: 12,
      minHeight: 420,
      borderOpacity: 0.1,
    },
  };
}

export function overviewFontStack(id: OverviewFontId): string {
  return OVERVIEW_FONT_OPTIONS.find((f) => f.id === id)?.stack ?? OVERVIEW_FONT_OPTIONS[0].stack;
}

/** CSS custom properties applied to the overview root for live preview. */
export function overviewStyleToCssVars(style: OverviewStyleConfig): Record<string, string> {
  const font = overviewFontStack(style.typography.fontFamily);
  return {
    "--oa-font": font,
    "--oa-accent": style.accent,
    "--oa-page-px": `${style.page.paddingX}px`,
    "--oa-page-py": `${style.page.paddingY}px`,
    "--oa-col-gap": `${style.page.columnGap}px`,
    "--oa-left-fr": String(style.page.leftColumnFr),
    "--oa-right-fr": String(style.page.rightColumnFr),
    "--oa-card-gap": `${style.page.cardGap}px`,
    "--oa-hero-opacity": String(style.page.heroImageOpacity),
    "--oa-overlay-opacity": String(style.page.overlayOpacity),
    "--oa-header-size": `${style.typography.headerFontSize}px`,
    "--oa-header-color": style.typography.headerColor,
    "--oa-header-opacity": String(style.typography.headerOpacity),
    "--oa-logo-oa-h": `${style.logos.oaHeight}px`,
    "--oa-logo-oa-mw": `${style.logos.oaMaxWidth}px`,
    "--oa-logo-u311-h": `${style.logos.unit311Height}px`,
    "--oa-logo-u311-mw": `${style.logos.unit311MaxWidth}px`,
    "--oa-card-pad": `${style.cards.padding}px`,
    "--oa-card-radius": `${style.cards.radius}px`,
    "--oa-card-border-opacity": String(style.cards.borderOpacity),
    "--oa-q-bg": style.questions.bg,
    "--oa-q-size": `${style.questions.textSize}px`,
    "--oa-q-color": style.questions.textColor,
    "--oa-q-badge": `${style.questions.badgeSize}px`,
    "--oa-q-gap": `${style.questions.itemGap}px`,
    "--oa-hl-bg": style.highlights.bg,
    "--oa-hl-title-size": `${style.highlights.titleSize}px`,
    "--oa-hl-title-color": style.highlights.titleColor,
    "--oa-hl-item-size": `${style.highlights.itemSize}px`,
    "--oa-hl-item-color": style.highlights.itemColor,
    "--oa-ag-bg": style.agenda.bg,
    "--oa-ag-title-size": `${style.agenda.titleSize}px`,
    "--oa-ag-title-color": style.agenda.titleColor,
    "--oa-ag-row-px": `${style.agenda.rowPaddingX}px`,
    "--oa-ag-row-py": `${style.agenda.rowPaddingY}px`,
    "--oa-ag-row-radius": `${style.agenda.rowRadius}px`,
    "--oa-ag-row-bg": style.agenda.rowBg,
    "--oa-ag-wave-size": `${style.agenda.waveSize}px`,
    "--oa-ag-who-size": `${style.agenda.whoSize}px`,
    "--oa-ag-why-size": `${style.agenda.whySize}px`,
    "--oa-ag-why-color": style.agenda.whyColor,
    "--oa-preview-radius": `${style.preview.radius}px`,
    "--oa-preview-min-h": `${style.preview.minHeight}px`,
    "--oa-preview-border-opacity": String(style.preview.borderOpacity),
  };
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

function asFontId(value: unknown, fallback: OverviewFontId): OverviewFontId {
  const id = typeof value === "string" ? value : "";
  return OVERVIEW_FONT_OPTIONS.some((f) => f.id === id) ? (id as OverviewFontId) : fallback;
}

/** Merge pasted / partial JSON onto defaults so Cursor can apply incomplete exports safely. */
export function sanitizeOverviewStyleConfig(raw: unknown): OverviewStyleConfig {
  const d = defaultOverviewStyleConfig();
  if (!raw || typeof raw !== "object") return d;
  const body = raw as Partial<OverviewStyleConfig>;
  const page = (body.page ?? {}) as Partial<OverviewStyleConfig["page"]>;
  const typography = (body.typography ?? {}) as Partial<OverviewStyleConfig["typography"]>;
  const logos = (body.logos ?? {}) as Partial<OverviewStyleConfig["logos"]>;
  const cards = (body.cards ?? {}) as Partial<OverviewStyleConfig["cards"]>;
  const questions = (body.questions ?? {}) as Partial<OverviewStyleConfig["questions"]>;
  const highlights = (body.highlights ?? {}) as Partial<OverviewStyleConfig["highlights"]>;
  const agenda = (body.agenda ?? {}) as Partial<OverviewStyleConfig["agenda"]>;
  const preview = (body.preview ?? {}) as Partial<OverviewStyleConfig["preview"]>;

  return {
    version: OVERVIEW_STYLE_VERSION,
    accent: asString(body.accent, d.accent),
    page: {
      paddingX: asNumber(page.paddingX, d.page.paddingX, 0, 64),
      paddingY: asNumber(page.paddingY, d.page.paddingY, 0, 64),
      columnGap: asNumber(page.columnGap, d.page.columnGap, 0, 48),
      leftColumnFr: asNumber(page.leftColumnFr, d.page.leftColumnFr, 0.3, 2),
      rightColumnFr: asNumber(page.rightColumnFr, d.page.rightColumnFr, 0.5, 4),
      cardGap: asNumber(page.cardGap, d.page.cardGap, 0, 48),
      heroImageOpacity: asNumber(page.heroImageOpacity, d.page.heroImageOpacity, 0, 1),
      overlayOpacity: asNumber(page.overlayOpacity, d.page.overlayOpacity, 0, 1),
    },
    typography: {
      fontFamily: asFontId(typography.fontFamily, d.typography.fontFamily),
      headerFontSize: asNumber(typography.headerFontSize, d.typography.headerFontSize, 8, 28),
      headerColor: asString(typography.headerColor, d.typography.headerColor),
      headerOpacity: asNumber(typography.headerOpacity, d.typography.headerOpacity, 0, 1),
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
      bg: asString(questions.bg, d.questions.bg),
      textSize: asNumber(questions.textSize, d.questions.textSize, 10, 24),
      textColor: asString(questions.textColor, d.questions.textColor),
      badgeSize: asNumber(questions.badgeSize, d.questions.badgeSize, 14, 36),
      itemGap: asNumber(questions.itemGap, d.questions.itemGap, 0, 24),
    },
    highlights: {
      bg: asString(highlights.bg, d.highlights.bg),
      titleSize: asNumber(highlights.titleSize, d.highlights.titleSize, 9, 22),
      titleColor: asString(highlights.titleColor, d.highlights.titleColor),
      itemSize: asNumber(highlights.itemSize, d.highlights.itemSize, 9, 22),
      itemColor: asString(highlights.itemColor, d.highlights.itemColor),
    },
    agenda: {
      bg: asString(agenda.bg, d.agenda.bg),
      titleSize: asNumber(agenda.titleSize, d.agenda.titleSize, 9, 22),
      titleColor: asString(agenda.titleColor, d.agenda.titleColor),
      rowPaddingX: asNumber(agenda.rowPaddingX, d.agenda.rowPaddingX, 0, 28),
      rowPaddingY: asNumber(agenda.rowPaddingY, d.agenda.rowPaddingY, 0, 24),
      rowRadius: asNumber(agenda.rowRadius, d.agenda.rowRadius, 0, 24),
      rowBg: asString(agenda.rowBg, d.agenda.rowBg),
      waveSize: asNumber(agenda.waveSize, d.agenda.waveSize, 8, 18),
      whoSize: asNumber(agenda.whoSize, d.agenda.whoSize, 8, 20),
      whySize: asNumber(agenda.whySize, d.agenda.whySize, 8, 18),
      whyColor: asString(agenda.whyColor, d.agenda.whyColor),
    },
    preview: {
      radius: asNumber(preview.radius, d.preview.radius, 0, 32),
      minHeight: asNumber(preview.minHeight, d.preview.minHeight, 200, 800),
      borderOpacity: asNumber(preview.borderOpacity, d.preview.borderOpacity, 0, 1),
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
