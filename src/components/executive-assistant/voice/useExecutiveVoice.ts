"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  DEFAULT_EXECUTIVE_VOICE_PREFS,
  loadExecutiveVoicePrefs,
  saveExecutiveVoicePrefs,
  stripTextForSpeech,
  type ExecutiveVoicePrefs,
  type ExecutiveVoiceStatus,
} from "@/lib/executive-assistant-voice";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: ((event: Event) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionErrorLike = {
  error: string;
};

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/** Remove STT command fluff like trailing “submit” / “send”. */
export function cleanVoiceTranscript(raw: string) {
  return raw
    .replace(/\b(submit|send|please submit|go ahead)\b\.?$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function useExecutiveVoice(options: {
  enabled: boolean;
  onSubmitTranscript: (text: string) => Promise<string | null>;
  userId: string | null;
}) {
  const [prefs, setPrefsState] = useState<ExecutiveVoicePrefs>(DEFAULT_EXECUTIVE_VOICE_PREFS);
  const [status, setStatus] = useState<ExecutiveVoiceStatus>("idle");
  const [introOpen, setIntroOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [supported, setSupported] = useState(true);

  const prefsRef = useRef(prefs);
  const statusRef = useRef(status);
  const liveTranscriptRef = useRef("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wantListenRef = useRef(false);
  /** Stay in voice conversation until Esc / explicit cancel. */
  const voiceSessionRef = useRef(false);
  const finalTranscriptRef = useRef("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const pendingIntroActionRef = useRef<"start" | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const startTokenRef = useRef(0);
  const submitInFlightRef = useRef(false);
  const onSubmitRef = useRef(options.onSubmitTranscript);
  const beginListeningRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    onSubmitRef.current = options.onSubmitTranscript;
  }, [options.onSubmitTranscript]);

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognitionCtor()));
  }, []);

  useEffect(() => {
    if (!options.userId) return;
    const loaded = loadExecutiveVoicePrefs(options.userId);
    setPrefsState(loaded);
  }, [options.userId]);

  const persistPrefs = useCallback(
    (next: ExecutiveVoicePrefs) => {
      setPrefsState(next);
      prefsRef.current = next;
      if (options.userId) saveExecutiveVoicePrefs(options.userId, next);
    },
    [options.userId],
  );

  const hardStopRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.onstart = null;
    try {
      recognition.abort();
    } catch {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    ttsAbortRef.current?.abort();
    ttsAbortRef.current = null;
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if (statusRef.current === "speaking") {
      setStatus("idle");
    }
  }, []);

  const speakText = useCallback(
    async (text: string) => {
      if (!prefsRef.current.voiceEnabled) return;
      const cleaned = stripTextForSpeech(text);
      if (!cleaned) return;

      stopSpeaking();
      setStatus("speaking");

      const controller = new AbortController();
      ttsAbortRef.current = controller;

      try {
        const response = await fetch("/api/executive-assistant/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            text: cleaned,
            gender: prefsRef.current.gender,
            speed: prefsRef.current.speed,
          }),
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error || `TTS failed (${response.status})`);
        }
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;

        await new Promise<void>((resolve) => {
          audio.onended = () => {
            if (audioUrlRef.current === url) {
              URL.revokeObjectURL(url);
              audioUrlRef.current = null;
            }
            audioRef.current = null;
            resolve();
          };
          audio.onerror = () => resolve();
          void audio.play().catch(() => resolve());
        });

        if (statusRef.current === "speaking") setStatus("idle");

        // Continuous voice session: listen again after the assistant finishes speaking.
        if (voiceSessionRef.current && !wantListenRef.current && !submitInFlightRef.current) {
          window.setTimeout(() => beginListeningRef.current(), 180);
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        if (statusRef.current === "speaking") setStatus("idle");
      }
    },
    [stopSpeaking],
  );

  const submitTranscript = useCallback(
    async (raw: string) => {
      const transcript = cleanVoiceTranscript(raw);
      if (!transcript || submitInFlightRef.current) {
        setStatus("idle");
        return;
      }
      submitInFlightRef.current = true;
      setStatus("processing");
      try {
        setStatus("thinking");
        const reply = await onSubmitRef.current(transcript);
        if (reply && prefsRef.current.voiceEnabled) {
          await speakText(reply);
        } else {
          setStatus("idle");
          if (voiceSessionRef.current) {
            window.setTimeout(() => beginListeningRef.current(), 180);
          }
        }
      } catch {
        setStatus("idle");
      } finally {
        submitInFlightRef.current = false;
      }
    },
    [speakText],
  );

  const beginListeningInternal = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      setMicError("Speech recognition is not supported in this browser.");
      return;
    }

    stopSpeaking();
    hardStopRecognition();
    setMicError(null);
    finalTranscriptRef.current = "";
    liveTranscriptRef.current = "";
    setLiveTranscript("");
    wantListenRef.current = true;
    voiceSessionRef.current = true;
    setStatus("listening");

    const token = ++startTokenRef.current;

    void (async () => {
      // Chrome needs a brief gap between recognition sessions.
      await wait(140);
      if (token !== startTokenRef.current || !wantListenRef.current) return;

      const recognition = new Ctor();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      if (typeof recognition.maxAlternatives === "number") {
        recognition.maxAlternatives = 1;
      }
      recognitionRef.current = recognition;

      recognition.onresult = (event) => {
        let interim = "";
        let finalChunk = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const text = result?.[0]?.transcript ?? "";
          if (result.isFinal) finalChunk += text;
          else interim += text;
        }
      if (finalChunk) {
        finalTranscriptRef.current = `${finalTranscriptRef.current} ${finalChunk}`.trim();
      }
      const heard = `${finalTranscriptRef.current}${interim ? ` ${interim}` : ""}`.trim();
      liveTranscriptRef.current = heard;
      setLiveTranscript(heard);
      };

      recognition.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          wantListenRef.current = false;
          voiceSessionRef.current = false;
          setStatus("idle");
          setMicError(
            "Microphone access is disabled. Enable microphone permissions in your browser settings.",
          );
          return;
        }
        // no-speech / aborted are normal for push-to-talk end.
      };

      recognition.onend = () => {
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null;
        }
        const wasWanting = wantListenRef.current;
        wantListenRef.current = false;
        const transcript = finalTranscriptRef.current.trim();
        finalTranscriptRef.current = "";
        setLiveTranscript("");

        if (!wasWanting && !transcript) {
          setStatus("idle");
          return;
        }

        if (transcript) {
          void submitTranscript(transcript);
          return;
        }

        // Ended with no speech (silence). Keep session alive and listen again.
        setStatus("idle");
        if (voiceSessionRef.current) {
          window.setTimeout(() => beginListeningRef.current(), 200);
        }
      };

      try {
        recognition.start();
      } catch {
        // Retry once after a longer delay — common after prior session.
        await wait(250);
        if (token !== startTokenRef.current || !wantListenRef.current) return;
        try {
          recognition.start();
        } catch {
          setMicError("Could not start the microphone. Try again.");
          setStatus("idle");
          wantListenRef.current = false;
        }
      }
    })();
  }, [hardStopRecognition, stopSpeaking, submitTranscript]);

  useEffect(() => {
    beginListeningRef.current = beginListeningInternal;
  }, [beginListeningInternal]);

  const requestStartListening = useCallback(() => {
    if (!options.enabled) return;

    // Toggle off while listening — stop captures speech and submits via onend.
    if (wantListenRef.current || statusRef.current === "listening") {
      const hasSpeech = Boolean(
        finalTranscriptRef.current.trim() || liveTranscriptRef.current.trim(),
      );
      wantListenRef.current = false;
      // Only end the voice session when stopping with nothing said.
      if (!hasSpeech) voiceSessionRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {
        hardStopRecognition();
        setStatus("idle");
      }
      return;
    }

    // Interrupt speaking → start listening immediately
    if (statusRef.current === "speaking") {
      stopSpeaking();
    }

    const userKey = options.userId || "anon";
    const current = loadExecutiveVoicePrefs(userKey);
    if (!current.hideIntro) {
      pendingIntroActionRef.current = "start";
      setIntroOpen(true);
      return;
    }
    beginListeningInternal();
  }, [
    beginListeningInternal,
    hardStopRecognition,
    options.enabled,
    options.userId,
    stopSpeaking,
  ]);

  const cancelListening = useCallback(() => {
    wantListenRef.current = false;
    voiceSessionRef.current = false;
    startTokenRef.current += 1;
    hardStopRecognition();
    stopSpeaking();
    finalTranscriptRef.current = "";
    setLiveTranscript("");
    setStatus("idle");
  }, [hardStopRecognition, stopSpeaking]);

  const completeIntro = useCallback(
    (dontShowAgain: boolean, startAfter: boolean) => {
      const userKey = options.userId || "anon";
      const next = { ...loadExecutiveVoicePrefs(userKey) };
      if (dontShowAgain) next.hideIntro = true;
      persistPrefs(next);
      setIntroOpen(false);
      const shouldStart = startAfter && pendingIntroActionRef.current === "start";
      pendingIntroActionRef.current = null;
      if (shouldStart) beginListeningInternal();
    },
    [beginListeningInternal, options.userId, persistPrefs],
  );

  useEffect(() => {
    if (!options.enabled) return;

    function onKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() !== "q") return;
      event.preventDefault();
      event.stopPropagation();
      requestStartListening();
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (
        statusRef.current === "listening" ||
        statusRef.current === "speaking" ||
        voiceSessionRef.current
      ) {
        event.preventDefault();
        cancelListening();
      }
    }

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keydown", onEscape, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keydown", onEscape, true);
    };
  }, [cancelListening, options.enabled, requestStartListening]);

  useEffect(() => {
    return () => {
      wantListenRef.current = false;
      voiceSessionRef.current = false;
      startTokenRef.current += 1;
      hardStopRecognition();
      stopSpeaking();
    };
  }, [hardStopRecognition, stopSpeaking]);

  const micVisual: "off" | "listening" | "processing" | "speaking" =
    status === "listening"
      ? "listening"
      : status === "processing" || status === "thinking"
        ? "processing"
        : status === "speaking"
          ? "speaking"
          : "off";

  return {
    prefs,
    setPrefs: persistPrefs,
    status,
    micVisual,
    introOpen,
    settingsOpen,
    setSettingsOpen,
    micError,
    setMicError,
    liveTranscript,
    supported,
    requestStartListening,
    cancelListening,
    completeIntro,
    speakText,
    stopSpeaking,
  };
}
