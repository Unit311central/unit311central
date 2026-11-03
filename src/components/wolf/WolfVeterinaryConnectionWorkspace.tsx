"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Link2, Mic, Stethoscope, Video, Zap } from "lucide-react";

import MessagingCallRoom from "@/components/messaging/MessagingCallRoom";
import { wolfCardClass, wolfEyebrowClass, wolfShellClass } from "@/components/wolf/wolf-ui";
import {
  fetchCachedJson,
  PLATFORM_CACHE_KEYS,
} from "@/lib/platform-fetch-cache";
import type { ManagedUser } from "@/lib/user-management-data";
import { filterWolfMessagingOperators } from "@/lib/wolf/wolf-messaging-operators";
import {
  WOLF_VET_EVALUATION_ROOM,
  WOLF_VET_WORKFLOW_STEPS,
} from "@/lib/wolf/wolf-vet-evaluation";

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(response.ok ? "Invalid server response." : text.slice(0, 180));
  }
}

function formatOperatorLabel(operator: ManagedUser) {
  const email = operator.email || (operator.username.includes("@") ? operator.username : "");
  if (email) {
    const localPart = email.split("@")[0]?.trim();
    if (localPart) return `${localPart}@`;
    return email;
  }
  if (operator.username) return `@${operator.username}`;
  return operator.fullName || "Operator";
}

