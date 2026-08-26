"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";

import MarketingPageShell from "@/components/layout/MarketingPageShell";
import {
  BOARD_PORTAL_LOGIN_BACKGROUND_CLASS,
  BOARD_PORTAL_LOGIN_BACKGROUND_QUALITY,
  BOARD_PORTAL_LOGIN_OVERLAY_CLASS,
  OMNITRANSIT_BOARD_PORTAL_LOGIN_BACKGROUND,
} from "@/lib/board-portal-login-branding";
import { OMNITRANSIT_BOARD_PORTAL_ORIGIN } from "@/lib/saec/omnitransit-brand-host";
import { OMNITRANSIT_PORTALS_DEMO_USERNAME } from "@/lib/saec/portals-auth";
import { OMNITRANSIT_DISPLAY_NAME, OMNITRANSIT_WORKSPACE_LOGO_SRC } from "@/lib/saec-surface";
import { marketingFadeIn, MARKETING_CONTENT_CLASS } from "@/lib/marketing-ui";

type Props = {
  companyPath: string;
};

export function OmniTransitBoardPortalLogin({ companyPath }: Props) {
  const [username, setUsername] = useState(OMNITRANSIT_PORTALS_DEMO_USERNAME);
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
          returnTo: OMNITRANSIT_BOARD_PORTAL_ORIGIN,
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

  const formCard = (
    <div className={`relative w-full max-w-md ${marketingFadeIn}`}>
      <div className="mb-5 flex flex-col items-center gap-3">
        <Image
          src={OMNITRANSIT_WORKSPACE_LOGO_SRC}
          alt={OMNITRANSIT_DISPLAY_NAME}
          width={240}
          height={48}
          className="h-12 w-auto max-w-[280px]"
          priority
        />
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
          {OMNITRANSIT_DISPLAY_NAME}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Board Portal</h1>
        <p className="mt-2 text-sm text-white/65">
          Secure access to board materials, meetings, minutes, and governance information.
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
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-sky-400/60"
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
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-sky-400/60"
            />
          </label>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <MarketingPageShell
      backgroundImage={OMNITRANSIT_BOARD_PORTAL_LOGIN_BACKGROUND}
      backgroundImageClassName={BOARD_PORTAL_LOGIN_BACKGROUND_CLASS}
      backgroundImageQuality={BOARD_PORTAL_LOGIN_BACKGROUND_QUALITY}
      overlayClassName={BOARD_PORTAL_LOGIN_OVERLAY_CLASS}
      contentClassName={`${MARKETING_CONTENT_CLASS} flex min-h-[100dvh] items-center justify-center px-4 py-10 text-white`}
    >
      {formCard}
    </MarketingPageShell>
  );
}
