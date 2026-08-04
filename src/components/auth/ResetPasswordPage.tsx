"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import MarketingPageShell from "@/components/layout/MarketingPageShell";
import AbhiLogoMark from "@/components/layout/AbhiLogoMark";
import CorpCentreLogoMark from "@/components/layout/CorpCentreLogoMark";
import OnwardAirLogoMark from "@/components/layout/OnwardAirLogoMark";
import TalantonLogoMark from "@/components/layout/TalantonLogoMark";
import { marketingFadeIn, MARKETING_CONTENT_CLASS } from "@/lib/marketing-ui";
import { PLATFORM_PASSWORD_POLICY_HINT } from "@/lib/platform-password-validation";
import { SITE_NAME } from "@/lib/site";

/** Match Workspace Login visuals. */
const LOGIN_BACKGROUND = "/images/login-workspace-bg.webp";
const LOGIN_LOGO = "/images/unit311central-login.webp";
const LOGIN_LOGO_WIDTH = 1462;
const LOGIN_LOGO_HEIGHT = 334;

type ResetBrand = "default" | "central" | "corpcentre" | "talanton" | "abhi" | "onwardair" | "customer";

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text.slice(0, 120) || "Unexpected server response");
  }
}

function BrandMark({
  brand,
  workspaceName,
}: {
  brand: ResetBrand;
  workspaceName?: string | null;
}) {
  if (brand === "corpcentre") {
    return <CorpCentreLogoMark height={56} className="rounded-2xl px-4 py-3" />;
  }
  if (brand === "talanton") return <TalantonLogoMark height={56} />;
  if (brand === "abhi") return <AbhiLogoMark height={50} tone="onDark" priority />;
  if (brand === "onwardair") return <OnwardAirLogoMark height={48} maxWidth={280} priority />;
  if (brand === "customer") {
    return (
      <div className="rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-4">
        <p className="text-center text-[1.35rem] font-semibold tracking-tight text-white">
          {workspaceName?.trim() || "Workspace"}
        </p>
      </div>
    );
  }
  return (
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
  );
}

