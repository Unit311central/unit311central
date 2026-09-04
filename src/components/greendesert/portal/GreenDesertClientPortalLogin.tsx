"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import MarketingPageShell from "@/components/layout/MarketingPageShell";
import GreenDesertLogoMark from "@/components/layout/GreenDesertLogoMark";
import {
  BOARD_PORTAL_LOGIN_BACKGROUND,
  BOARD_PORTAL_LOGIN_BACKGROUND_CLASS,
  BOARD_PORTAL_LOGIN_BACKGROUND_QUALITY,
  BOARD_PORTAL_LOGIN_OVERLAY_CLASS,
} from "@/lib/board-portal-login-branding";
import { GREENDESERT_CLIENT_PORTAL_ORIGIN } from "@/lib/greendesert/client-portal-routes";
import { GREENDESERT_DISPLAY_NAME } from "@/lib/greendesert-surface";
import { marketingFadeIn, MARKETING_CONTENT_CLASS } from "@/lib/marketing-ui";

type Props = {
  companyPath: string;
  companyName: string;
  suggestedUsername: string;
};

export function GreenDesertClientPortalLogin({
  companyPath,
  companyName,
  suggestedUsername,
}: Props) {
  const [username, setUsername] = useState(suggestedUsername);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
          returnTo: GREENDESERT_CLIENT_PORTAL_ORIGIN,
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
    <MarketingPageShell
      backgroundImage={BOARD_PORTAL_LOGIN_BACKGROUND}
      backgroundImageClassName={BOARD_PORTAL_LOGIN_BACKGROUND_CLASS}
      backgroundImageQuality={BOARD_PORTAL_LOGIN_BACKGROUND_QUALITY}
      overlayClassName={BOARD_PORTAL_LOGIN_OVERLAY_CLASS}
      contentClassName={`${MARKETING_CONTENT_CLASS} flex min-h-[100dvh] items-center justify-center px-4 py-10 text-white`}
    >
      <div className={`relative w-full max-w-md ${marketingFadeIn}`}>
        <div className="mb-5 flex flex-col items-center gap-3">
          <div className="rounded-2xl bg-white px-6 py-4 shadow-lg">
            <GreenDesertLogoMark height={100} maxWidth={160} priority />
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
            {GREENDESERT_DISPLAY_NAME} Client Portal
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{companyName}</h1>
          <p className="mt-2 text-sm text-white/65">
            Sign in to view projects, documents, and support for your organisation.
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
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-emerald-400/60"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/55">Password</span>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 pr-11 text-white outline-none focus:border-emerald-400/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((c) => !c)}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-white/45 hover:text-white/80"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            {error ? (
              <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign in to client portal"}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-white/35">
          {companyName} · {GREENDESERT_DISPLAY_NAME} · Confidential
        </p>
      </div>
    </MarketingPageShell>
  );
}
