"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

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
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const hasAudio = Boolean(content.audioUrl);
  const canSpeak =
    typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined";

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
      utteranceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!content.autoplay || !content.audioUrl || !audioRef.current) return;
    void audioRef.current.play().then(() => setPlaying(true)).catch(() => undefined);
  }, [content.audioUrl, content.autoplay]);

  function stopSpeech() {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    utteranceRef.current = null;
    setPlaying(false);
  }

  function togglePlay() {
    if (hasAudio) {
      const el = audioRef.current;
      if (!el) return;
      if (el.paused) {
        void el.play();
        setPlaying(true);
      } else {
        el.pause();
        setPlaying(false);
      }
      return;
    }

    if (!canSpeak) return;
    if (playing) {
      stopSpeech();
      return;
    }
    const utter = new SpeechSynthesisUtterance(content.script);
    utter.rate = 1;
    utter.onend = () => setPlaying(false);
    utter.onerror = () => setPlaying(false);
    utteranceRef.current = utter;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    setPlaying(true);
  }

  function toggleMute() {
    if (hasAudio && audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setMuted(audioRef.current.muted);
      return;
    }
    if (playing) stopSpeech();
    setMuted((m) => !m);
  }

  const activeHighlight =
    content.highlights?.find((h, i, arr) => {
      const next = arr[i + 1];
      return progress >= h.t && (!next || progress < next.t);
    }) ?? null;

  return (
    <ImmersiveLessonShell
      eyebrow="Voice"
      title={content.title || lesson.title}
      subtitle={content.voiceHint ? `Voice: ${content.voiceHint}` : "Optional narration"}
      sceneText={`${lesson.title} ${content.script}`}
      onPrimary={onComplete}
      primaryLabel="Continue"
    >
      <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C2185B]/20 text-[#f9a8d4]">
            <Volume2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              {hasAudio ? "Voice-over ready" : canSpeak ? "AI narration (browser voice)" : "Script mode"}
            </p>
            <p className="text-xs text-white/45">Play, pause, or mute — then continue when ready.</p>
          </div>
          <button
            type="button"
            onClick={toggleMute}
            className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-white/5"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          {(hasAudio || canSpeak) && !muted ? (
            <button
              type="button"
              onClick={togglePlay}
              className="inline-flex items-center gap-2 rounded-full bg-[#C2185B] px-3 py-2 text-sm font-semibold text-white"
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
          <p className="mt-4 rounded-lg border border-[#C2185B]/30 bg-[#C2185B]/10 px-3 py-2 text-sm text-pink-100">
            {activeHighlight.text}
          </p>
        ) : null}
      </div>
    </ImmersiveLessonShell>
  );
}
