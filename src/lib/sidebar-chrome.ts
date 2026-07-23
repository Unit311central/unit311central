export type SidebarThemeId =
  | "unit311-dark"
  | "midnight"
  | "slate"
  | "graphite"
  | "navy-executive";

export type SidebarThemeTokens = {
  id: SidebarThemeId;
  label: string;
  sidebar: string;
  card: string;
  border: string;
  cardBorder: string;
  accent: string;
};

export const SIDEBAR_THEMES: readonly SidebarThemeTokens[] = [
  {
    id: "unit311-dark",
    label: "Unit311 Dark",
    sidebar: "#08111F",
    card: "#121C2D",
    border: "#17283E",
    cardBorder: "#243347",
    accent: "#2F80ED",
  },
  {
    id: "midnight",
    label: "Midnight",
    sidebar: "#0B1020",
    card: "#1A2336",
    border: "#1C2A45",
    cardBorder: "#2A3A55",
    accent: "#4F8CFF",
  },
  {
    id: "slate",
    label: "Slate",
    sidebar: "#20242C",
    card: "#2A313D",
    border: "#323844",
    cardBorder: "#3A4352",
    accent: "#00C2A8",
  },
  {
    id: "graphite",
    label: "Graphite",
    sidebar: "#1B1B1B",
    card: "#292929",
    border: "#2E2E2E",
    cardBorder: "#3A3A3A",
    accent: "#4DA3FF",
  },
  {
    id: "navy-executive",
    label: "Navy Executive",
    sidebar: "#091628",
    card: "#13233C",
    border: "#15304A",
    cardBorder: "#1E3A58",
    accent: "#5C8DFF",
  },
] as const;

export const DEFAULT_SIDEBAR_THEME_ID: SidebarThemeId = "unit311-dark";

export const SIDEBAR_THEME_STORAGE_KEY = "unit311-sidebar-theme";
export const SIDEBAR_EXPANDED_STORAGE_KEY = "unit311-sidebar-expanded-v4";

export function getSidebarTheme(id: SidebarThemeId | string | null | undefined): SidebarThemeTokens {
  return SIDEBAR_THEMES.find((theme) => theme.id === id) ?? SIDEBAR_THEMES[0];
}

export function readSidebarThemeId(): SidebarThemeId {
  if (typeof window === "undefined") return DEFAULT_SIDEBAR_THEME_ID;
  try {
    const raw = window.localStorage.getItem(SIDEBAR_THEME_STORAGE_KEY);
    if (raw && SIDEBAR_THEMES.some((theme) => theme.id === raw)) {
      return raw as SidebarThemeId;
    }
  } catch {
    // ignore
  }
  return DEFAULT_SIDEBAR_THEME_ID;
}

export function writeSidebarThemeId(id: SidebarThemeId) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SIDEBAR_THEME_STORAGE_KEY, id);
  } catch {
    // ignore
  }
}

export function readSidebarExpandedState(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SIDEBAR_EXPANDED_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function writeSidebarExpandedState(state: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SIDEBAR_EXPANDED_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}
