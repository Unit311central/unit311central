/**
 * Central workspace UI theme tokens.
 * Workspace packs / branding can select a preset without duplicating components.
 */

export type WorkspaceUiThemeId = "default" | "talanton-emerald";

export type WorkspaceUiTheme = {
  id: WorkspaceUiThemeId;
  sectionClassName?: string;
  kpiClassName?: string;
  primaryButtonClass: string;
  secondaryButtonClass: string;
  inputClass: string;
  labelClass: string;
  moduleHeaderClassName?: string;
  moduleHeaderEyebrowClassName?: string;
  moduleHeaderAccentClassName?: string;
  generatedPanelClassName?: string;
  generatedPanelAccentLineClassName?: string;
};

const DEFAULT_THEME: WorkspaceUiTheme = {
  id: "default",
  primaryButtonClass:
    "inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 text-xs font-semibold text-sky-200 transition-colors hover:border-sky-400/60 hover:bg-sky-500/25",
  secondaryButtonClass:
    "inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 text-xs font-semibold text-white/75 transition-colors hover:bg-white/[0.08]",
  inputClass:
    "mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-sky-400/50",
  labelClass: "text-[11px] font-medium uppercase tracking-[0.12em] text-white/45",
};

const TALANTON_EMERALD_THEME: WorkspaceUiTheme = {
  id: "talanton-emerald",
  primaryButtonClass:
    "inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3 text-xs font-semibold text-emerald-100 transition-colors hover:border-emerald-300/60 hover:bg-emerald-500/25",
  secondaryButtonClass:
    "inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 text-xs font-semibold text-white/75 transition-colors hover:bg-white/[0.08]",
  inputClass:
    "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none placeholder:text-white/30 focus:border-emerald-400/40",
  labelClass: "mb-1.5 block text-[11px] font-medium text-white/45",
  moduleHeaderClassName:
    "relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-[radial-gradient(ellipse_at_top_left,_rgba(27,138,90,0.28),_transparent_55%),linear-gradient(135deg,#0c1f17_0%,#08140f_55%,#060d0a_100%)] px-5 py-6 sm:px-7 sm:py-7",
  moduleHeaderEyebrowClassName:
    "text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/85",
  moduleHeaderAccentClassName: "text-[11px] font-medium tracking-wide text-emerald-200/55",
  generatedPanelClassName:
    "relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f2a1f]/80 via-[#0b1a14]/90 to-[#08110d] p-5 sm:p-6",
  generatedPanelAccentLineClassName:
    "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent",
};

const THEMES: Record<WorkspaceUiThemeId, WorkspaceUiTheme> = {
  default: DEFAULT_THEME,
  "talanton-emerald": TALANTON_EMERALD_THEME,
};

export function getWorkspaceUiTheme(themeId: WorkspaceUiThemeId = "default"): WorkspaceUiTheme {
  return THEMES[themeId] ?? DEFAULT_THEME;
}

export function workspacePrimaryButtonClass(disabled?: boolean, themeId?: WorkspaceUiThemeId) {
  const theme = getWorkspaceUiTheme(themeId);
  return disabled ? `${theme.primaryButtonClass} pointer-events-none opacity-50` : theme.primaryButtonClass;
}

export function workspaceSecondaryButtonClass(disabled?: boolean, themeId?: WorkspaceUiThemeId) {
  const theme = getWorkspaceUiTheme(themeId);
  return disabled
    ? `${theme.secondaryButtonClass} pointer-events-none opacity-50`
    : theme.secondaryButtonClass;
}

export function workspaceInputClass(themeId?: WorkspaceUiThemeId) {
  return getWorkspaceUiTheme(themeId).inputClass;
}

export function workspaceLabelClass(themeId?: WorkspaceUiThemeId) {
  return getWorkspaceUiTheme(themeId).labelClass;
}
