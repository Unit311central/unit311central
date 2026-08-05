"use client";

import Link from "next/link";

import { ONWARDAIR_HOME_ACCENT } from "@/lib/onwardair-surface";

const UNIT311_LOGO = "/images/unit311central-login.webp";
const HERO_BG = "/images/workspaces/onwardair-login-bg.png";

const QUESTIONS = [
  "Can you see the health of your business in real time?",
  "Can you get a trusted answer about your business — quickly?",
  "Are your teams switching between too many applications?",
  "Do you know where your biggest business risks are?",
  "Do you have complete visibility of projects, people, and finances?",
] as const;

const FOCUS = [
  {
    title: "Exec view",
    detail: "Cash, Seed progress, and runway in one glance — not another spreadsheet hunt.",
  },
  {
    title: "Board portal",
    detail: "Give advisors a secure board view without building a separate pack every quarter.",
  },
  {
    title: "Engineering + finance",
    detail: "Vertex / FLEX gates and programme risk next to the numbers leadership already watches.",
  },
  {
    title: "Role-based access",
    detail: "CEO, finance, engineering, and board each see what they need — nothing more.",
  },
] as const;

const INVITE = [
  { wave: "First 25 min", who: "Scott · Brian · Monte", why: "Leadership picture & offer" },
  { wave: "Next 20 min", who: "+ Engineering leads", why: "Programmes, risk, day-to-day tools" },
  { wave: "Last 15 min", who: "Core three", why: "6-month build plan & next steps" },
] as const;

