"use client";

import { ONWARDAIR_HOME_ACCENT } from "@/lib/onwardair-surface";

const UNIT311_LOGO = "/images/unit311central-login.webp";
const OA_LOGO = "/images/workspaces/onwardair-logo-dark.png";
const HERO_BG = "/images/workspaces/onwardair-login-bg.png";

const QUESTIONS = [
  "Can you see the health of your business in real time?",
  "Can you get a trusted answer about your business — quickly?",
  "Are your teams switching between too many applications?",
  "Do you know where your biggest business risks are?",
  "Do you have complete visibility of projects, people, and finances?",
] as const;

const PILLARS = [
  "Consolidate applications where it makes sense",
  "Connect the systems you already rely on",
  "Turn business information into insight",
] as const;

const FOCUS = [
  { title: "Exec view", detail: "Cash, Seed, runway — one glance." },
  { title: "Board portal", detail: "Advisor-safe view without pack scramble." },
  { title: "Eng + finance", detail: "Vertex / FLEX risk next to numbers." },
  { title: "Role-based", detail: "CEO, finance, eng, board — each their view." },
] as const;

const INVITE = [
  { wave: "0–25", who: "Scott · Brian · Monte", why: "Leadership picture" },
  { wave: "25–45", who: "+ Eng leads", why: "Programmes & tools" },
  { wave: "45–60", who: "Core three", why: "Build plan" },
] as const;

