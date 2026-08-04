"use client";

import { FormEvent, useState } from "react";

import OnwardAirLogoMark from "@/components/layout/OnwardAirLogoMark";

type Props = {
  companyPath: string;
  companyName: string;
  suggestedUsername: string;
  companyLogoSrc?: string;
  portalKind?: "client" | "board";
};

export function OnwardAirClientPortalLogin({
  companyPath,
  companyName,
  suggestedUsername,
  companyLogoSrc,
  portalKind = "client",
}: Props) {
  const [username, setUsername] = useState(suggestedUsername);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isBoard = portalKind === "board";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          next: `/${companyPath}`,
          returnTo: `https://onwardair.unit311central.com`,
        }),
      });
      const data = (await response.json()) as {
        redirectPath?: string;
        error?: string;
      };
      if (!response.ok || !data.redirectPath) {
        throw new Error(data.error ?? "Invalid username or password.");
      }
      window.location.assign(`/${companyPath}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#061018] px-4 py-10 text-white">
      <div className="w-full max-w-md">
        <div className="mb-5 flex flex-col items-center gap-3">
          <OnwardAirLogoMark height={52} maxWidth={280} priority />
          {companyLogoSrc ? (
            <span className="inline-flex items-center justify-center overflow-hidden rounded-xl bg-white px-3 py-1.5 shadow-[0_1px_0_rgba(255,255,255,0.35)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={companyLogoSrc}
                alt={companyName}
                className="h-9 w-auto max-w-[220px] object-contain object-center"
                decoding="async"
              />
            </span>
          ) : null}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300/70">
            {isBoard ? "OnwardAir Board Portal" : "OnwardAir Client Portal"}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {isBoard ? "Board Member Login" : `${companyName} Portal Login`}
          </h1>
          <p className="mt-2 text-sm text-white/55">
            {isBoard
              ? "Sign in to view board packs, meetings, risks, minutes, and governance updates for Vertex VTOL™ / FLEX Pod™."
              : "Sign in to view your Vertex VTOL™ trial fleet, Gulf Coast corridors, and shared programme documents."}
          </p>

          <form className="mt-6 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            <label className="block text-sm">
              <span className="text-white/55">Email</span>
              <input
                type="email"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-teal-400/60"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/55">Password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-teal-400/60"
              />
            </label>
            {error ? (
              <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:opacity-60"
            >
              {busy ? "Signing in…" : isBoard ? "Sign in to board portal" : "Sign in to portal"}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-white/35">
          OnwardAir · {isBoard ? "Board Portal · Confidential" : companyName}
        </p>
      </div>
    </div>
  );
}
