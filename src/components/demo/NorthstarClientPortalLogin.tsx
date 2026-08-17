"use client";

import { FormEvent, useState } from "react";

import MarketingPageShell from "@/components/layout/MarketingPageShell";
import NorthstarLogoMark from "@/components/layout/NorthstarLogoMark";
import {
  BOARD_PORTAL_LOGIN_BACKGROUND,
  BOARD_PORTAL_LOGIN_BACKGROUND_CLASS,
  BOARD_PORTAL_LOGIN_BACKGROUND_QUALITY,
  BOARD_PORTAL_LOGIN_OVERLAY_CLASS,
} from "@/lib/board-portal-login-branding";
import { DEMO_SITE_URL } from "@/lib/app-domains";
import {
  SHEFFIELD_PORTAL_USERNAME,
  type NorthstarDemoClientPortalRoute,
} from "@/lib/demo/northstar-client-portal-routes";
import { marketingFadeIn, MARKETING_CONTENT_CLASS } from "@/lib/marketing-ui";

type Props = {
  route: NorthstarDemoClientPortalRoute;
};

export function NorthstarClientPortalLogin({ route }: Props) {
  const [username, setUsername] = useState(route.username || SHEFFIELD_PORTAL_USERNAME);
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
          next: route.redirectPath,
          returnTo: DEMO_SITE_URL,
        }),
      });
      const data = (await response.json()) as {
        redirectPath?: string;
        error?: string;
      };
      if (!response.ok || !data.redirectPath) {
        throw new Error(data.error ?? "Invalid username or password.");
      }
      window.location.assign(route.redirectPath);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
      setBusy(false);
    }
  }

  const formCard = (
    <div className={`relative w-full max-w-md ${marketingFadeIn}`}>
      <div className="mb-5 flex flex-col items-center gap-3">
        <NorthstarLogoMark height={52} maxWidth={280} priority />
        <span className="inline-flex items-center justify-center overflow-hidden rounded-xl bg-white px-4 py-2.5 shadow-[0_1px_0_rgba(255,255,255,0.35)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={route.companyLogoSrc}
            alt={route.companyName}
            className="h-10 w-auto max-w-[220px] object-contain object-center"
            decoding="async"
          />
        </span>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300/70">
          Northstar Client Portal
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          {route.companyName} Portal Login
        </h1>
        <p className="mt-2 text-sm text-white/65">
          Sign in to view programme status, documents, and support for your Atlas deployment.
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
            {busy ? "Signing in…" : "Sign in to portal"}
          </button>
        </form>
      </div>
      <p className="mt-4 text-center text-xs text-white/35">
        Northstar Industrial Technologies · {route.companyName}
      </p>
    </div>
  );

  return (
    <MarketingPageShell
      backgroundImage={BOARD_PORTAL_LOGIN_BACKGROUND}
      backgroundImageClassName={BOARD_PORTAL_LOGIN_BACKGROUND_CLASS}
      backgroundImageQuality={BOARD_PORTAL_LOGIN_BACKGROUND_QUALITY}
      overlayClassName={BOARD_PORTAL_LOGIN_OVERLAY_CLASS}
      contentClassName={`${MARKETING_CONTENT_CLASS} flex min-h-[100dvh] items-center justify-center px-4 py-10 text-white`}
    >
      {formCard}
    </MarketingPageShell>
  );
}
