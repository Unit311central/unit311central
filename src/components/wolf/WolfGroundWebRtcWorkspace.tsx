"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import WolfPhoneFieldCapture from "@/components/wolf/WolfPhoneFieldCapture";
import WolfPhoneTelemetryOverlay from "@/components/wolf/WolfPhoneTelemetryOverlay";
import { wolfCardClass, wolfEyebrowClass, wolfShellClass } from "@/components/wolf/wolf-ui";
import { WOLF_GROUND_WEBRTC_PATH } from "@/lib/wolf/webrtc-playback";

type ConnectionStatus = "idle" | "gathering" | "signalling" | "connecting" | "connected" | "failed";
type StreamStatus = "waiting" | "receiving" | "failed";

type Diagnostics = {
  connection: string;
  ice: string;
  signalling: string;
  candidate: string;
  frames: string;
  roundTrip: string;
  jitterBuffer: string;
  firstFrame: string;
  detail: string;
};

const EMPTY_DIAGNOSTICS: Diagnostics = {
  connection: "Idle",
  ice: "new",
  signalling: "Not started",
  candidate: "None",
  frames: "0 decoded",
  roundTrip: "Not reported",
  jitterBuffer: "Not reported",
  firstFrame: "Not measured",
  detail: "This page uses WebRTC only. It does not play HLS.",
};

type WolfWebRtcWorkspaceProps = {
  title?: string;
  eyebrow?: string;
  description?: string;
  signallingPath?: string;
  idleDetail?: string;
  publishUrl?: string;
  lowDelay?: boolean;
  showPhoneTelemetry?: boolean;
  showFieldCapture?: boolean;
};

function connectionLabel(status: ConnectionStatus): string {
  switch (status) {
    case "idle":
      return "Idle";
    case "gathering":
      return "Gathering";
    case "signalling":
      return "Signalling";
    case "connecting":
      return "Connecting";
    case "connected":
      return "Connected";
    case "failed":
      return "Failed";
  }
}

function streamLabel(status: StreamStatus): string {
  switch (status) {
    case "waiting":
      return "Waiting";
    case "receiving":
      return "Receiving";
    case "failed":
      return "No video";
  }
}

function signallingFailureDetail(failure: {
  error?: string;
  upstreamStatus?: number;
  detail?: string;
} | null): string {
  const detail = failure?.detail ?? "";
  if (failure?.upstreamStatus === 404 || /no stream is available/i.test(detail)) {
    return "Brix is not on the air for stream key test. In Brix, start RTMP to rtmp://38.80.152.147:39908/live with key test. When Brix shows it is live, tap Reconnect here. WOLF can stay open in split screen or switch back from Brix.";
  }
  const upstream =
    typeof failure?.upstreamStatus === "number" ? ` Upstream HTTP ${failure.upstreamStatus}.` : "";
  return `${failure?.error ?? "WHEP did not return an SDP answer."}${upstream} ${detail}`.trim();
}

function pillClass(kind: "ok" | "bad" | "pending"): string {
  if (kind === "ok") {
    return "rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-200";
  }
  if (kind === "bad") {
    return "rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-200";
  }
  return "rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-100";
}

function statField(report: RTCStats, key: string): unknown {
  return (report as unknown as Record<string, unknown>)[key];
}

function waitForIceGathering(pc: RTCPeerConnection, timeoutMs: number): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const finish = () => {
      pc.removeEventListener("icegatheringstatechange", onChange);
      window.clearTimeout(timer);
      resolve();
    };
    const onChange = () => {
      if (pc.iceGatheringState === "complete") finish();
    };
    pc.addEventListener("icegatheringstatechange", onChange);
    const timer = window.setTimeout(finish, timeoutMs);
  });
}

async function releaseSession(signallingPath: string, sessionPath: string | null) {
  if (!sessionPath) return;
  await fetch(signallingPath, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionPath }),
  }).catch(() => undefined);
}

