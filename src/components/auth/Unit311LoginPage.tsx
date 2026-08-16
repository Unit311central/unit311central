"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import MarketingPageShell from "@/components/layout/MarketingPageShell";
import CorpCentreLogoMark from "@/components/layout/CorpCentreLogoMark";
import NorthstarLogoMark from "@/components/layout/NorthstarLogoMark";
import AbhiLogoMark from "@/components/layout/AbhiLogoMark";
import OnwardAirLogoMark from "@/components/layout/OnwardAirLogoMark";
import TalantonLogoMark from "@/components/layout/TalantonLogoMark";
import {
  parseLoginReturnTo,
  parseSafePostLoginNext,
  workspacePostLoginUrl,
} from "@/lib/app-domains";
import { marketingFadeIn, MARKETING_CONTENT_CLASS } from "@/lib/marketing-ui";
import { navigateRedirectPath } from "@/lib/navigate-redirect";
import { SITE_NAME } from "@/lib/site";
import {
  TALANTON_LOGIN_BACKGROUND,
  TALANTON_LOGIN_BACKGROUND_CLASS,
  TALANTON_LOGIN_BACKGROUND_QUALITY,
  TALANTON_LOGIN_OVERLAY_CLASS,
  TALANTON_PORTALS_LOGIN_BACKGROUND,
  TALANTON_PORTALS_LOGIN_BACKGROUND_CLASS,
  TALANTON_PORTALS_LOGIN_OVERLAY_CLASS,
} from "@/lib/talanton/login-branding";
import {
  ABHI_LOGIN_BACKGROUND,
  ABHI_LOGIN_BACKGROUND_CLASS,
  ABHI_LOGIN_BACKGROUND_QUALITY,
  ABHI_LOGIN_OVERLAY_CLASS,
} from "@/lib/abhi/login-branding";

/** Dark engineering/infrastructure background (4K). */
const LOGIN_BACKGROUND = "/images/login-workspace-bg.webp";
/** OnwardAir marketing hero (Vertex VTOL on helipad) — subtle login backdrop. */
const ONWARDAIR_LOGIN_BACKGROUND = "/images/workspaces/onwardair-login-bg.png";
/** High-resolution Unit311 Central mark (transparent, Retina-ready). */
const LOGIN_LOGO = "/images/unit311central-login.webp";
const LOGIN_LOGO_WIDTH = 1462;
const LOGIN_LOGO_HEIGHT = 334;

const RETURN_TO_STORAGE_KEY = "unit311_workspace_return_to";
const NEXT_STORAGE_KEY = "unit311_post_login_next";
const CORPCENTRE_SAVED_LOGIN_KEY = "corpcentre_login_saved_details";
const ONWARDAIR_SAVED_LOGIN_KEY = "onwardair_login_saved_details";

type SavedLoginDetails = {
  username: string;
  password: string;
};

function readSavedLogin(storageKey: string): SavedLoginDetails | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedLoginDetails>;
    const username = typeof parsed.username === "string" ? parsed.username : "";
    const password = typeof parsed.password === "string" ? parsed.password : "";
    if (!username && !password) return null;
    return { username, password };
  } catch {
    return null;
  }
}

function writeSavedLogin(storageKey: string, details: SavedLoginDetails | null) {
  if (typeof window === "undefined") return;
  try {
    if (!details || (!details.username && !details.password)) {
      localStorage.removeItem(storageKey);
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify(details));
  } catch {
    // Ignore quota / private mode failures.
  }
}

function readReturnToFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("return_to");
  return parseLoginReturnTo(raw)?.origin ?? null;
}

/** Relative company-portal paths may arrive as return_to=/{company}. */
function readPortalReturnPathFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("return_to");
  if (!raw?.startsWith("/") || raw.startsWith("//")) return null;
  return parseSafePostLoginNext(raw);
}

function readNextFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("next");
  // ABHI portals briefing deep-link — keep even if path allowlists lag behind.
  if (raw === "/portals" || raw?.startsWith("/portals/") || raw?.startsWith("/portals?")) {
    return raw.startsWith("/portals/") || raw.startsWith("/portals?")
      ? parseSafePostLoginNext(raw) ?? "/portals"
      : "/portals";
  }
  return parseSafePostLoginNext(raw) ?? readPortalReturnPathFromLocation();
}

function readPersistedReturnTo(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return parseLoginReturnTo(sessionStorage.getItem(RETURN_TO_STORAGE_KEY))?.origin ?? null;
  } catch {
    return null;
  }
}

function readPersistedNext(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return parseSafePostLoginNext(sessionStorage.getItem(NEXT_STORAGE_KEY));
  } catch {
    return null;
  }
}

function persistReturnTo(origin: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (origin) sessionStorage.setItem(RETURN_TO_STORAGE_KEY, origin);
    else sessionStorage.removeItem(RETURN_TO_STORAGE_KEY);
  } catch {
    // Ignore quota / private mode failures.
  }
}

function persistNext(next: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (next) sessionStorage.setItem(NEXT_STORAGE_KEY, next);
    else sessionStorage.removeItem(NEXT_STORAGE_KEY);
  } catch {
    // Ignore quota / private mode failures.
  }
}

/**
 * After auth, never stay on apex when the user started from a workspace/demo/internal host.
 * The API redirect is authoritative when absolute; otherwise fall back by return target kind.
 */
function resolveReturnNavigationTarget(
  apiRedirectPath: string,
  returnOrigin: string,
): string {
  if (/^https?:\/\//i.test(apiRedirectPath)) {
    return apiRedirectPath;
  }

  const loginReturn = parseLoginReturnTo(returnOrigin);
  if (loginReturn?.kind === "workspace") {
    return workspacePostLoginUrl(returnOrigin, "dashboard");
  }
  if (loginReturn?.kind === "demo" || loginReturn?.kind === "internal") {
    const next = parseSafePostLoginNext(apiRedirectPath) ?? "/";
    return `${loginReturn.origin}${next === "/" ? "/" : next}`;
  }
  return apiRedirectPath;
}

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text.slice(0, 120) || "Unexpected server response");
  }
}