export function OnwardAirOverviewPage() {
  return (
    <div className="oa-overview min-h-screen bg-white text-[#1B2430]">
      <style>{`
        @keyframes oaFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes oaDrawLine {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes oaHubPulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.7; }
        }
        .oa-overview .fade-up {
          animation: oaFadeUp 0.7s ease-out both;
        }
        .oa-overview .fade-up-d1 { animation-delay: 0.08s; }
        .oa-overview .fade-up-d2 { animation-delay: 0.16s; }
        .oa-overview .fade-up-d3 { animation-delay: 0.24s; }
        .oa-overview .fade-up-d4 { animation-delay: 0.32s; }
        .oa-overview .accent-line {
          transform-origin: left center;
          animation: oaDrawLine 0.9s ease-out 0.2s both;
        }
        .oa-overview .hub-pulse {
          animation: oaHubPulse 3.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .oa-overview .fade-up,
          .oa-overview .accent-line,
          .oa-overview .hub-pulse {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      <header className="relative overflow-hidden border-b border-[#267B90]/20">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.14]"
          style={{ backgroundImage: `url(${HERO_BG})` }}
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(165deg, rgba(255,255,255,0.92) 0%, rgba(238,248,250,0.88) 45%, rgba(255,255,255,0.96) 100%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-3xl flex-col gap-8 px-5 pb-14 pt-8 sm:px-8 sm:pb-16 sm:pt-10">
          <div className="fade-up flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/workspaces/onwardair-logo-dark.png"
                alt="OnwardAir"
                className="h-10 w-auto max-w-[200px] object-contain"
                decoding="async"
              />
              <span className="hidden h-8 w-px bg-[#267B90]/30 sm:block" aria-hidden />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={UNIT311_LOGO}
                alt="Unit311 Central"
                className="h-8 w-auto max-w-[140px] object-contain"
                decoding="async"
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
                window.location.assign("/overview/login");
              }}
              className="text-xs font-medium text-[#5B6577] underline-offset-2 hover:text-[#267B90] hover:underline"
            >
              Sign out
            </button>
          </div>

          <div className="fade-up fade-up-d1 max-w-xl">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: ONWARDAIR_HOME_ACCENT }}
            >
              For Scott &amp; the OnwardAir team
            </p>
            <h1 className="mt-3 text-[2rem] font-semibold leading-[1.15] tracking-tight text-[#1B2430] sm:text-[2.6rem]">
              Your business.
              <br />
              <span style={{ color: ONWARDAIR_HOME_ACCENT }}>Connected. Intelligent.</span>
            </h1>
            <div
              className="accent-line mt-5 h-[3px] w-24 rounded-full"
              style={{ backgroundColor: ONWARDAIR_HOME_ACCENT }}
            />
            <p className="mt-5 text-base leading-relaxed text-[#5B6577] sm:text-lg">
              A short look at a platform shaped around how OnwardAir actually runs — cash, Seed,
              Vertex / FLEX, and a board view your advisors can use — without another stack of
              apps.
            </p>
          </div>

          <svg
            className="hub-pulse fade-up fade-up-d2 pointer-events-none absolute -right-6 top-24 hidden h-40 w-40 sm:block md:right-8"
            viewBox="0 0 120 120"
            fill="none"
            aria-hidden
          >
            <circle cx="60" cy="60" r="10" fill={ONWARDAIR_HOME_ACCENT} opacity="0.9" />
            {[0, 60, 120, 180, 240, 300].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const x = 60 + Math.cos(rad) * 42;
              const y = 60 + Math.sin(rad) * 42;
              return (
                <g key={deg}>
                  <line
                    x1="60"
                    y1="60"
                    x2={x}
                    y2={y}
                    stroke={ONWARDAIR_HOME_ACCENT}
                    strokeWidth="1.5"
                    opacity="0.45"
                  />
                  <circle cx={x} cy={y} r="5" fill={ONWARDAIR_HOME_ACCENT} opacity="0.55" />
                </g>
              );
            })}
          </svg>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <section className="fade-up fade-up-d2">
          <h2 className="text-lg font-semibold tracking-tight text-[#1B2430] sm:text-xl">
            Could your business be operating more effectively?
          </h2>
          <ul className="mt-6 space-y-0">
            {QUESTIONS.map((q, i) => (
              <li
                key={q}
                className="flex gap-4 border-b border-[#267B90]/15 py-4 first:border-t"
                style={{ animationDelay: `${0.28 + i * 0.06}s` }}
              >
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ backgroundColor: ONWARDAIR_HOME_ACCENT }}
                >
                  {i + 1}
                </span>
                <p className="text-[15px] leading-snug text-[#1B2430] sm:text-base">{q}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="fade-up fade-up-d3 mt-14">
          <h2 className="text-lg font-semibold tracking-tight text-[#1B2430] sm:text-xl">
            What Unit311 Central is
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#5B6577]">
            An intelligent operations platform for growing companies — consolidate day-to-day
            operations where it makes sense, connect the specialist systems you keep, and give
            every person trusted information from one place.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              "Consolidate applications where it makes sense",
              "Connect the systems you already rely on",
              "Turn business information into insight",
            ].map((item) => (
              <li
                key={item}
                className="rounded-xl border border-[#267B90]/25 bg-[#F4FAFB] px-4 py-4 text-sm leading-snug text-[#1B2430]"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm leading-relaxed text-[#5B6577]">
            In a previous SME, even as a CTO for 25+ years, I lived with 30+ applications — each
            with its own sign-on, little interoperability. Unit311 Central would have cut that
            stack by at least 75%.
          </p>
        </section>

        <section className="fade-up fade-up-d4 mt-14">
          <h2 className="text-lg font-semibold tracking-tight text-[#1B2430] sm:text-xl">
            Built around how OnwardAir runs
          </h2>
          <p className="mt-2 text-sm text-[#5B6577]">
            Four things worth an hour of your time — not a module catalogue.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {FOCUS.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-[#267B90]/20 bg-white p-5 shadow-[0_1px_0_rgba(38,123,144,0.08)]"
              >
                <div
                  className="mb-3 h-1 w-10 rounded-full"
                  style={{ backgroundColor: ONWARDAIR_HOME_ACCENT }}
                />
                <h3 className="text-base font-semibold text-[#1B2430]">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5B6577]">{card.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="mt-14 rounded-2xl px-5 py-8 text-white sm:px-8"
          style={{ backgroundColor: ONWARDAIR_HOME_ACCENT }}
        >
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">The offer</h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/90">
            Six months free. We build it with you — around Vertex, FLEX, Seed, Houston ops, and
            the way your team already works. Not a generic trial.
          </p>
        </section>

        <section className="mt-14">
          <h2 className="text-lg font-semibold tracking-tight text-[#1B2430] sm:text-xl">
            60-minute working session
          </h2>
          <p className="mt-2 text-sm text-[#5B6577]">
            Not a slide deck. A live walkthrough — then we decide if it&apos;s for you.
          </p>
          <div className="mt-6 space-y-3">
            {INVITE.map((row) => (
              <div
                key={row.wave}
                className="flex flex-col gap-1 rounded-xl border border-[#267B90]/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-[#267B90]">
                  {row.wave}
                </p>
                <p className="text-sm font-medium text-[#1B2430] sm:flex-1">{row.who}</p>
                <p className="text-sm text-[#5B6577]">{row.why}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 rounded-xl border border-dashed border-[#267B90]/35 bg-[#F4FAFB] px-4 py-3 text-sm text-[#5B6577]">
            Full workspace access opens about 24 hours before we meet — not before. This page is
            only the invitation.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="mailto:paul@unit311central.com?subject=OnwardAir%2060-minute%20session&body=Scott%20—%20happy%20to%20lock%20a%2060-minute%20slot.%20Please%20include%20Brian%20and%20Monte%20if%20you%20can."
              className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              style={{ backgroundColor: ONWARDAIR_HOME_ACCENT }}
            >
              Reply to book 60 minutes
            </a>
            <Link
              href="https://unit311central.com"
              className="text-center text-sm font-medium text-[#5B6577] underline-offset-2 hover:text-[#267B90] hover:underline sm:text-left"
            >
              unit311central.com
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#267B90]/15 px-5 py-8 text-center text-xs text-[#5B6577] sm:px-8">
        OnwardAir · Unit311 Central · Private overview · Not a live demo login
      </footer>
    </div>
  );
}