export default function WolfVeterinaryConnectionWorkspace() {
  const searchParams = useSearchParams();
  const callParam = searchParams.get("call");
  const modeParam = searchParams.get("mode") === "voice" ? "voice" : "video";

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [hostOperatorId, setHostOperatorId] = useState("");
  const [activeSession, setActiveSession] = useState<{
    sessionId: string;
    mode: "voice" | "video";
  } | null>(callParam ? { sessionId: callParam, mode: modeParam } : null);
  const [guestLink, setGuestLink] = useState<string | null>(null);
  const [hostLink, setHostLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [creatingInstant, setCreatingInstant] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeOperators = useMemo(
    () => users.filter((user) => user.status === "Active"),
    [users],
  );
  const hostOperator = activeOperators.find((operator) => operator.id === hostOperatorId);

  useEffect(() => {
    if (callParam) setActiveSession({ sessionId: callParam, mode: modeParam });
  }, [callParam, modeParam]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setUsersLoading(true);
      try {
        const data = await fetchCachedJson<{ users?: ManagedUser[] }>(
          PLATFORM_CACHE_KEYS.users,
          "/api/users",
          { ttlMs: 60_000, timeoutMs: 15_000 },
        );
        if (cancelled) return;
        const nextUsers = filterWolfMessagingOperators(data.users ?? []);
        setUsers(nextUsers);
        const firstActive = nextUsers.find((user) => user.status === "Active");
        setHostOperatorId((current) => current || firstActive?.id || "");
      } catch {
        if (!cancelled) setError("Could not load WOLF operators for this call.");
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const parseCallLink = useCallback((callLink: string) => {
    const match = callLink.match(/\/meet\/(voice|video)\/([^/?#]+)/i);
    if (!match?.[1] || !match[2]) throw new Error("Invalid call link returned");
    return {
      sessionId: match[2],
      mode: match[1] === "voice" ? ("voice" as const) : ("video" as const),
    };
  }, []);

  const startEvaluationCall = async (type: "voice" | "video") => {
    if (!hostOperator) {
      setError("Select who you are in the field (ranger or vet) before starting the call.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/messaging/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callType: type,
          channelRoom: WOLF_VET_EVALUATION_ROOM,
          hostOperatorId: hostOperator.id,
          hostOperatorName: hostOperator.fullName,
        }),
      });
      const data = await readApiJson<{
        callLink?: string;
        guestLink?: string | null;
        error?: string;
      }>(response);
      if (!response.ok || !data.callLink) {
        throw new Error(data.error ?? "Failed to create evaluation room");
      }
      const parsed = parseCallLink(data.callLink);
      setHostLink(data.callLink);
      setGuestLink(data.guestLink ?? null);
      setActiveSession(parsed);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Failed to start call");
    } finally {
      setBusy(false);
    }
  };

  const createInstantForVet = async () => {
    if (!hostOperator) {
      setError("Select your operator identity first.");
      return;
    }
    setCreatingInstant(true);
    setError(null);
    setLinkCopied(false);
    try {
      const response = await fetch("/api/messaging/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callType: "video",
          instantMeeting: true,
          channelRoom: WOLF_VET_EVALUATION_ROOM,
          hostOperatorId: hostOperator.id,
          hostOperatorName: hostOperator.fullName,
        }),
      });
      const data = await readApiJson<{
        callLink?: string;
        guestLink?: string | null;
        error?: string;
      }>(response);
      if (!response.ok || !data.callLink || !data.guestLink) {
        throw new Error(data.error ?? "Failed to create vet guest link");
      }
      const parsed = parseCallLink(data.callLink);
      setHostLink(data.callLink);
      setGuestLink(data.guestLink);
      setActiveSession(parsed);
    } catch (createError) {
      setError(
        createError instanceof Error ? createError.message : "Failed to create Instant Meeting",
      );
    } finally {
      setCreatingInstant(false);
    }
  };

  async function copyGuestLink() {
    if (!guestLink) return;
    await navigator.clipboard.writeText(guestLink);
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 2000);
  }

  return (
    <div className={`${wolfShellClass} px-4 py-6 sm:px-6 sm:py-8`}>
      <header className="mb-6 max-w-3xl">
        <p className={wolfEyebrowClass}>Tools</p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-white">
          <Stethoscope className="h-7 w-7 text-teal-300" aria-hidden />
          Veterinary Connection
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Bring expert veterinary support closer to the field. Rangers capture evidence on WebRTC;
          reserve vets join the same evaluation call using WOLF Communications (voice, video, screen
          share).
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,22rem)] xl:items-start">
        <div className="min-w-0 space-y-4">
          <section className={`${wolfCardClass} px-4 py-4`}>
            <h2 className="text-sm font-semibold text-white">Evaluation workflow</h2>
            <ol className="mt-3 space-y-3 text-sm text-white/75">
              {WOLF_VET_WORKFLOW_STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-xs font-semibold text-teal-100">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-white">{step.title}</p>
                    <p className="mt-0.5 text-white/65">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/dashboard?view=wolf-ground-webrtc"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
              >
                Open field capture (WebRTC)
              </Link>
              <Link
                href={`/dashboard?view=communications&channel=${encodeURIComponent(WOLF_VET_EVALUATION_ROOM)}`}
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
              >
                Full Communications view
              </Link>
            </div>
          </section>

          <section
            className={`${wolfCardClass} min-h-[min(50dvh,520px)] overflow-hidden`}
            aria-label="Veterinary evaluation call"
          >
            {activeSession ? (
              <div className="flex h-full min-h-[min(50dvh,520px)] flex-col">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-teal-100">
                  <span className="inline-flex items-center gap-2">
                    {activeSession.mode === "voice" ? (
                      <Mic className="h-3.5 w-3.5" />
                    ) : (
                      <Video className="h-3.5 w-3.5" />
                    )}
                    Live {activeSession.mode} evaluation
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSession(null)}
                    className="rounded-md px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white"
                  >
                    End panel
                  </button>
                </div>
                <div className="min-h-0 flex-1">
                  <MessagingCallRoom
                    sessionId={activeSession.sessionId}
                    expectedMode={activeSession.mode}
                    embedded
                  />
                </div>
              </div>
            ) : (
              <div className="flex min-h-[min(50dvh,520px)] flex-col items-center justify-center gap-3 px-6 text-center">
                <Video className="h-10 w-10 text-white/25" />
                <p className="text-sm font-semibold text-white/80">No live evaluation call</p>
                <p className="max-w-md text-sm text-white/45">
                  Start a video call with the reserve vet, or create an Instant Meeting link for a
                  guest veterinarian.
                </p>
                {(busy || creatingInstant) && (
                  <p className="inline-flex items-center gap-2 text-sm text-white/50">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparing room…
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-4">
          <section className={`${wolfCardClass} px-4 py-4`}>
            <h2 className="text-sm font-semibold text-white">You are</h2>
            <select
              value={hostOperatorId}
              onChange={(event) => setHostOperatorId(event.target.value)}
              className="mt-3 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-teal-400/50"
            >
              {usersLoading ? (
                <option value="">Loading operators…</option>
              ) : activeOperators.length === 0 ? (
                <option value="">No operators on allowlist</option>
              ) : (
                activeOperators.map((operator) => (
                  <option key={operator.id} value={operator.id}>
                    {formatOperatorLabel(operator)}
                  </option>
                ))
              )}
            </select>
            <p className="mt-2 text-xs text-white/50">
              Same operator directory as Business Prod → Communications (WOLF allowlist).
            </p>
          </section>

          <section className={`${wolfCardClass} px-4 py-4`}>
            <h2 className="text-sm font-semibold text-white">Start call</h2>
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                disabled={creatingInstant || busy || !hostOperator}
                onClick={() => void createInstantForVet()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
              >
                {creatingInstant ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Instant meeting (vet guest link)
              </button>
              <button
                type="button"
                disabled={busy || !hostOperator}
                onClick={() => void startEvaluationCall("video")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2.5 text-sm font-semibold text-sky-100 hover:bg-sky-500/20 disabled:opacity-50"
              >
                <Video className="h-4 w-4" />
                Video evaluation
              </button>
              <button
                type="button"
                disabled={busy || !hostOperator}
                onClick={() => void startEvaluationCall("voice")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-50"
              >
                <Mic className="h-4 w-4" />
                Voice only
              </button>
            </div>
            {error ? (
              <p className="mt-3 text-sm text-red-300" role="alert">
                {error}
              </p>
            ) : null}
          </section>

          <section className={`${wolfCardClass} px-4 py-4`}>
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-teal-300" />
              <h2 className="text-sm font-semibold text-white">Vet guest link</h2>
            </div>
            {guestLink ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-white/60">
                  Send this to the reserve vet — no WOLF login required.
                </p>
                <p className="break-all rounded-lg border border-teal-400/25 bg-teal-500/10 px-3 py-2 text-xs text-teal-50">
                  {guestLink}
                </p>
                <button
                  type="button"
                  onClick={() => void copyGuestLink()}
                  className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  {linkCopied ? "Copied" : "Copy link"}
                </button>
              </div>
            ) : (
              <p className="mt-2 text-xs text-white/50">
                Create an Instant Meeting or start a video call to generate a shareable guest link.
              </p>
            )}
            {hostLink ? (
              <p className="mt-3 break-all text-[11px] text-white/40">
                Host link: {hostLink}
              </p>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
