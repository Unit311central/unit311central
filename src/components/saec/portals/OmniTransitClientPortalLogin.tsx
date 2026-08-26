"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";

import { OMNITRANSIT_CLIENT_PORTAL_ORIGIN } from "@/lib/saec/omnitransit-brand-host";
import { OMNITRANSIT_PORTALS_DEMO_USERNAME } from "@/lib/saec/portals-auth";
import { OMNITRANSIT_DISPLAY_NAME, OMNITRANSIT_WORKSPACE_LOGO_SRC } from "@/lib/saec-surface";
import { marketingFadeIn, MARKETING_CONTENT_CLASS } from "@/lib/marketing-ui";

type Props = {
  companyPath: string;
  companyName: string;
};

export function OmniTransitClientPortalLogin({ companyPath, companyName }: Props) {
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
          returnTo: OMNITRANSIT_CLIENT_PORTAL_ORIGIN,
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
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 via-sky-50 to-slate-100">
        <div
          className={`flex min-h-[100dvh] items-center justify-center px-4 py-10 ${MARKETING_CONTENT_CLASS}`}
        >
          <div className={`w-full max-w-md ${marketingFadeIn}`}>
            <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
              <div className="mb-6 flex items-center justify-between gap-4">
                <Image
                  src={OMNITRANSIT_WORKSPACE_LOGO_SRC}
                  alt={OMNITRANSIT_DISPLAY_NAME}
                  width={200}
                  height={40}
                  className="h-9 w-auto"
                  priority
                />
                <span className="rounded-full bg-sky-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-sky-800">
                  Client portal
                </span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {companyName}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                Service & maintenance portal
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                View installations, equipment status, maintenance schedules, and service requests.
              </p>

              <form className="mt-6 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
                <label className="block text-sm">
                  <span className="text-slate-600">Email</span>
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">Password</span>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                {error ? <p className="text-sm text-rose-600">{error}</p> : null}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-60"
                >
                  {busy ? "Signing in…" : "Sign in"}
                </button>
              </form>
            </div>
          </div>
        </div>
    </div>
  );
}
