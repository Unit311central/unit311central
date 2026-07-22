"use client";

import { Settings2 } from "lucide-react";

import type { ExecutiveVoicePrefs } from "@/lib/executive-assistant-voice";
import { cn } from "@/lib/utils";

export function VoiceSettingsPopover({
  open,
  onOpenChange,
  prefs,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefs: ExecutiveVoicePrefs;
  onChange: (next: ExecutiveVoicePrefs) => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/[0.06] hover:text-white"
        aria-label="Voice settings"
        title="Voice settings"
      >
        <Settings2 className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <div className="absolute bottom-[calc(100%+0.5rem)] right-0 z-20 w-56 rounded-xl border border-white/10 bg-[#0b1524] p-3 shadow-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
            Voice Settings
          </p>

          <label className="mt-3 flex items-center justify-between text-xs text-white/70">
            <span>Voice</span>
            <button
              type="button"
              onClick={() => onChange({ ...prefs, voiceEnabled: !prefs.voiceEnabled })}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                prefs.voiceEnabled
                  ? "bg-emerald-500/20 text-emerald-200"
                  : "bg-white/10 text-white/50",
              )}
            >
              {prefs.voiceEnabled ? "On" : "Off"}
            </button>
          </label>

          <div className="mt-3">
            <p className="text-[10px] text-white/40">Voice</p>
            <div className="mt-1.5 flex gap-1.5">
              {(["male", "female"] as const).map((gender) => (
                <button
                  key={gender}
                  type="button"
                  onClick={() => onChange({ ...prefs, gender })}
                  className={cn(
                    "flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold capitalize",
                    prefs.gender === gender
                      ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                      : "border-white/10 text-white/50 hover:bg-white/[0.04]",
                  )}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>

          <label className="mt-3 block text-[10px] text-white/40">
            Speech speed
            <input
              type="range"
              min={0.75}
              max={1.5}
              step={0.05}
              value={prefs.speed}
              onChange={(event) =>
                onChange({ ...prefs, speed: Number(event.target.value) })
              }
              className="mt-1.5 w-full accent-sky-400"
            />
            <span className="mt-0.5 block text-right text-[10px] text-white/55">
              {prefs.speed.toFixed(2)}×
            </span>
          </label>
        </div>
      ) : null}
    </div>
  );
}
