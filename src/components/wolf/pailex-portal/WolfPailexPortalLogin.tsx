"use client";

import { FormEvent, useState } from "react";

import MarketingPageShell from "@/components/layout/MarketingPageShell";
import { marketingFadeIn, MARKETING_CONTENT_CLASS } from "@/lib/marketing-ui";

type Props = {
  companyPath: string;
  companyName: string;
  suggestedUsername: string;
  companyLogoSrc?: string;
};

export function WolfPailexPortalLogin({
  companyPath,
  companyName,
  suggestedUsername,
  companyLogoSrc,
}: Props) {
  const [username, setUsername] = useState(suggestedUsername);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
          returnTo: window.location.origin,
        }),
      });
      const data = (await response.json()) as { redirectPath?: string; error?: string };
      if (!response.ok || !data.redirectPath) {
        throw new Error(data.error ?? "Invalid username or password.");
      }
      window.location.assign(`/${companyPath}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
      setBusy(false);
    }
  }

  const formCard = (
    <div className={`relative w-full max-w-md ${marketingFadeIn}`}>
      <div className="mb-5 flex flex-col items-center gap-3">
        {companyLogoSrc ? (
          <span className="inline-flex items-center justify-center overflow-hidden rounded-xl shadow-[0_1px_0_rgba(255,255,255,0.35)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={companyLogoSrc}
              alt={companyName}
              className="h-14 w-auto max-w-[240px] object-contain object-center"
              decoding="async"
            />
          </span>
        ) : (
          <p className="text-2xl font-bold tracking-[0.14em] text-emerald-100">{companyName}</p>
        )}
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
          WOLF Client Portal
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#071018]/90 p-6 shadow-[0_24px_64px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <h1 className="text-xl font-semibold tracking-tight text-white">{companyName} programme access</h1>
        <p className="mt-1 text-sm text-white/55">Sign in with your programme username.</p>
        <form className="mt-5 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <div>
            <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
              Username
            </label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50"
            />
          </div>
          {error ? (
            <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <MarketingPageShell
      contentClassName={`${MARKETING_CONTENT_CLASS} flex min-h-[100dvh] items-center justify-center px-4 py-10`}
    >
      {formCard}
    </MarketingPageShell>
  );
}
