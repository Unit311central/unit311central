"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

import SaecDiscoveryLogo from "@/components/saec-discovery/SaecDiscoveryLogo";
import { invalidatePlatformWhoamiCache } from "@/lib/platform-fetch-cache";
import {
  SAEC_LOGIN_BACKGROUND,
  SAEC_LOGIN_BACKGROUND_CLASS,
  SAEC_LOGIN_OVERLAY_CLASS,
} from "@/lib/saec/login-branding";

type SaecDiscoveryLoginProps = {
  onAuthenticated: () => void;
};

function readLoginFields(form: HTMLFormElement) {
  const usernameInput = form.elements.namedItem("username");
  const passwordInput = form.elements.namedItem("password");
  const username =
    usernameInput instanceof HTMLInputElement ? usernameInput.value.trim() : "";
  const password = passwordInput instanceof HTMLInputElement ? passwordInput.value : "";
  return { username, password };
}

export default function SaecDiscoveryLogin({ onAuthenticated }: SaecDiscoveryLoginProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncFieldsFromDom = useCallback(() => {
    const form = formRef.current;
    if (!form) return;
    const { username: nextUsername, password: nextPassword } = readLoginFields(form);
    setUsername((current) => (current === nextUsername ? current : nextUsername));
    setPassword((current) => (current === nextPassword ? current : nextPassword));
  }, []);

  useEffect(() => {
    syncFieldsFromDom();
    const timers = [0, 100, 300, 800].map((delay) =>
      window.setTimeout(syncFieldsFromDom, delay),
    );
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [syncFieldsFromDom]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const { username: submittedUsername, password: submittedPassword } = readLoginFields(
      event.currentTarget,
    );

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: submittedUsername, password: submittedPassword }),
      });
      const payload = (await response.json()) as { redirectPath?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to sign in.");
      }
      invalidatePlatformWhoamiCache();
      onAuthenticated();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 py-8 text-white">
      <div
        className={`pointer-events-none absolute inset-0 bg-cover bg-center ${SAEC_LOGIN_BACKGROUND_CLASS}`}
        style={{ backgroundImage: `url(${SAEC_LOGIN_BACKGROUND})` }}
        aria-hidden
      />
      <div className={`pointer-events-none absolute inset-0 ${SAEC_LOGIN_OVERLAY_CLASS}`} aria-hidden />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1524]/90 p-8 shadow-[0_24px_64px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/images/unit311central-login.webp"
            alt="Unit311 Central"
            width={1462}
            height={334}
            className="h-8 w-auto max-w-[220px] object-contain"
            priority
          />
          <div className="mt-4">
            <SaecDiscoveryLogo height={32} maxWidth={130} priority />
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/85">
            SAEC Discovery
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Current Systems Discovery
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Sign in to continue. Your saved draft will be restored after login.
          </p>
        </div>

        <form
          ref={formRef}
          className="mt-8 space-y-4"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <div>
            <label htmlFor="saec-discovery-email" className="mb-1.5 block text-sm text-white/75">
              Email
            </label>
            <input
              id="saec-discovery-email"
              name="username"
              type="email"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              onInput={(event) => setUsername(event.currentTarget.value)}
              className="w-full rounded-lg border border-white/10 bg-[#070f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-sky-400/50"
            />
          </div>
          <div>
            <label htmlFor="saec-discovery-password" className="mb-1.5 block text-sm text-white/75">
              Password
            </label>
            <input
              id="saec-discovery-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onInput={(event) => setPassword(event.currentTarget.value)}
              className="w-full rounded-lg border border-white/10 bg-[#070f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-sky-400/50"
            />
          </div>
          {error ? <p className="text-sm text-rose-200/90">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-lg bg-[#1F4FBF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Continue"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