export default function Unit311LoginPage({
  variant = "default",
  brand = "default",
  workspaceName = null,
  returnTo = null,
  nextPath = null,
  portalsLogin = false,
}: {
  variant?: "default" | "central";
  /** Tenant login branding. CorpCentre / Talanton / ABHI / OnwardAir / customer / northstar use workspace branding. */
  brand?: "default" | "central" | "corpcentre" | "talanton" | "abhi" | "onwardair" | "customer" | "northstar";
  /** Display name for generic customer hosts (e.g. Acme). */
  workspaceName?: string | null;
  /** Validated return origin (`return_to`) for workspace / demo / internal. */
  returnTo?: string | null;
  /** Canonical deep-link path (`next`), e.g. `/?view=clients`. */
  nextPath?: string | null;
  /** Talanton /portals/login — dedicated overview portal entry (not main org login). */
  portalsLogin?: boolean;
}) {
  const router = useRouter();
  const isCentral =
    variant === "central" ||
    brand === "corpcentre" ||
    brand === "talanton" ||
    brand === "abhi" ||
    brand === "onwardair" ||
    brand === "customer";
  const isCorpCentre = brand === "corpcentre";
  const isTalanton = brand === "talanton";
  const isAbhi = brand === "abhi";
  const isOnwardAir = brand === "onwardair";
  const isNorthstar = brand === "northstar";
  const isCustomer = brand === "customer";
  const customerLabel = workspaceName?.trim() || "Workspace";
  const portalsNext =
    nextPath === "/portals" ||
    Boolean(nextPath?.startsWith("/portals/") || nextPath?.startsWith("/portals?"));
  const isTalantonPortalsLogin = isTalanton && (portalsLogin || portalsNext);
  const isAbhiPortalsLogin = isAbhi && portalsNext;
  const isOnwardAirPortalsLogin = isOnwardAir && portalsNext;
  const canSaveLogin = isCorpCentre || isOnwardAir;
  const savedLoginKey = isOnwardAir ? ONWARDAIR_SAVED_LOGIN_KEY : CORPCENTRE_SAVED_LOGIN_KEY;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saveForFuture, setSaveForFuture] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const fromUrl = readReturnToFromLocation() ?? returnTo;
    if (fromUrl) persistReturnTo(fromUrl);
    const nextFromUrl = readNextFromLocation() ?? nextPath;
    // Bare /login must not reuse a stale deep-link (e.g. /portals) from an earlier visit.
    if (nextFromUrl) persistNext(nextFromUrl);
    else persistNext(null);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("passwordReset") === "1") {
        setResetNotice(
          "Password updated. Sign in with your new password. A confirmation email was sent (it does not include your password).",
        );
        params.delete("passwordReset");
        const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
        window.history.replaceState({}, "", next);
      }
    }
  }, [returnTo, nextPath]);

  useEffect(() => {
    if (!canSaveLogin) return;
    const saved = readSavedLogin(savedLoginKey);
    if (!saved) return;
    setUsername(saved.username);
    setPassword(saved.password);
    setSaveForFuture(true);
  }, [canSaveLogin, savedLoginKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const workspaceReturnTo =
      readReturnToFromLocation() ?? returnTo ?? readPersistedReturnTo();
    // Prefer the URL/prop next only — do not fall back to a stale sessionStorage deep-link
    // when the user opened plain /login (should land on the platform dashboard).
    const deepLinkNext = readNextFromLocation() ?? nextPath;
    // Demo / Internal hosts must always return to themselves after login.
    let effectiveReturnTo = workspaceReturnTo;
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      if (host === "demo.unit311central.com" || host === "demo.localhost") {
        effectiveReturnTo = `${window.location.protocol}//${window.location.host}`;
      } else if (host === "internal.unit311central.com" || host === "internal.localhost") {
        effectiveReturnTo = `${window.location.protocol}//${window.location.host}`;
      }
    }
    if (effectiveReturnTo) persistReturnTo(effectiveReturnTo);
    persistNext(deepLinkNext);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          ...(effectiveReturnTo ? { returnTo: effectiveReturnTo } : {}),
          ...(deepLinkNext ? { next: deepLinkNext } : {}),
        }),
      });

      const data = await readApiJson<{
        redirectPath?: string;
        error?: string;
        userType?: string;
      }>(response);
      if (!response.ok || !data.redirectPath) {
        throw new Error(data.error ?? "Invalid username or password.");
      }

      if (canSaveLogin) {
        if (saveForFuture) {
          writeSavedLogin(savedLoginKey, { username, password });
        } else {
          writeSavedLogin(savedLoginKey, null);
        }
      }

      persistNext(null);

      // Absolute API redirects are authoritative (dashboard vs /portals deep-link).
      if (/^https?:\/\//i.test(data.redirectPath)) {
        window.location.assign(data.redirectPath);
        return;
      }

      // External company-portal redirects from the API are authoritative — never
      // collapse them back to workspace /dashboard via return_to handling.
      if (data.userType === "external") {
        window.location.assign(data.redirectPath);
        return;
      }

      if (effectiveReturnTo) {
        window.location.assign(
          resolveReturnNavigationTarget(data.redirectPath, effectiveReturnTo),
        );
        return;
      }

      navigateRedirectPath(data.redirectPath, router);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <MarketingPageShell
      backgroundImage={
        isOnwardAir
          ? ONWARDAIR_LOGIN_BACKGROUND
          : isTalantonPortalsLogin
            ? TALANTON_PORTALS_LOGIN_BACKGROUND
            : isTalanton
              ? TALANTON_LOGIN_BACKGROUND
              : isAbhi
                ? ABHI_LOGIN_BACKGROUND
                : LOGIN_BACKGROUND
      }
      backgroundImageClassName={
        isOnwardAir
          ? "object-cover object-[center_40%] opacity-[0.38] sm:object-center"
          : isTalantonPortalsLogin
            ? TALANTON_PORTALS_LOGIN_BACKGROUND_CLASS
            : isTalanton
              ? TALANTON_LOGIN_BACKGROUND_CLASS
              : isAbhi
                ? ABHI_LOGIN_BACKGROUND_CLASS
                : "object-cover object-[center_35%] opacity-80 sm:object-center"
      }
      backgroundImageQuality={
        isTalanton ? TALANTON_LOGIN_BACKGROUND_QUALITY : isAbhi ? ABHI_LOGIN_BACKGROUND_QUALITY : 92
      }
      overlayClassName={
        isOnwardAir
          ? "absolute inset-0 bg-gradient-to-b from-[#020617]/72 via-[#020617]/78 to-[#020617]/88"
          : isTalantonPortalsLogin
            ? TALANTON_PORTALS_LOGIN_OVERLAY_CLASS
            : isTalanton
              ? TALANTON_LOGIN_OVERLAY_CLASS
              : isAbhi
                ? ABHI_LOGIN_OVERLAY_CLASS
                : "absolute inset-0 bg-[#020617]/45"
      }
      contentClassName={`${MARKETING_CONTENT_CLASS} flex min-h-[100dvh] flex-col items-center justify-center py-12 sm:py-16`}
    >
      <div
        className={`flex w-full flex-col items-center ${isTalantonPortalsLogin ? "max-w-[640px]" : "max-w-[480px]"} ${marketingFadeIn}`}
      >
        {/* Fixed aspect logo slot — compact mark above the card */}
        <div className="flex w-full items-center justify-center px-2">
          {isCorpCentre ? (
            <CorpCentreLogoMark height={56} className="rounded-2xl px-4 py-3" />
          ) : isTalanton ? (
            <TalantonLogoMark height={56} />
          ) : isAbhi ? (
            <AbhiLogoMark height={50} tone="onDark" priority />
          ) : isOnwardAir ? (
            <OnwardAirLogoMark height={90} maxWidth={500} priority />
          ) : isNorthstar ? (
            <NorthstarLogoMark height={70} maxWidth={400} priority />
          ) : isCustomer ? (
            <div className="rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-4">
              <p className="text-center text-[1.35rem] font-semibold tracking-tight text-white">
                {customerLabel}
              </p>
            </div>
          ) : (
            <div
              className="relative w-full max-w-[min(100%,240px)] sm:max-w-[280px]"
              style={{ aspectRatio: `${LOGIN_LOGO_WIDTH} / ${LOGIN_LOGO_HEIGHT}` }}
            >
              <Image
                src={LOGIN_LOGO}
                alt={SITE_NAME}
                fill
                priority
                sizes="(max-width: 640px) 240px, 280px"
                className="object-contain object-center drop-shadow-[0_8px_28px_rgba(0,0,0,0.45)]"
              />
            </div>
          )}
        </div>

        <div className="mt-10 w-full text-center sm:mt-12">
          <h1
            className={
              isTalantonPortalsLogin || isAbhiPortalsLogin
                ? "whitespace-nowrap text-[1.15rem] font-semibold tracking-[-0.04em] text-white min-[400px]:text-[1.45rem] sm:text-[1.85rem] md:text-[2.125rem]"
                : "text-[1.75rem] font-semibold tracking-[-0.035em] text-white sm:text-[2.125rem]"
            }
          >
            {isCorpCentre
              ? "Corp.Centre Login"
              : isTalantonPortalsLogin
                ? "Talantom Impact Overview Portal"
                : isAbhiPortalsLogin
                  ? "ABHI Overview Portal"
                  : isTalanton
                  ? "Talanton Impact"
                  : isAbhi
                  ? "ABHI Login"
                  : isOnwardAirPortalsLogin
                    ? "OnwardAir Demo Information Page"
                    : isOnwardAir
                      ? "OnwardAir Login"
                      : isNorthstar
                        ? "Northstar Industrial Technologies Login"
                      : isCustomer
                        ? `${customerLabel} Login`
                        : "Workspace Login"}
          </h1>
          <p className="mx-auto mt-3 max-w-[22rem] text-[14px] leading-relaxed text-white/55 sm:mt-3.5 sm:max-w-xl sm:text-[15px]">
            {isCorpCentre
              ? "Secure access to your Corp.Centre workspace"
              : isTalantonPortalsLogin
                ? "A Overview portals page for Harry Turner for Unit311 Central customised Talanton Impact Platform."
                : isAbhiPortalsLogin
                  ? "An overview portal page for Peter Ellingworth for Unit311 Central customised ABHI Platform."
                  : isTalanton
                  ? "Talanton & Portfolio Business Operating and Intelligence Platform"
                  : isAbhi
                  ? "Secure access to your ABHI workspace"
                  : isOnwardAirPortalsLogin
                    ? "Secure access to your OnwardAir demo portal page"
                    : isOnwardAir
                      ? "Secure access to your OnwardAir workspace"
                      : isNorthstar
                        ? "Secure access to Northstar Industrial Technologies"
                      : isCustomer
                        ? `Secure access to your ${customerLabel} workspace`
                        : "Secure Access to your Workspace"}
          </p>
        </div>

        <div className="mt-9 w-full rounded-[26px] border border-white/[0.1] bg-gradient-to-b from-white/[0.1] to-white/[0.035] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:mt-11 sm:rounded-[30px] sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-7">
            <div>
              <label
                htmlFor="username"
                className="mb-2.5 block text-[13px] font-medium tracking-[0.01em] text-white/70"
              >
                {isCentral ? "Email Address" : "Username"}
              </label>
              <input
                id="username"
                name="username"
                type={isCentral ? "email" : "text"}
                autoComplete="username"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6] disabled:opacity-60"
                placeholder={
                  isCorpCentre
                    ? "you@corpcentre.com.au"
                    : isTalanton
                      ? "demo@talantonimpact.com"
                      : isOnwardAir
                        ? "you@onwardair.tech"
                        : isCustomer
                          ? "you@company.com"
                          : isCentral
                            ? "you@unit311central.com"
                            : "Enter username"
                }
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2.5 block text-[13px] font-medium tracking-[0.01em] text-white/70"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3.5 pr-12 text-[15px] text-white placeholder:text-white/30 focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6] disabled:opacity-60"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-white/45 transition-colors hover:text-white/80"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {canSaveLogin ? (
              <label className="flex cursor-pointer items-start gap-2.5 select-none">
                <input
                  type="checkbox"
                  checked={saveForFuture}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setSaveForFuture(checked);
                    if (!checked) writeSavedLogin(savedLoginKey, null);
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-white/25 bg-white/[0.06] text-[#2563eb] focus:ring-[#3b82f6] focus:ring-offset-0"
                />
                <span className="text-[13px] leading-snug text-white/70">
                  <span className="font-medium tracking-[0.01em]">Save for future login</span>
                  <span className="mt-0.5 block text-[11px] text-white/40">
                    Stores email and password on this device. Session uses a secure cookie.
                  </span>
                </span>
              </label>
            ) : null}

            {resetNotice ? (
              <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-200">
                {resetNotice}
              </p>
            ) : null}

            {error ? (
              <p className="rounded-xl border border-red-400/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-[3.25rem] w-full items-center justify-center rounded-xl bg-[#2563eb] px-6 text-[15px] font-semibold text-white shadow-[0_0_40px_rgba(37,99,235,0.28)] transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Signing In…" : "Sign In"}
            </button>

            <p className="pt-1 text-center text-sm">
              <Link
                href="/resetpassword"
                className="font-medium text-[#93c5fd]/90 transition-colors hover:text-[#bfdbfe] hover:underline"
              >
                Reset Password
              </Link>
            </p>
          </form>
        </div>
      </div>
    </MarketingPageShell>
  );
}