export default function ResetPasswordPage({
  brand = "default",
  workspaceName = null,
}: {
  brand?: ResetBrand;
  workspaceName?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const hasToken = token.length > 0;

  const [step, setStep] = useState<"email" | "otp" | "password">(
    hasToken ? "otp" : "email",
  );
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const displayName =
    brand === "onwardair"
      ? "OnwardAir"
      : brand === "abhi"
        ? "ABHI"
        : brand === "talanton"
          ? "Talanton Impact"
          : brand === "corpcentre"
            ? "Corp.Centre"
            : workspaceName?.trim() || SITE_NAME;

  const heading = useMemo(() => {
    if (step === "otp") return "Enter one-time code";
    if (step === "password") return "Choose a new password";
    return "Reset password";
  }, [step]);

  const description = useMemo(() => {
    if (step === "otp") {
      return "We sent a 6-digit code to your authorised email. Enter it below to continue.";
    }
    if (step === "password") {
      return PLATFORM_PASSWORD_POLICY_HINT;
    }
    return `Enter your authorised email address. We will send a one-time code and a link to reset your ${displayName} password.`;
  }, [step, displayName]);

  async function handleRequestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await readApiJson<{ message?: string; error?: string }>(response);
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to send reset email.");
      }

      setSuccess(
        data.message ??
          "If an account matches that email address, we sent a one-time code and reset link.",
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send reset email.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, otp }),
      });

      const data = await readApiJson<{ message?: string; error?: string; verified?: boolean }>(
        response,
      );
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to verify code.");
      }

      setSuccess(data.message ?? "Code verified.");
      setStep("password");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to verify code.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCompleteReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await readApiJson<{ message?: string; error?: string }>(response);
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to reset password.");
      }

      setSuccess(data.message ?? "Your password has been updated.");
      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 1800);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to reset password.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6] disabled:opacity-60";
  const buttonClass =
    "inline-flex h-[3.25rem] w-full items-center justify-center rounded-xl bg-[#2563eb] px-6 text-[15px] font-semibold text-white shadow-[0_0_40px_rgba(37,99,235,0.28)] transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <MarketingPageShell
      backgroundImage={LOGIN_BACKGROUND}
      backgroundImageClassName="object-cover object-[center_35%] opacity-80 sm:object-center"
      backgroundImageQuality={92}
      overlayClassName="absolute inset-0 bg-[#020617]/45"
      contentClassName={`${MARKETING_CONTENT_CLASS} flex min-h-[100dvh] flex-col items-center justify-center py-12 sm:py-16`}
    >
      <div className={`flex w-full max-w-[480px] flex-col items-center ${marketingFadeIn}`}>
        <div className="flex w-full items-center justify-center px-2">
          <BrandMark brand={brand} workspaceName={workspaceName} />
        </div>

        <div className="mt-10 w-full text-center sm:mt-12">
          <h1 className="text-[1.75rem] font-semibold tracking-[-0.035em] text-white sm:text-[2.125rem]">
            {heading}
          </h1>
          <p className="mx-auto mt-3 max-w-[24rem] text-[14px] leading-relaxed text-white/55 sm:mt-3.5 sm:text-[15px]">
            {description}
          </p>
        </div>

        <div className="mt-9 w-full rounded-[26px] border border-white/[0.1] bg-gradient-to-b from-white/[0.1] to-white/[0.035] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:mt-11 sm:rounded-[30px] sm:p-10">
          {step === "password" ? (
            <form onSubmit={handleCompleteReset} className="space-y-7">
              <div>
                <label htmlFor="password" className="mb-2.5 block text-[13px] font-medium tracking-[0.01em] text-white/70">
                  New password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={inputClass}
                  placeholder={PLATFORM_PASSWORD_POLICY_HINT}
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2.5 block text-[13px] font-medium tracking-[0.01em] text-white/70"
                >
                  Confirm new password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={inputClass}
                  placeholder="Enter password again"
                />
              </div>

              {error ? (
                <p className="rounded-xl border border-red-400/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-300">
                  {error}
                </p>
              ) : null}

              {success ? (
                <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-200">
                  {success}
                </p>
              ) : null}

              <button type="submit" disabled={busy} className={buttonClass}>
                {busy ? "Updating password…" : "Update password"}
              </button>
            </form>
          ) : step === "otp" ? (
            <form onSubmit={handleVerifyOtp} className="space-y-7">
              <div>
                <label htmlFor="otp" className="mb-2.5 block text-[13px] font-medium tracking-[0.01em] text-white/70">
                  One-time code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  className={`${inputClass} tracking-[0.35em]`}
                  placeholder="6-digit code"
                />
              </div>

              {error ? (
                <p className="rounded-xl border border-red-400/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-300">
                  {error}
                </p>
              ) : null}

              {success ? (
                <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-200">
                  {success}
                </p>
              ) : null}

              <button type="submit" disabled={busy || otp.length !== 6} className={buttonClass}>
                {busy ? "Verifying…" : "Submit code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRequestReset} className="space-y-7">
              <div>
                <label htmlFor="email" className="mb-2.5 block text-[13px] font-medium tracking-[0.01em] text-white/70">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                  placeholder={
                    brand === "onwardair"
                      ? "you@onwardair.tech"
                      : brand === "central"
                        ? "you@unit311central.com"
                        : "you@company.com"
                  }
                />
              </div>

              {error ? (
                <p className="rounded-xl border border-red-400/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-300">
                  {error}
                </p>
              ) : null}

              {success ? (
                <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-200">
                  {success}
                </p>
              ) : null}

              <button type="submit" disabled={busy} className={buttonClass}>
                {busy ? "Sending…" : "Send one-time code"}
              </button>
            </form>
          )}

          <p className="mt-7 pt-1 text-center text-sm">
            <Link
              href="/login"
              className="font-medium text-[#93c5fd]/90 transition-colors hover:text-[#bfdbfe] hover:underline"
            >
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </MarketingPageShell>
  );
}
