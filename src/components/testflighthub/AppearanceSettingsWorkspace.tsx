"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_SIDEBAR_THEME_ID,
  getSidebarTheme,
  readSidebarThemeId,
  SIDEBAR_THEMES,
  writeSidebarThemeId,
  type SidebarThemeId,
} from "@/lib/sidebar-chrome";
import { cn } from "@/lib/utils";

export default function AppearanceSettingsWorkspace() {
  const [themeId, setThemeId] = useState<SidebarThemeId>(DEFAULT_SIDEBAR_THEME_ID);

  useEffect(() => {
    setThemeId(readSidebarThemeId());
  }, []);

  function selectTheme(id: SidebarThemeId) {
    setThemeId(id);
    writeSidebarThemeId(id);
    window.dispatchEvent(new CustomEvent("unit311-sidebar-theme", { detail: id }));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Appearance</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/55">
          Choose a sidebar theme. Themes only change sidebar colour, card colour and accent colour —
          layout, spacing and typography stay the same.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SIDEBAR_THEMES.map((theme) => {
          const active = theme.id === themeId;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => selectTheme(theme.id)}
              className={cn(
                "rounded-[14px] border p-[18px] text-left transition-colors duration-200",
                active
                  ? "border-[#1F4FBF] bg-[#1F4FBF]/15"
                  : "border-[#243347] bg-[#121C2D] hover:border-white/20",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-semibold tracking-[0.08em] text-white uppercase">
                  {theme.label}
                </p>
                {active ? (
                  <span className="text-[11px] font-medium text-[#93c5fd]">Active</span>
                ) : null}
              </div>
              <div className="mt-4 flex gap-2">
                <span
                  className="h-10 flex-1 rounded-lg border border-white/10"
                  style={{ background: theme.sidebar }}
                  title="Sidebar"
                />
                <span
                  className="h-10 flex-1 rounded-lg border border-white/10"
                  style={{ background: theme.card }}
                  title="Cards"
                />
                <span
                  className="h-10 w-10 shrink-0 rounded-lg border border-white/10"
                  style={{ background: theme.accent }}
                  title="Accent"
                />
              </div>
              <p className="mt-3 text-[11px] text-white/40">
                {getSidebarTheme(theme.id).sidebar} · {theme.card} · {theme.accent}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
