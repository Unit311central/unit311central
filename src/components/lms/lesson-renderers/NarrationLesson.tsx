"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2 } from "lucide-react";

import ImmersiveLessonShell from "@/components/lms/ImmersiveLessonShell";
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
    <ImmersiveLessonShell
      eyebrow="Narration"
      title={content.title || lesson.title}
      subtitle={content.voiceHint ? `Voice: ${content.voiceHint}` : undefined}
      sceneText={`${lesson.title} ${content.script}`}
      onPrimary={onComplete}
      primaryLabel="Next"
    >
      <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
            <Volume2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              {hasAudio ? "Voice-over ready" : "Script mode (audio pending)"}
            </p>
            <p className="text-xs text-white/45">Follow along with the narration below.</p>
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

        <p className="whitespace-pre-wrap text-base leading-relaxed text-white/85">
          {content.script}
        </p>
        {activeHighlight ? (
          <p className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            {activeHighlight.text}
          </p>
        ) : null}
      </div>
    </ImmersiveLessonShell>
  );
}