export function OnwardAirOverviewPage() {
  return (
    <div className="oa-overview relative h-dvh max-h-dvh overflow-hidden text-[#1B2430]">
      {/* Full-bleed login hero background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_BG})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.94) 0%, rgba(244,250,251,0.90) 40%, rgba(255,255,255,0.92) 100%)",
        }}
        aria-hidden
      />

      <div className="relative flex h-full flex-col px-4 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-5">
        {/* Top bar — small logos left, sign out right */}
        <header className="flex shrink-0 items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={OA_LOGO}
              alt="OnwardAir"
              className="h-6 w-auto max-w-[120px] object-contain sm:h-7 sm:max-w-[140px]"
              decoding="async"
            />
            <span className="h-5 w-px bg-[#267B90]/30" aria-hidden />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={UNIT311_LOGO}
              alt="Unit311 Central"
              className="h-5 w-auto max-w-[100px] object-contain sm:h-6 sm:max-w-[120px]"
              decoding="async"
            />
          </div>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
              window.location.assign("/overview/login");
            }}
            className="text-[11px] font-medium text-[#5B6577] underline-offset-2 hover:text-[#267B90] hover:underline"
          >
            Sign out
          </button>
        </header>

        {/* Row 1 — brand headline */}
        <div className="mt-3 shrink-0 sm:mt-4">
          <h1 className="text-[1.65rem] font-semibold leading-[1.12] tracking-tight sm:text-[2.1rem] lg:text-[2.35rem]">
            Your business.{" "}
            <span style={{ color: ONWARDAIR_HOME_ACCENT }}>Connected. Intelligent.</span>
          </h1>
          <div
            className="mt-2 h-[2px] w-16 rounded-full sm:mt-2.5 sm:w-20"
            style={{ backgroundColor: ONWARDAIR_HOME_ACCENT }}
          />
          <p className="mt-2 max-w-3xl text-[13px] leading-snug text-[#5B6577] sm:text-sm">
            Cash, Seed, Vertex / FLEX, and a board view — without another stack of apps.
          </p>
        </div>

        {/* Row 2 — four columns (true one-pager body) */}
        <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-2.5 overflow-hidden sm:mt-4 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4 lg:gap-3">
          {/* Col 1 — questions */}
          <section className="flex min-h-0 flex-col rounded-xl border border-[#267B90]/20 bg-white/80 p-3 backdrop-blur-[2px] sm:p-3.5">
            <h2 className="shrink-0 text-[13px] font-semibold leading-snug tracking-tight text-[#1B2430] sm:text-sm">
              Could your business be operating more effectively?
            </h2>
            <ul className="mt-2.5 min-h-0 flex-1 space-y-1.5 overflow-hidden">
              {QUESTIONS.map((q, i) => (
                <li key={q} className="flex gap-2">
                  <span
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ backgroundColor: ONWARDAIR_HOME_ACCENT }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-[11px] leading-snug text-[#1B2430] sm:text-[12px]">{q}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Col 2 — what it is */}
          <section className="flex min-h-0 flex-col rounded-xl border border-[#267B90]/20 bg-white/80 p-3 backdrop-blur-[2px] sm:p-3.5">
            <h2 className="shrink-0 text-[13px] font-semibold tracking-tight text-[#1B2430] sm:text-sm">
              What Unit311 Central is
            </h2>
            <p className="mt-2 text-[11px] leading-snug text-[#5B6577] sm:text-[12px]">
              Intelligent operations for growing companies — consolidate where it makes sense,
              connect what you keep, one trusted place for information.
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {PILLARS.map((item) => (
                <li
                  key={item}
                  className="rounded-lg border border-[#267B90]/20 bg-[#F4FAFB]/90 px-2.5 py-2 text-[11px] leading-snug text-[#1B2430] sm:text-[12px]"
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-auto pt-2 text-[10px] leading-snug text-[#5B6577] sm:text-[11px]">
              Prior SME: 30+ apps as CTO. This would have cut that stack ~75%.
            </p>
          </section>

          {/* Col 3 — built around OA */}
          <section className="flex min-h-0 flex-col rounded-xl border border-[#267B90]/20 bg-white/80 p-3 backdrop-blur-[2px] sm:p-3.5">
            <h2 className="shrink-0 text-[13px] font-semibold tracking-tight text-[#1B2430] sm:text-sm">
              Built around how OnwardAir runs
            </h2>
            <p className="mt-1.5 text-[10px] text-[#5B6577] sm:text-[11px]">
              Worth an hour — not a module catalogue.
            </p>
            <div className="mt-2.5 grid min-h-0 flex-1 grid-cols-1 gap-1.5 content-start">
              {FOCUS.map((card) => (
                <article
                  key={card.title}
                  className="rounded-lg border border-[#267B90]/15 bg-white/90 px-2.5 py-2"
                >
                  <div
                    className="mb-1 h-0.5 w-6 rounded-full"
                    style={{ backgroundColor: ONWARDAIR_HOME_ACCENT }}
                  />
                  <h3 className="text-[12px] font-semibold text-[#1B2430]">{card.title}</h3>
                  <p className="mt-0.5 text-[11px] leading-snug text-[#5B6577]">{card.detail}</p>
                </article>
              ))}
            </div>
          </section>

          {/* Col 4 — 60 min session */}
          <section className="flex min-h-0 flex-col rounded-xl border border-[#267B90]/20 bg-white/80 p-3 backdrop-blur-[2px] sm:p-3.5">
            <h2 className="shrink-0 text-[13px] font-semibold tracking-tight text-[#1B2430] sm:text-sm">
              60-minute working session
            </h2>
            <p className="mt-1.5 text-[10px] text-[#5B6577] sm:text-[11px]">
              Live walkthrough — then decide if it&apos;s for you.
            </p>
            <div className="mt-2.5 space-y-1.5">
              {INVITE.map((row) => (
                <div
                  key={row.wave}
                  className="rounded-lg border border-[#267B90]/15 bg-white/90 px-2.5 py-2"
                >
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: ONWARDAIR_HOME_ACCENT }}
                  >
                    {row.wave} min
                  </p>
                  <p className="text-[12px] font-medium text-[#1B2430]">{row.who}</p>
                  <p className="text-[11px] text-[#5B6577]">{row.why}</p>
                </div>
              ))}
            </div>
            <p className="mt-auto pt-2 text-[10px] leading-snug text-[#5B6577] sm:text-[11px]">
              Full workspace opens ~24h before we meet — not before. This page is only the
              invitation.
            </p>
          </section>
        </div>

        <footer className="mt-2 shrink-0 text-center text-[10px] text-[#5B6577]/80 sm:mt-3">
          OnwardAir · Unit311 Central · Private overview
        </footer>
      </div>
    </div>
  );
}
