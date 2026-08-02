"use client";

import { FormEvent, useState } from "react";

import TalantonLogoMark from "@/components/layout/TalantonLogoMark";

type Props = {
  companyPath: string;
  companyName: string;
  suggestedUsername: string;
  portalKind?: "company" | "board";
};

export function CompanyPortalLogin({
  companyPath,
  companyName,
  suggestedUsername,
  portalKind = "company",
}: Props) {
  const isBoard = portalKind === "board";
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
          returnTo: `https://talantonimpact.unit311central.com`,
        }),
      });
      const data = (await response.json()) as {
        redirectPath?: string;
        error?: string;
        userType?: string;
      };
      if (!response.ok || !data.redirectPath) {
        throw new Error(data.error ?? "Invalid username or password.");
      }
      // Always land on this company portal after a successful portal login.
      window.location.assign(`/${companyPath}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07111f] px-4 py-10 text-white">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <TalantonLogoMark height={48} className="rounded-2xl px-4 py-3" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            {isBoard ? "Board Portal" : "Portfolio Company Portal"}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {isBoard ? "Board Portal Login" : `${companyName} Portal Login`}
          </h1>
          <p className="mt-2 text-sm text-white/55">
            {isBoard
              ? "Sign in with your assigned board account to access governance materials, meetings, decks, and the risk register."
              : "Sign in with your assigned company portal account to access training, reports and documents."}
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
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-emerald-400/50"
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
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-emerald-400/50"
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
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
            >
              {busy ? "Signing in…" : isBoard ? "Sign in to Board Portal" : "Sign in to portal"}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-white/35">
          Talanton Impact · {isBoard ? "Board" : companyName}
        </p>
      </div>
    </div>
  );
}
