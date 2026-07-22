"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function VoiceIntroModal({
  open,
  onGotIt,
  onDismiss,
}: {
  open: boolean;
  onGotIt: (dontShowAgain: boolean) => void;
  onDismiss: (dontShowAgain: boolean) => void;
}) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#020617]/75 backdrop-blur-[2px]"
        aria-label="Dismiss voice intro"
        onClick={() => onDismiss(dontShowAgain)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ea-voice-intro-title"
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1524] p-5 shadow-2xl shadow-sky-950/40"
      >
        <button
          type="button"
          onClick={() => onDismiss(dontShowAgain)}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/45 hover:bg-white/5 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/80">
          Executive Assistant
        </p>
        <h2 id="ea-voice-intro-title" className="mt-1 text-lg font-semibold text-white">
          Voice Assistant
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          You can now speak directly with your AI Executive Assistant.
        </p>
        <ul className="mt-3 space-y-2 text-sm text-white/65">
          <li>• Click the microphone or press CTRL + Q to start speaking.</li>
          <li>• Press CTRL + Q again or click the microphone to stop.</li>
          <li>• The Assistant will automatically reply using voice.</li>
        </ul>

        <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-white/55">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(event) => setDontShowAgain(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-white/20 bg-transparent"
          />
          Don&apos;t show this again
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onDismiss(dontShowAgain)}
            className="rounded-xl border border-white/10 px-3.5 py-2 text-xs font-semibold text-white/65 hover:bg-white/[0.04]"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => onGotIt(dontShowAgain)}
            className="rounded-xl border border-sky-400/35 bg-sky-500/20 px-3.5 py-2 text-xs font-semibold text-sky-50 hover:bg-sky-500/30"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
