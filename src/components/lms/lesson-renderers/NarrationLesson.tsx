"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2 } from "lucide-react";

import type { LessonContent, LmsLesson } from "@/lib/lms/types";

type NarrationContent = Extract<LessonContent, { type: "narration" }>;

type Props = {
  lesson: LmsLesson;
  content: NarrationContent;
  onComplete: () => void;
};

export default function NarrationLesson({ lesson, content, onComplete }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const hasAudio = Boolean(content.audioUrl);

  useEffect(() => {
    if (!content.autoplay || !content.audioUrl || !audioRef.current) return;
    void audioRef.current.play().then(() => setPlaying(true)).catch(() => undefined);
  }, [content.audioUrl, content.autoplay]);

  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  const activeHighlight =
    content.highlights?.find((h, i, arr) => {
      const next = arr[i + 1];
      return progress >= h.t && (!next || progress < next.t);
    }) ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
          Narration
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          {content.title || lesson.title}
        </h2>
        {content.voiceHint ? (
          <p className="mt-2 text-xs text-white/45">Voice: {content.voiceHint}</p>
        ) : null}
      </header>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0d1b2e] to-[#07111f] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
            <Volume2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              {hasAudio ? "Voice-over ready" : "Script mode (audio pending)"}
            </p>
            <p className="text-xs text-white/45">
              Follow along with the narration script below.
            </p>
          </div>
          {hasAudio ? (
            <button
              type="button"
              onClick={togglePlay}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playing ? "Pause" : "Play"}
            </button>
          ) : null}
        </div>

        {hasAudio ? (
          <audio
            ref={audioRef}
            src={content.audioUrl!}
            className="hidden"
            onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
            onEnded={() => setPlaying(false)}
          />
        ) : null}

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="whitespace-pre-wrap text-base leading-relaxed text-white/80">
            {content.script}
          </p>
          {activeHighlight ? (
            <p className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
              {activeHighlight.text}
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onComplete}
        className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400"
      >
        Continue
      </button>
    </div>
  );
}
