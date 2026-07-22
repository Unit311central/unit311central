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

function getSpeechRecognitionCtor():
  | (new () => SpeechRecognitionLike)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
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
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wantListenRef = useRef(false);
  const finalTranscriptRef = useRef("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const pendingIntroActionRef = useRef<"start" | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

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
        audio.onended = () => {
          if (audioUrlRef.current === url) {
            URL.revokeObjectURL(url);
            audioUrlRef.current = null;
          }
          audioRef.current = null;
          if (statusRef.current === "speaking") setStatus("idle");
        };
        audio.onerror = () => {
          if (statusRef.current === "speaking") setStatus("idle");
        };
        await audio.play();
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        if (statusRef.current === "speaking") setStatus("idle");
      }
    },
    [stopSpeaking],
  );

  const beginListeningInternal = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      setMicError("Speech recognition is not supported in this browser.");
      return;
    }

    stopSpeaking();
    setMicError(null);
    finalTranscriptRef.current = "";
    setLiveTranscript("");
    wantListenRef.current = true;
    setStatus("listening");

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
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
      setLiveTranscript(
        `${finalTranscriptRef.current}${interim ? ` ${interim}` : ""}`.trim(),
      );
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        wantListenRef.current = false;
        setStatus("idle");
        setMicError(
          "Microphone access is disabled. Enable microphone permissions in your browser settings.",
        );
        return;
      }
      if (event.error === "aborted" || event.error === "no-speech") {
        return;
      }
    };

    recognition.onend = () => {
      if (wantListenRef.current) {
        // Chrome stops after silence — keep listening while user still wants mic on.
        try {
          recognition.start();
          return;
        } catch {
          wantListenRef.current = false;
        }
      }

      const transcript = finalTranscriptRef.current.trim();
      finalTranscriptRef.current = "";
      setLiveTranscript("");
      recognitionRef.current = null;

      if (!transcript) {
        setStatus("idle");
        return;
      }

      setStatus("processing");
      void (async () => {
        try {
          setStatus("thinking");
          const reply = await options.onSubmitTranscript(transcript);
          if (reply && prefsRef.current.voiceEnabled) {
            await speakText(reply);
          } else {
            setStatus("idle");
          }
        } catch {
          setStatus("idle");
        }
      })();
    };

    try {
      recognition.start();
    } catch {
      setMicError("Could not start the microphone. Try again.");
      setStatus("idle");
      wantListenRef.current = false;
    }
  }, [options, speakText, stopSpeaking]);

  const requestStartListening = useCallback(() => {
    if (!options.enabled) return;
    if (wantListenRef.current || statusRef.current === "listening") {
      // toggle off — stop without forcing empty submit if nothing said yet
      wantListenRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      return;
    }

    // Interrupt speaking immediately
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
  }, [beginListeningInternal, options.enabled, options.userId, stopSpeaking]);

  const cancelListening = useCallback(() => {
    wantListenRef.current = false;
    try {
      recognitionRef.current?.abort();
    } catch {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
    }
    recognitionRef.current = null;
    finalTranscriptRef.current = "";
    setLiveTranscript("");
    setStatus("idle");
  }, []);

  const completeIntro = useCallback(
    (dontShowAgain: boolean, startAfter: boolean) => {
      const userKey = options.userId || "anon";
      const next = {
        ...loadExecutiveVoicePrefs(userKey),
        hideIntro: dontShowAgain ? true : loadExecutiveVoicePrefs(userKey).hideIntro,
      };
      if (dontShowAgain) next.hideIntro = true;
      persistPrefs(next);
      setIntroOpen(false);
      const shouldStart = startAfter && pendingIntroActionRef.current === "start";
      pendingIntroActionRef.current = null;
      if (shouldStart) beginListeningInternal();
    },
    [beginListeningInternal, options.userId, persistPrefs],
  );

  // Global CTRL+Q
  useEffect(() => {
    if (!options.enabled) return;

    function onKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() !== "q") return;
      // Avoid stealing when typing in native browser chrome; claim for app voice mode.
      event.preventDefault();
      event.stopPropagation();
      requestStartListening();
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.key === "Escape" && statusRef.current === "listening") {
        event.preventDefault();
        cancelListening();
      }
    }

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keydown", onKeyUp, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keydown", onKeyUp, true);
    };
  }, [cancelListening, options.enabled, requestStartListening]);

  useEffect(() => {
    return () => {
      wantListenRef.current = false;
      try {
        recognitionRef.current?.abort();
      } catch {
        // ignore
      }
      stopSpeaking();
    };
  }, [stopSpeaking]);

  const micVisual:
    | "off"
    | "listening"
    | "processing"
    | "speaking" =
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
