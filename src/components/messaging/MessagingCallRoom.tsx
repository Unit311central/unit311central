"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, startTransition } from "react";
import DailyIframe, { type DailyCall } from "@daily-co/daily-js";

import { useExecutiveCallWebRtc } from "@/hooks/useExecutiveCallWebRtc";
import type { MessagingCallSessionPayload } from "@/lib/messaging-call-service";
import { cn } from "@/lib/utils";
import { Loader2, Mic, MicOff, MonitorUp, Paperclip, PhoneOff, ScreenShareOff, Video, VideoOff } from "lucide-react";

type MessagingCallRoomProps = {
  sessionId: string;
  expectedMode: "voice" | "video";
  embedded?: boolean;
  guestToken?: string | null;
};

type DailyCredentials = {
  roomUrl: string;
  token: string;
  provider: "daily";
};

function guestHeaders(guestToken?: string | null): HeadersInit {
  return guestToken ? { "x-call-guest-token": guestToken } : {};
}

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text.slice(0, 160) || "Unexpected server response");
  }
}

function connectionLabel(state: RTCPeerConnectionState) {
  switch (state) {
    case "connected":
      return "Connected";
    case "connecting":
      return "Connecting…";
    case "failed":
      return "Connection failed";
    case "disconnected":
      return "Disconnected";
    case "closed":
      return "Ended";
    default:
      return "Waiting for peer…";
  }
}

