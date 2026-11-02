"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { wolfCardClass } from "@/components/wolf/wolf-ui";
import {
  WOLF_PHONE_CAPTURES_PATH,
  WOLF_PHONE_CAPTURE_MAX_BYTES,
  formatCaptureSummary,
  type PhoneFieldLog,
} from "@/lib/wolf/phone-capture";
import {
  captureNativePhotoBlob,
  isWolfNativeShell,
  readNativeGeolocation,
} from "@/lib/wolf/phone-native-shell";
import { WOLF_PHONE_TELEMETRY_PATH } from "@/lib/wolf/phone-telemetry";

type Status = { tone: "neutral" | "ok" | "bad"; text: string };

export default function WolfPhoneFieldCapture() {
  const [nativeShell, setNativeShell] = useState(false);
  const [status, setStatus] = useState<Status>({
    tone: "neutral",
    text: "Uses the latest GPSLogger fix when you save.",
  });
  const [logs, setLogs] = useState<PhoneFieldLog[]>([]);
  const [recording, setRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const refreshLogs = useCallback(async () => {
    try {
      const response = await fetch(WOLF_PHONE_CAPTURES_PATH, { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { logs?: PhoneFieldLog[] };
      setLogs(payload.logs ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refreshLogs();
  }, [refreshLogs]);

  useEffect(() => {
    void isWolfNativeShell().then((native) => {
      setNativeShell(native);
      if (native) {
        setStatus({
          tone: "neutral",
          text: "WOLF Android app — use these buttons on the phone. GPSLogger still feeds the live stream while Brix is full screen.",
        });
      }
    });
  }, []);

  const latestFixFromApi = async () => {
    const response = await fetch(WOLF_PHONE_TELEMETRY_PATH, { cache: "no-store" });
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      fix?: {
        latitude: number;
        longitude: number;
        altitudeM: number | null;
        speedMps: number | null;
        headingDeg: number | null;
      } | null;
    };
    const fix = payload.fix;
    if (!fix) return null;
    return fix;
  };

  const oneShotGeolocation = (): Promise<GeolocationPosition | null> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        () => resolve(null),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 },
      );
    });

  const fixPayload = async () => {
    const fromLogger = await latestFixFromApi();
    if (fromLogger) return fromLogger;
    if (nativeShell) {
      try {
        const nativeFix = await readNativeGeolocation();
        if (nativeFix) return nativeFix;
      } catch {
        /* fall through */
      }
    }
    const position = await oneShotGeolocation();
    if (!position) return null;
    const { latitude, longitude, altitude, speed, heading } = position.coords;
    return {
      latitude,
      longitude,
      altitudeM: altitude,
      speedMps: speed != null && speed >= 0 ? speed : null,
      headingDeg: heading != null && heading >= 0 ? heading : null,
    };
  };

  const appendFixToForm = (form: FormData, fix: NonNullable<Awaited<ReturnType<typeof fixPayload>>>) => {
    form.set("latitude", String(fix.latitude));
    form.set("longitude", String(fix.longitude));
    if (fix.altitudeM != null) form.set("altitudeM", String(fix.altitudeM));
    if (fix.speedMps != null) form.set("speedMps", String(fix.speedMps));
    if (fix.headingDeg != null) form.set("headingDeg", String(fix.headingDeg));
  };

  const logPosition = async () => {
    setStatus({ tone: "neutral", text: "Saving position…" });
    const fix = await fixPayload();
    if (!fix) {
      setStatus({ tone: "bad", text: "No GPS fix. Check GPSLogger or allow location here." });
      return;
    }
    try {
      const response = await fetch(WOLF_PHONE_CAPTURES_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "position", ...fix }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; log?: PhoneFieldLog } | null;
      if (!response.ok) {
        setStatus({ tone: "bad", text: payload?.error ?? "WOLF did not save the mark." });
        return;
      }
      setStatus({
        tone: "ok",
        text: payload?.log
          ? `Position logged · ${formatCaptureSummary(payload.log)}`
          : "Position logged.",
      });
      void refreshLogs();
    } catch {
      setStatus({ tone: "bad", text: "Could not reach WOLF." });
    }
  };

  const uploadMedia = async (kind: "photo" | "video", file: File) => {
    if (file.size > WOLF_PHONE_CAPTURE_MAX_BYTES) {
      setStatus({ tone: "bad", text: "File is too large for upload." });
      return;
    }
    setStatus({ tone: "neutral", text: kind === "photo" ? "Uploading photo…" : "Uploading video…" });
    const fix = await fixPayload();
    if (!fix) {
      setStatus({ tone: "bad", text: "No GPS fix. Check GPSLogger or allow location here." });
      return;
    }
    const form = new FormData();
    form.set("kind", kind);
    form.set("file", file, file.name || kind);
    appendFixToForm(form, fix);
    try {
      const response = await fetch(WOLF_PHONE_CAPTURES_PATH, { method: "POST", body: form });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setStatus({ tone: "bad", text: payload?.error ?? "Upload failed." });
        return;
      }
      setStatus({ tone: "ok", text: `${kind === "photo" ? "Photo" : "Video"} saved with GPS.` });
      void refreshLogs();
    } catch {
      setStatus({ tone: "bad", text: "Could not reach WOLF." });
    }
  };

  const onPhotoSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void uploadMedia("photo", file);
  };

  const takePhoto = async () => {
    if (nativeShell) {
      try {
        const blob = await captureNativePhotoBlob();
        if (!blob) {
          setStatus({ tone: "bad", text: "Camera did not return a photo." });
          return;
        }
        await uploadMedia("photo", new File([blob], "capture.jpg", { type: blob.type || "image/jpeg" }));
      } catch {
        setStatus({ tone: "bad", text: "Camera permission was denied." });
      }
      return;
    }
    photoInputRef.current?.click();
  };

  const stopStream = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const startVideo = async () => {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        void videoRef.current.play();
      }
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        setRecording(false);
        stopStream();
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        void uploadMedia("video", new File([blob], "capture.webm", { type: mimeType }));
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setStatus({ tone: "neutral", text: "Recording… tap Stop video when done." });
    } catch {
      setStatus({ tone: "bad", text: "Camera or microphone permission was denied." });
      stopStream();
    }
  };

  const stopVideo = () => {
    recorderRef.current?.stop();
  };

  useEffect(() => () => stopStream(), []);

  return (
    <section className={`${wolfCardClass} mt-6 max-w-xl px-4 py-4`}>
      <h2 className="text-sm font-semibold text-white">Field capture</h2>
      <p className="mt-2 text-sm text-white/70">
        On the phone: open WOLF (browser or the Unit311 Android app) — not the laptop. Switch here from Brix when you need a mark, photo, or clip.
      </p>
      <p
        className={`mt-3 text-sm ${status.tone === "bad" ? "text-red-300" : status.tone === "ok" ? "text-emerald-300" : "text-white/80"}`}
        role="status"
      >
        {status.text}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void logPosition()}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
        >
          Log position
        </button>
        <button
          type="button"
          onClick={() => void takePhoto()}
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
        >
          Take photo
        </button>
        {!recording ? (
          <button
            type="button"
            onClick={() => void startVideo()}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
          >
            Record video
          </button>
        ) : (
          <button
            type="button"
            onClick={stopVideo}
            className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Stop video
          </button>
        )}
      </div>
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onPhotoSelected}
      />
      {recording ? (
        <video ref={videoRef} className="mt-4 aspect-video w-full rounded-lg bg-black object-cover" muted playsInline />
      ) : null}
      {logs.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm text-white/80">
          {logs.slice(0, 8).map((log) => (
            <li key={log.id} className="flex flex-wrap items-center justify-between gap-2">
              <span>
                <span className="font-semibold capitalize text-white">{log.kind}</span>
                <span className="text-white/50"> · </span>
                {formatCaptureSummary(log)}
              </span>
              {log.mediaUrl ? (
                <a className="text-xs underline" href={log.mediaUrl} target="_blank" rel="noreferrer">
                  Open
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
