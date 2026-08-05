"use client";

import { FormEvent, useState } from "react";

import OnwardAirLogoMark from "@/components/layout/OnwardAirLogoMark";

type Props = {
  companyPath: string;
  companyName: string;
  suggestedUsername: string;
  companyLogoSrc?: string;
  portalKind?: "client" | "board" | "overview";
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
  const isOverview = portalKind === "overview";

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

  const eyebrow = isOverview
    ? "Private overview"
    : isBoard
      ? "OnwardAir Board Portal"
      : "OnwardAir Client Portal";
  const title = isOverview
    ? "Private overview of UNIT311 Central for OnwardAir"
    : isBoard
      ? "Board Member Login"
      : `${companyName} Portal Login`;
  const blurb = isOverview
    ? "Sign in to view this private overview."
    : isBoard
      ? "Sign in to access board materials, meetings, and governance views."
      : `Sign in to the ${companyName} client portal.`;

  return (
    <div
      className={
        isOverview
          ? "relative flex min-h-[100dvh] items-center justify-center px-4 py-10 text-white"
          : "flex min-h-screen items-center justify-center bg-[#061018] px-4 py-10 text-white"
      }
    >
      {isOverview ? (
        <>
          {/* Same treatment as onwardair.unit311central.com/login */}
          <div
            className="absolute inset-0 bg-cover bg-[center_40%] bg-no-repeat opacity-[0.38] sm:bg-center"
            style={{ backgroundImage: "url(/images/workspaces/onwardair-login-bg.png)" }}
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-[#020617]/72 via-[#020617]/78 to-[#020617]/88"
            aria-hidden
          />
          <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/workspaces/onwardair-logo.png"
              alt="OnwardAir"
              width={220}
              height={48}
              decoding="async"
              className="block object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]"
              style={{ height: 44, width: "auto", maxWidth: 220, maxHeight: 44 }}
            />
            <a href="https://unit311central.com" aria-label="Unit311 Central">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/unit311central-login.webp"
                alt="Unit311 Central"
                width={220}
                height={48}
                decoding="async"
                className="block object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]"
                style={{ height: 44, width: "auto", maxWidth: 220, maxHeight: 44 }}
              />
            </a>
          </header>
        </>
      ) : null}
      <div className="relative w-full max-w-md">
        {!isOverview ? (
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
        ) : null}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-[2px]">
          {!isOverview ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300/70">
              {eyebrow}
            </p>
          ) : null}
          <h1
            className={
              isOverview
                ? "text-[1.35rem] font-semibold leading-snug tracking-tight text-white sm:text-2xl"
                : "mt-2 text-2xl font-semibold tracking-tight text-white"
            }
          >
            {title}
          </h1>
          <p className="mt-2 text-sm text-white/65">{blurb}</p>

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
              className={
                isOverview
                  ? "w-full rounded-lg bg-[#267B90] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
                  : "w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:opacity-60"
              }
            >
              {busy
                ? "Signing in…"
                : isOverview
                  ? "View overview"
                  : isBoard
                    ? "Sign in to board portal"
                    : "Sign in to portal"}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-white/35">
          OnwardAir ·{" "}
          {isOverview
            ? "Private overview · Unit311 Central"
            : isBoard
              ? "Board Portal · Confidential"
              : companyName}
        </p>
      </div>
    </div>
  );
}