export default function MessagingCallRoom({
  sessionId,
  expectedMode,
  embedded = false,
  guestToken = null,
}: MessagingCallRoomProps) {
  const isExternalGuest = Boolean(guestToken);
  const isVoice = expectedMode === "voice";
  const signalingBasePath = "/api/messaging/calls";

  const [payload, setPayload] = useState<MessagingCallSessionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [leftCall, setLeftCall] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [mediaProvider, setMediaProvider] = useState<"daily" | "webrtc" | null>(null);
  const [dailyReady, setDailyReady] = useState(false);
  const [fileStatus, setFileStatus] = useState<string | null>(null);
  const [sharingFile, setSharingFile] = useState(false);

  // Legacy WebRTC fallback state
  const [videoEnabled, setVideoEnabled] = useState(expectedMode === "video");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const mediaStartedRef = useRef(false);

  const dailyContainerRef = useRef<HTMLDivElement>(null);
  const dailyCallRef = useRef<DailyCall | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSession = useCallback(async () => {
    const params = new URLSearchParams();
    if (guestToken) params.set("guest", guestToken);
    if (guestName.trim()) params.set("name", guestName.trim());
    const query = params.toString();
    const response = await fetch(
      `${signalingBasePath}/${sessionId}${query ? `?${query}` : ""}`,
      { cache: "no-store", headers: guestHeaders(guestToken) },
    );
    const data = await readApiJson<MessagingCallSessionPayload & { error?: string }>(response);
    if (!response.ok) throw new Error(data.error ?? "Call not found");
    setPayload(data);
    return data;
  }, [guestName, guestToken, sessionId]);

  useEffect(() => {
    let cancelled = false;
    startTransition(() => {
      void (async () => {
        try {
          await loadSession();
        } catch (loadError) {
          if (!cancelled) {
            setError(loadError instanceof Error ? loadError.message : "Failed to load call");
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, [loadSession]);

  const destroyDaily = useCallback(() => {
    const call = dailyCallRef.current;
    dailyCallRef.current = null;
    setDailyReady(false);
    if (!call) return;
    try {
      call.destroy();
    } catch {
      // ignore
    }
  }, []);

  const stopMedia = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    cameraStreamRef.current = null;
    screenStreamRef.current = null;
    setLocalStream(null);
    mediaStartedRef.current = false;
  }, []);

  useEffect(() => () => {
    destroyDaily();
    stopMedia();
  }, [destroyDaily, stopMedia]);

  const startDailyCall = useCallback(
    async (credentials: DailyCredentials) => {
      destroyDaily();
      const container = dailyContainerRef.current;
      if (!container) throw new Error("Call display is not ready.");

      const call = DailyIframe.createFrame(container, {
        showLeaveButton: true,
        showFullscreenButton: true,
        iframeStyle: {
          width: "100%",
          height: "100%",
          border: "0",
          borderRadius: "16px",
        },
        theme: {
          colors: {
            accent: "#2563eb",
            accentText: "#ffffff",
            background: "#020617",
            backgroundAccent: "#0b1524",
            baseText: "#f8fafc",
            border: "#1e293b",
            mainAreaBg: "#020617",
            mainAreaBgAccent: "#0b1524",
            mainAreaText: "#f8fafc",
            supportiveText: "#94a3b8",
          },
        },
      });
      dailyCallRef.current = call;

      call.on("left-meeting", () => {
        setLeftCall(true);
        setJoined(false);
        destroyDaily();
      });
      call.on("error", (event) => {
        setError(event?.errorMsg || "Daily call error");
      });

      await call.join({
        url: credentials.roomUrl,
        token: credentials.token,
        startVideoOff: isVoice,
        startAudioOff: false,
      });
      setMediaProvider("daily");
      setDailyReady(true);
    },
    [destroyDaily, isVoice],
  );

  const startWebRtcMedia = useCallback(async () => {
    setMediaError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVoice ? false : { facingMode: "user" },
      });
      cameraStreamRef.current = stream;
      streamRef.current = stream;
      setLocalStream(stream);
      setMediaProvider("webrtc");
    } catch {
      setMediaError("Unable to access camera/microphone. Check browser permissions.");
      throw new Error("Media permission denied");
    }
  }, [isVoice]);

  async function handleJoin() {
    if (isExternalGuest && !guestName.trim()) {
      setError("Enter your name before joining.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`${signalingBasePath}/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...guestHeaders(guestToken),
        },
        body: JSON.stringify({
          action: "join",
          guestToken: guestToken || undefined,
          displayName: isExternalGuest ? guestName.trim() : undefined,
        }),
      });
      const data = await readApiJson<MessagingCallSessionPayload & { error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to join call");
      if (data.room.callType !== expectedMode) {
        throw new Error(`This link is for a ${data.room.callType} call.`);
      }
      setPayload(data);
      setJoined(true);

      // Prefer Daily (multiparty). Fall back to legacy WebRTC if Daily is not configured.
      const dailyResponse = await fetch(`${signalingBasePath}/${sessionId}/daily`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...guestHeaders(guestToken),
        },
        body: JSON.stringify({
          guestToken: guestToken || undefined,
          displayName: isExternalGuest ? guestName.trim() : undefined,
        }),
      });
      const dailyData = await readApiJson<{
        roomUrl?: string;
        token?: string;
        error?: string;
      }>(dailyResponse);

      if (dailyResponse.ok && dailyData.roomUrl && dailyData.token) {
        // Wait a tick so the Daily container mounts after joined=true
        await new Promise((resolve) => window.setTimeout(resolve, 50));
        await startDailyCall({
          roomUrl: dailyData.roomUrl,
          token: dailyData.token,
          provider: "daily",
        });
      } else if (dailyResponse.status === 503) {
        if (!mediaStartedRef.current) {
          mediaStartedRef.current = true;
          await startWebRtcMedia();
        }
      } else {
        throw new Error(dailyData.error ?? "Failed to start meeting media");
      }
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "Failed to join call");
      setJoined(false);
      destroyDaily();
      stopMedia();
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    setBusy(true);
    setError(null);
    try {
      if (dailyCallRef.current) {
        try {
          await dailyCallRef.current.leave();
        } catch {
          // ignore
        }
        destroyDaily();
      }
      await fetch(`${signalingBasePath}/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...guestHeaders(guestToken),
        },
        body: JSON.stringify({
          action: "leave",
          guestToken: guestToken || undefined,
        }),
      });
      setLeftCall(true);
      setJoined(false);
      stopMedia();
    } catch (leaveError) {
      setError(leaveError instanceof Error ? leaveError.message : "Failed to leave call");
    } finally {
      setBusy(false);
    }
  }

  // --- WebRTC fallback helpers ---
  useEffect(() => {
    const video = localVideoRef.current;
    if (!video || !localStream || isVoice || mediaProvider !== "webrtc") return;
    video.srcObject = localStream;
    void video.play().catch(() => undefined);
  }, [isVoice, localStream, joined, leftCall, videoEnabled, mediaProvider]);

  const webrtcEnabled =
    mediaProvider === "webrtc" && Boolean(payload && joined && !leftCall && localStream);

  const { remoteStream, connectionState, signalingError } = useExecutiveCallWebRtc({
    slug: sessionId,
    role: payload?.viewer.isHost ? "host" : "guest",
    enabled: webrtcEnabled,
    localStream,
    signalingBasePath,
    receiveVideo: !isVoice,
    guestToken,
  });

  useEffect(() => {
    if (mediaProvider !== "webrtc") return;
    if (isVoice) {
      const audio = remoteAudioRef.current;
      if (!audio) return;
      audio.srcObject = remoteStream;
      if (remoteStream) void audio.play().catch(() => undefined);
      return;
    }
    const video = remoteVideoRef.current;
    if (!video) return;
    video.srcObject = remoteStream;
    if (remoteStream) void video.play().catch(() => undefined);
  }, [isVoice, remoteStream, mediaProvider]);

  const toggleVideo = useCallback(() => {
    if (isVoice || sharingScreen || mediaProvider !== "webrtc") return;
    setVideoEnabled((current) => {
      const next = !current;
      streamRef.current?.getVideoTracks().forEach((track) => {
        track.enabled = next;
      });
      return next;
    });
  }, [isVoice, sharingScreen, mediaProvider]);

  const toggleAudio = useCallback(() => {
    if (mediaProvider !== "webrtc") return;
    setAudioEnabled((current) => {
      const next = !current;
      streamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = next;
      });
      return next;
    });
  }, [mediaProvider]);

  const stopScreenShare = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    const camera = cameraStreamRef.current;
    if (camera) {
      streamRef.current = camera;
      setLocalStream(camera);
    }
    setSharingScreen(false);
  }, []);

  const startScreenShare = useCallback(async () => {
    if (isVoice || mediaProvider !== "webrtc") return;
    setMediaError(null);
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = display.getVideoTracks()[0];
      if (!screenTrack) throw new Error("No screen track");
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = display;
      const audioTracks = (cameraStreamRef.current ?? streamRef.current)?.getAudioTracks() ?? [];
      const outbound = new MediaStream([screenTrack, ...audioTracks]);
      streamRef.current = outbound;
      setLocalStream(outbound);
      setSharingScreen(true);
      screenTrack.onended = () => stopScreenShare();
    } catch {
      setMediaError("Unable to share screen. Check browser permissions and try again.");
    }
  }, [isVoice, mediaProvider, stopScreenShare]);

  async function handleShareFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !payload || isExternalGuest) return;

    setSharingFile(true);
    setFileStatus(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("room", payload.room.channelRoom);

      const uploadResponse = await fetch("/api/messaging/attachments", {
        method: "POST",
        body: formData,
      });
      const uploadData = await readApiJson<{
        attachment?: { name: string; url: string; mimeType: string };
        error?: string;
      }>(uploadResponse);
      if (!uploadResponse.ok || !uploadData.attachment) {
        throw new Error(uploadData.error ?? "Failed to upload file");
      }

      const username = payload.viewer.displayName.includes("@")
        ? payload.viewer.displayName.split("@")[0] || payload.viewer.operatorId
        : payload.viewer.displayName.replace(/\s+/g, ".").toLowerCase() ||
          payload.viewer.operatorId;

      const messageResponse = await fetch("/api/messaging/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId: payload.viewer.operatorId,
          operatorName: payload.viewer.displayName,
          username,
          room: payload.room.channelRoom,
          content: `Shared ${uploadData.attachment.name} during live ${payload.room.callType} call`,
          messageType: "file",
          attachmentName: uploadData.attachment.name,
          attachmentUrl: uploadData.attachment.url,
          attachmentMime: uploadData.attachment.mimeType,
        }),
      });
      const messageData = await readApiJson<{ error?: string }>(messageResponse);
      if (!messageResponse.ok) {
        throw new Error(messageData.error ?? "Failed to post shared file");
      }

      setFileStatus(`${uploadData.attachment.name} sent to Messaging`);
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : "Failed to share file");
    } finally {
      setSharingFile(false);
    }
  }

  if (loading) {
    return (
      <section
        className={cn(
          "flex items-center justify-center bg-[#020617] text-white/70",
          embedded ? "h-full min-h-[240px]" : "min-h-screen",
        )}
      >
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="ml-2 text-sm">Loading call…</span>
      </section>
    );
  }

  if (leftCall) {
    return (
      <section
        className={cn(
          "flex items-center justify-center bg-[#020617] px-5",
          embedded ? "h-full min-h-[240px]" : "min-h-screen",
        )}
      >
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#07111f] p-8 text-center">
          <h1 className="text-lg font-semibold text-white">Call ended</h1>
          <p className="mt-2 text-sm text-white/55">
            You can close this panel and return to Communications.
          </p>
          {!embedded ? (
            <Link
              href="/internaldashboard?view=communications"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-[#2563eb] px-4 text-sm font-semibold text-white"
            >
              Back to Communications
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  if (error && !payload) {
    return (
      <section
        className={cn(
          "flex items-center justify-center bg-[#020617] px-5",
          embedded ? "h-full min-h-[240px]" : "min-h-screen",
        )}
      >
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#07111f] p-8 text-center">
          <h1 className="text-lg font-semibold text-white">Unable to open call</h1>
          <p className="mt-2 text-sm text-white/55">{error}</p>
        </div>
      </section>
    );
  }

  const usingDaily = mediaProvider === "daily" || (joined && mediaProvider !== "webrtc");

  return (
    <section
      className={cn(
        "flex flex-col bg-[#020617] text-white",
        embedded ? "h-full min-h-0" : "min-h-screen",
      )}
    >
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300">
            Communications · {isVoice ? "Voice" : "Video"}
            {mediaProvider === "daily" ? " · Daily" : mediaProvider === "webrtc" ? " · Direct" : ""}
          </p>
          <h1 className="text-base font-semibold sm:text-lg">
            {payload?.viewer.isHost ? "Hosting" : "In call"}
            {payload?.room.hostOperatorName
              ? ` · ${payload.viewer.isHost ? "you" : payload.room.hostOperatorName}`
              : ""}
          </h1>
        </div>
        <p className="text-xs text-white/50">
          {mediaProvider === "daily"
            ? dailyReady
              ? "Live"
              : "Connecting…"
            : mediaProvider === "webrtc"
              ? connectionLabel(connectionState)
              : "Ready"}
        </p>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col px-3 py-3 sm:px-5 sm:py-4">
        {/* Daily mounts here once joined */}
        <div
          ref={dailyContainerRef}
          className={cn(
            "min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/40",
            (!joined || mediaProvider === "webrtc") && "hidden",
            embedded ? "min-h-[280px]" : "min-h-[420px]",
          )}
        />

        {(!joined || mediaProvider === "webrtc") && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            {mediaProvider === "webrtc" ? (
              isVoice ? (
                <>
                  <audio ref={remoteAudioRef} autoPlay playsInline />
                  <div className="flex h-48 w-48 items-center justify-center rounded-full border border-sky-400/30 bg-sky-500/10 text-sky-100">
                    <Mic className="h-12 w-12" />
                  </div>
                  <p className="text-sm text-white/60">
                    {remoteStream ? "Live audio connected" : "Waiting for the other participant…"}
                  </p>
                </>
              ) : (
                <div className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={cn("h-full w-full object-cover", !remoteStream && "opacity-0")}
                  />
                  {!remoteStream && (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-white/50">
                      Waiting for the other participant…
                    </div>
                  )}
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="absolute bottom-4 right-4 h-28 w-40 rounded-xl border border-white/20 object-cover shadow-lg"
                  />
                </div>
              )
            ) : (
              <p className="text-sm text-white/50">
                {joined ? "Starting meeting…" : "Join to start voice, video, and screen share."}
              </p>
            )}
          </div>
        )}

        {(error || mediaError || signalingError) && (
          <p className="mt-3 text-center text-sm text-rose-300">
            {error || mediaError || signalingError}
          </p>
        )}
        {fileStatus ? (
          <p className="mt-2 text-center text-sm text-emerald-300">{fileStatus}</p>
        ) : null}
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-3 border-t border-white/10 px-5 py-4">
        {!joined ? (
          <div className="flex w-full max-w-md flex-col items-center gap-3">
            {isExternalGuest ? (
              <input
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-white/15 bg-[#0b1524] px-4 py-3 text-sm text-white outline-none focus:border-sky-400/50"
              />
            ) : null}
            <button
              type="button"
              disabled={busy || (isExternalGuest && !guestName.trim())}
              onClick={() => void handleJoin()}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-5 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isVoice ? (
                <Mic className="h-4 w-4" />
              ) : (
                <Video className="h-4 w-4" />
              )}
              Join {isVoice ? "voice" : "video"} call
              {isExternalGuest ? " as guest" : ""}
            </button>
            {isExternalGuest ? (
              <p className="text-center text-xs text-white/45">
                No Unit311 account needed. Up to 10 people can join this link.
              </p>
            ) : null}
          </div>
        ) : usingDaily && mediaProvider === "daily" ? (
          <>
            {!isExternalGuest ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(event) => void handleShareFile(event)}
                />
                <button
                  type="button"
                  disabled={sharingFile}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 text-sm text-sky-100 disabled:opacity-50"
                >
                  {sharingFile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                  File to Messaging
                </button>
              </>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleLeave()}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-rose-600 px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              <PhoneOff className="h-4 w-4" />
              Leave
            </button>
          </>
        ) : (
          <>
            {!isExternalGuest ? (
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(event) => void handleShareFile(event)}
              />
            ) : null}
            <button
              type="button"
              onClick={toggleAudio}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5"
              aria-label={audioEnabled ? "Mute" : "Unmute"}
            >
              {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </button>
            {!isVoice && (
              <button
                type="button"
                onClick={toggleVideo}
                disabled={sharingScreen}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 disabled:opacity-40"
              >
                {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </button>
            )}
            {!isVoice && (
              <button
                type="button"
                onClick={() => void (sharingScreen ? stopScreenShare() : startScreenShare())}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm",
                  sharingScreen
                    ? "border-amber-400/40 bg-amber-500/15 text-amber-100"
                    : "border-white/15 bg-white/5",
                )}
              >
                {sharingScreen ? (
                  <ScreenShareOff className="h-4 w-4" />
                ) : (
                  <MonitorUp className="h-4 w-4" />
                )}
                {sharingScreen ? "Stop share" : "Share"}
              </button>
            )}
            {!isExternalGuest ? (
              <button
                type="button"
                disabled={sharingFile}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 text-sm text-sky-100 disabled:opacity-50"
              >
                {sharingFile ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
                File
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleLeave()}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-rose-600 px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              <PhoneOff className="h-4 w-4" />
              Leave
            </button>
          </>
        )}
      </footer>
    </section>
  );
}