export default function WolfGroundWebRtcWorkspace({
  title = "WOLF Test Ground WebRTC",
  eyebrow = "Tools",
  description = "Direct WebRTC live video streaming test.",
  signallingPath = WOLF_GROUND_WEBRTC_PATH,
  idleDetail = "This page uses WebRTC only. It does not play HLS.",
  publishUrl,
  lowDelay = false,
  showPhoneTelemetry = true,
  showFieldCapture = showPhoneTelemetry,
}: WolfWebRtcWorkspaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sessionRef = useRef<string | null>(null);
  const attemptRef = useRef(0);
  const statsTimerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const [connection, setConnection] = useState<ConnectionStatus>("idle");
  const [stream, setStream] = useState<StreamStatus>("waiting");
  const [needsGesture, setNeedsGesture] = useState(false);
  const [diagnostics, setDiagnostics] = useState<Diagnostics>({
    ...EMPTY_DIAGNOSTICS,
    detail: idleDetail,
  });

  const patchDiagnostics = useCallback((patch: Partial<Diagnostics>) => {
    setDiagnostics((current) => ({ ...current, ...patch }));
  }, []);

  const stopStats = useCallback(() => {
    if (statsTimerRef.current !== null) {
      window.clearInterval(statsTimerRef.current);
      statsTimerRef.current = null;
    }
  }, []);

  const closePeer = useCallback(() => {
    stopStats();
    const pc = pcRef.current;
    pcRef.current = null;
    if (pc) pc.close();
    const session = sessionRef.current;
    sessionRef.current = null;
    void releaseSession(signallingPath, session);
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
  }, [signallingPath, stopStats]);

  const readStats = useCallback(
    async (pc: RTCPeerConnection, attempt: number) => {
      if (attemptRef.current !== attempt) return;
      const stats = await pc.getStats();
      let selectedId = "";
      let roundTrip = "Not reported";
      stats.forEach((report) => {
        const selectedPair = statField(report, "selectedCandidatePairId");
        if (report.type === "transport" && typeof selectedPair === "string") {
          selectedId = selectedPair;
        }
      });
      let candidate = "None selected";
      stats.forEach((report) => {
        const nominated = statField(report, "nominated") === true;
        const state = statField(report, "state");
        const selected =
          report.type === "candidate-pair" &&
          (report.id === selectedId || (nominated && state === "succeeded"));
        const rtt = statField(report, "currentRoundTripTime");
        if (!selected) return;
        if (typeof rtt === "number") roundTrip = `${Math.round(rtt * 1000)} ms`;
        const local = stats.get(String(statField(report, "localCandidateId") ?? ""));
        const remote = stats.get(String(statField(report, "remoteCandidateId") ?? ""));
        const describe = (entry: RTCStats | undefined, fallback: string) => {
          if (!entry) return fallback;
          return `${String(statField(entry, "protocol"))} ${String(statField(entry, "candidateType"))} ${String(statField(entry, "address"))}:${String(statField(entry, "port"))}`;
        };
        candidate = `${describe(local, "local unknown")} → ${describe(remote, "remote unknown")}`;
      });

      let frames = "0 decoded";
      let jitterBuffer = "Not reported";
      stats.forEach((report) => {
        if (report.type !== "inbound-rtp" || statField(report, "kind") !== "video") return;
        const decoded = Number(statField(report, "framesDecoded") ?? 0);
        const lost = Number(statField(report, "packetsLost") ?? 0);
        frames = `${decoded} decoded, ${lost} packets lost`;
        const emitted = Number(statField(report, "jitterBufferEmittedCount") ?? 0);
        const delay = Number(statField(report, "jitterBufferDelay") ?? 0);
        if (emitted > 0) jitterBuffer = `${Math.round((delay / emitted) * 1000)} ms`;
        if (decoded > 0) {
          setStream("receiving");
          setConnection("connected");
          setDiagnostics((current) => {
            if (current.firstFrame !== "Not measured") return current;
            return {
              ...current,
              firstFrame: `${Math.round(performance.now() - startedAtRef.current)} ms from connect`,
            };
          });
        }
      });
      patchDiagnostics({ roundTrip, jitterBuffer, frames, candidate, ice: pc.iceConnectionState });
    },
    [patchDiagnostics],
  );

  const connect = useCallback(async () => {
    const attempt = ++attemptRef.current;
    const alive = () => attemptRef.current === attempt;
    closePeer();
    startedAtRef.current = performance.now();
    setConnection("gathering");
    setStream("waiting");
    setNeedsGesture(false);
    setDiagnostics({
      ...EMPTY_DIAGNOSTICS,
      connection: "Gathering local candidates",
      detail: idleDetail,
    });

    const pc = new RTCPeerConnection({ iceServers: [] });
    pcRef.current = pc;
    pc.addTransceiver("video", { direction: "recvonly" });
    pc.addTransceiver("audio", { direction: "recvonly" });

    const tightenDelay = () => {
      if (!lowDelay) return;
      for (const receiver of pc.getReceivers()) {
        const hint = receiver as RTCRtpReceiver & {
          playoutDelayHint?: number;
          jitterBufferTarget?: number;
        };
        hint.playoutDelayHint = 0;
        if ("jitterBufferTarget" in hint) hint.jitterBufferTarget = 0;
      }
    };

    pc.addEventListener("track", (event) => {
      if (!alive()) return;
      tightenDelay();
      const video = videoRef.current;
      if (!video) return;
      const [media] = event.streams;
      if (media) video.srcObject = media;
      video.muted = true;
      void video.play().catch((error: unknown) => {
        const name = error instanceof DOMException ? error.name : "";
        if (name === "NotAllowedError") setNeedsGesture(true);
      });
    });

    pc.addEventListener("connectionstatechange", () => {
      if (!alive()) return;
      patchDiagnostics({ connection: pc.connectionState, ice: pc.iceConnectionState });
      if (pc.connectionState === "connected") setConnection("connected");
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setConnection("failed");
        setStream("failed");
        patchDiagnostics({
          detail: `Peer connection ${pc.connectionState}. Media did not stay up. This page will not switch to HLS.`,
        });
      }
    });

    try {
      const offer = await pc.createOffer();
      if (!alive()) return;
      await pc.setLocalDescription(offer);
      await waitForIceGathering(pc, 4000);
      if (!alive() || !pc.localDescription) return;

      setConnection("signalling");
      patchDiagnostics({ connection: "Posting WHEP offer" });
      const response = await fetch(signallingPath, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: pc.localDescription.sdp,
      });
      if (!alive()) return;

      const contentType = response.headers.get("content-type") ?? "";
      sessionRef.current = response.headers.get("x-wolf-whep-session");
      if (!response.ok || !contentType.includes("sdp")) {
        const failure = (await response.json().catch(() => null)) as {
          error?: string;
          upstreamStatus?: number;
          signallingUrl?: string;
          detail?: string;
        } | null;
        setConnection("failed");
        setStream("failed");
        const url = failure?.signallingUrl ? ` ${failure.signallingUrl}` : "";
        patchDiagnostics({
          connection: "Signalling failed",
          signalling: `HTTP ${response.status}${url}`,
          detail: signallingFailureDetail(failure),
        });
        closePeer();
        return;
      }

      const answer = await response.text();
      const signallingUrl = response.headers.get("x-wolf-whep-url") ?? "WHEP";
      await pc.setRemoteDescription({ type: "answer", sdp: answer });
      tightenDelay();
      if (!alive()) return;
      setConnection("connecting");
      patchDiagnostics({
        connection: "Answer applied",
        signalling: `HTTP ${response.status} ${signallingUrl}`,
        detail: "Waiting for the TCP ICE media path. No TURN server is configured.",
      });

      statsTimerRef.current = window.setInterval(() => {
        void readStats(pc, attempt);
      }, 1000);
    } catch (error) {
      if (!alive()) return;
      setConnection("failed");
      setStream("failed");
      patchDiagnostics({
        connection: "Failed",
        detail: error instanceof Error ? error.message : "WebRTC setup failed.",
      });
      closePeer();
    }
  }, [closePeer, idleDetail, lowDelay, patchDiagnostics, readStats, signallingPath]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void connect();
    }, 0);
    return () => {
      window.clearTimeout(timer);
      attemptRef.current += 1;
      closePeer();
    };
  }, [closePeer, connect]);

  const playFromGesture = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    void video.play().then(() => setNeedsGesture(false));
  };

  return (
    <div className={`${wolfShellClass} px-4 py-6 sm:px-6 sm:py-8`}>
      <header className="mb-6 max-w-3xl">
        <p className={wolfEyebrowClass}>{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-2 text-sm text-white/70">{description}</p>
        {publishUrl ? (
          <p className="mt-2 break-all font-mono text-xs text-white/80">RTMP {publishUrl}</p>
        ) : null}
      </header>

      <div
        className={
          showFieldCapture
            ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,22rem)] lg:items-start"
            : "max-w-4xl"
        }
      >
        <div className={showFieldCapture ? "min-w-0 space-y-4" : "space-y-4"}>
          <section className={`${wolfCardClass} overflow-hidden`} aria-label="WebRTC video">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">Live Video</h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className={pillClass(connection === "connected" ? "ok" : connection === "failed" ? "bad" : "pending")} role="status">
                  Connection {connectionLabel(connection)}
                </span>
                <span className={pillClass(stream === "receiving" ? "ok" : stream === "failed" ? "bad" : "pending")} role="status">
                  Stream {streamLabel(stream)}
                </span>
                <button
                  type="button"
                  onClick={() => void connect()}
                  className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white"
                >
                  Reconnect
                </button>
              </div>
            </div>
            <div className="relative aspect-video bg-black">
              <video
                ref={videoRef}
                className="h-full w-full bg-black object-contain"
                muted
                autoPlay
                playsInline
                controls
              />
              {showPhoneTelemetry ? <WolfPhoneTelemetryOverlay /> : null}
              {needsGesture ? (
                <button
                  type="button"
                  onClick={playFromGesture}
                  className="absolute inset-0 m-auto h-12 w-28 rounded-full bg-white text-sm font-semibold text-black"
                >
                  Play
                </button>
              ) : null}
            </div>
          </section>

          <section className={`${wolfCardClass} px-4 py-4`} aria-label="Connection diagnostics">
            <h2 className="text-sm font-semibold text-white">Diagnostics</h2>
            <dl className="mt-3 grid gap-2 text-sm text-white/75 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-white/45">Connection</dt>
                <dd>{diagnostics.connection}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-white/45">ICE</dt>
                <dd>{diagnostics.ice}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-white/45">Signalling</dt>
                <dd className="break-all">{diagnostics.signalling}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-white/45">Selected candidate</dt>
                <dd className="break-all">{diagnostics.candidate}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-white/45">Frames</dt>
                <dd>{diagnostics.frames}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-white/45">Round trip</dt>
                <dd>{diagnostics.roundTrip}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-white/45">Jitter buffer</dt>
                <dd>{diagnostics.jitterBuffer}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-white/45">Time to first frame</dt>
                <dd>{diagnostics.firstFrame}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-white/65" role="alert">
              {diagnostics.detail}
            </p>
          </section>
        </div>

        {showFieldCapture ? (
          <div className="min-w-0">
            <WolfPhoneFieldCapture layout="sidebar" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
