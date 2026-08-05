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
    ? "Overview Login"
    : isBoard
      ? "Board Member Login"
      : `${companyName} Portal Login`;
  const blurb = isOverview
    ? "Sign in to view the private OnwardAir overview."
    : isBoard
      ? "Sign in to access board materials, meetings, and governance views."
      : `Sign in to the ${companyName} client portal.`;

  return (
    <div
      className={
        isOverview
          ? "relative flex min-h-screen items-center justify-center px-4 py-10 text-[#1B2430]"
          : "flex min-h-screen items-center justify-center bg-[#061018] px-4 py-10 text-white"
      }
    >
      {isOverview ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url(/images/workspaces/onwardair-login-bg.png)" }}
            aria-hidden
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(244,250,251,0.88) 50%, rgba(255,255,255,0.94) 100%)",
            }}
            aria-hidden
          />
        </>
      ) : null}
      <div className="relative w-full max-w-md">
        <div className="mb-5 flex flex-col items-center gap-3">
          {isOverview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/unit311central-login.webp"
                alt="Unit311 Central"
                className="h-9 w-auto max-w-[200px] object-contain"
                decoding="async"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/workspaces/onwardair-logo-dark.png"
                alt="OnwardAir"
                className="h-11 w-auto max-w-[260px] object-contain"
                decoding="async"
              />
            </>
          ) : (
            <OnwardAirLogoMark height={52} maxWidth={280} priority />
          )}
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
        <div
          className={
            isOverview
              ? "rounded-2xl border border-[#267B90]/25 bg-white px-6 py-7 shadow-[0_12px_40px_rgba(38,123,144,0.12)]"
              : "rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
          }
        >
          <p
            className={
              isOverview
                ? "text-[10px] font-semibold uppercase tracking-[0.18em] text-[#267B90]"
                : "text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300/70"
            }
          >
            {eyebrow}
          </p>
          <h1
            className={
              isOverview
                ? "mt-2 text-2xl font-semibold tracking-tight text-[#1B2430]"
                : "mt-2 text-2xl font-semibold tracking-tight text-white"
            }
          >
            {title}
          </h1>
          <p
            className={
              isOverview
                ? "mt-2 text-sm text-[#5B6577]"
                : "mt-2 text-sm text-white/65"
            }
          >
            {blurb}
          </p>

          <form className="mt-6 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            <label className="block text-sm">
              <span className={isOverview ? "text-[#5B6577]" : "text-white/55"}>Email</span>
              <input
                type="email"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={
                  isOverview
                    ? "mt-1 w-full rounded-lg border border-[#267B90]/25 bg-white px-3 py-2.5 text-[#1B2430] outline-none focus:border-[#267B90]"
                    : "mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-teal-400/60"
                }
              />
            </label>
            <label className="block text-sm">
              <span className={isOverview ? "text-[#5B6577]" : "text-white/55"}>Password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={
                  isOverview
                    ? "mt-1 w-full rounded-lg border border-[#267B90]/25 bg-white px-3 py-2.5 text-[#1B2430] outline-none focus:border-[#267B90]"
                    : "mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-teal-400/60"
                }
              />
            </label>
            {error ? (
              <p
                className={
                  isOverview
                    ? "rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                    : "rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
                }
              >
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
        <p
          className={
            isOverview
              ? "mt-4 text-center text-xs text-[#5B6577]"
              : "mt-4 text-center text-xs text-white/35"
          }
        >
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
