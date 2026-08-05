"use client";

import { ONWARDAIR_HOME_ACCENT } from "@/lib/onwardair-surface";

const UNIT311_LOGO = "/images/unit311central-login.webp";
const OA_LOGO = "/images/workspaces/onwardair-logo.png";
/** Generic corporate / AI / BI backdrop — not the OA aircraft login hero. */
const HERO_BG = "/images/overview-corporate-intelligence-bg.png";
/** Drop the walkthrough file here — column is ready. */
const WALKTHROUGH_VIDEO = "/videos/onwardair-overview-walkthrough.mp4";

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
    <div className="oa-overview relative min-h-[100dvh] text-white xl:h-dvh xl:max-h-dvh xl:overflow-hidden">
      {/* Corporate / AI / BI backdrop (login keeps the OA aircraft hero) */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.48]"
        style={{ backgroundImage: `url(${HERO_BG})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#020617]/70 via-[#020617]/76 to-[#020617]/86"
        aria-hidden
      />

      <div className="relative flex min-h-[100dvh] flex-col px-3 py-3 sm:px-5 sm:py-4 lg:px-6 lg:py-4 xl:h-full xl:min-h-0">
        {/* Top bar — Unit311 TL · OnwardAir + Sign out TR */}
        <header className="flex shrink-0 items-center justify-between gap-3">
          <a href="https://unit311central.com" aria-label="Unit311 Central">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={UNIT311_LOGO}
              alt="Unit311 Central"
              width={180}
              height={44}
              decoding="async"
              className="block object-contain object-left drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]"
              style={{ height: 40, width: "auto", maxWidth: 180, maxHeight: 40 }}
            />
          </a>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={OA_LOGO}
              alt="OnwardAir"
              width={220}
              height={48}
              decoding="async"
              className="block object-contain object-right drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]"
              style={{ height: 44, width: "auto", maxWidth: 220, maxHeight: 44 }}
            />
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
                window.location.assign("/overview/login");
              }}
              className="inline-flex min-h-11 touch-manipulation items-center px-2 text-xs font-medium text-white/70 underline-offset-2 hover:text-white hover:underline sm:min-h-0 sm:text-[11px]"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Row 1 — brand headline (space under logos) */}
        <div className="mt-7 shrink-0 sm:mt-9 lg:mt-10">
          <h1 className="text-[1.45rem] font-semibold leading-[1.12] tracking-tight text-white sm:text-[1.85rem] lg:text-[2.1rem]">
            Your business.{" "}
            <span style={{ color: ONWARDAIR_HOME_ACCENT }}>Connected. Intelligent.</span>
          </h1>
          <div
            className="mt-1.5 h-[2px] w-14 rounded-full sm:w-16"
            style={{ backgroundColor: ONWARDAIR_HOME_ACCENT }}
          />
          <p className="mt-1.5 max-w-3xl text-[12px] leading-snug text-white/65 sm:text-[13px]">
            Cash, Seed, Vertex / FLEX, and a board view — without another stack of apps.
          </p>
        </div>

        {/* Row 2 — 2 stacked-box cols + wider video */}
        <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-2.5 overflow-y-auto sm:mt-4 sm:grid-cols-2 sm:gap-3 xl:mt-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.85fr)] xl:gap-3 xl:overflow-hidden">
          {/* Col 1 — questions (top) + Unit311 (bottom) */}
          <div className="flex min-h-0 flex-col gap-2.5 overflow-y-auto xl:overflow-hidden">
            <section className="flex shrink-0 flex-col rounded-xl border border-[#267B90]/20 bg-white/85 p-2.5 backdrop-blur-[2px] sm:p-3">
              <h2 className="text-[12px] font-semibold leading-snug tracking-tight text-[#1B2430] sm:text-[13px]">
                Could your business be operating more effectively?
              </h2>
              <ul className="mt-2 space-y-1">
                {QUESTIONS.map((q, i) => (
                  <li key={q} className="flex gap-1.5">
                    <span
                      className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
                      style={{ backgroundColor: ONWARDAIR_HOME_ACCENT }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-[10px] leading-snug text-[#1B2430] sm:text-[11px]">{q}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-[#267B90]/20 bg-white/85 p-2.5 backdrop-blur-[2px] sm:p-3">
              <h2 className="shrink-0 text-[12px] font-semibold tracking-tight text-[#1B2430] sm:text-[13px]">
                What Unit311 Central is
              </h2>
              <p className="mt-1.5 text-[10px] leading-snug text-[#5B6577] sm:text-[11px]">
                Intelligent operations for growing companies — consolidate where it makes sense,
                connect what you keep, one trusted place for information.
              </p>
              <ul className="mt-2 space-y-1">
                {PILLARS.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg border border-[#267B90]/20 bg-[#F4FAFB]/90 px-2 py-1.5 text-[10px] leading-snug text-[#1B2430] sm:text-[11px]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-auto pt-2 text-[9px] leading-snug text-[#5B6577] sm:text-[10px]">
                Prior SME: 30+ apps as CTO. This would have cut that stack ~75%.
              </p>
            </section>
          </div>

          {/* Col 2 — built around (top) + 60 min (bottom) */}
          <div className="flex min-h-0 flex-col gap-2.5 overflow-y-auto xl:overflow-hidden">
            <section className="flex shrink-0 flex-col rounded-xl border border-[#267B90]/20 bg-white/85 p-2.5 backdrop-blur-[2px] sm:p-3">
              <h2 className="text-[12px] font-semibold tracking-tight text-[#1B2430] sm:text-[13px]">
                Built around how OnwardAir runs
              </h2>
              <p className="mt-1 text-[9px] text-[#5B6577] sm:text-[10px]">
                Worth an hour — not a module catalogue.
              </p>
              <div className="mt-2 grid grid-cols-1 gap-1 content-start sm:grid-cols-2">
                {FOCUS.map((card) => (
                  <article
                    key={card.title}
                    className="rounded-lg border border-[#267B90]/15 bg-white/90 px-2 py-1.5"
                  >
                    <div
                      className="mb-0.5 h-0.5 w-5 rounded-full"
                      style={{ backgroundColor: ONWARDAIR_HOME_ACCENT }}
                    />
                    <h3 className="text-[11px] font-semibold text-[#1B2430]">{card.title}</h3>
                    <p className="mt-0.5 text-[10px] leading-snug text-[#5B6577]">{card.detail}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-[#267B90]/20 bg-white/85 p-2.5 backdrop-blur-[2px] sm:p-3">
              <h2 className="shrink-0 text-[12px] font-semibold tracking-tight text-[#1B2430] sm:text-[13px]">
                60-minute working session
              </h2>
              <p className="mt-1 text-[9px] text-[#5B6577] sm:text-[10px]">
                Live walkthrough — then decide if it&apos;s for you.
              </p>
              <div className="mt-2 space-y-1">
                {INVITE.map((row) => (
                  <div
                    key={row.wave}
                    className="rounded-lg border border-[#267B90]/15 bg-white/90 px-2 py-1.5"
                  >
                    <p
                      className="text-[9px] font-semibold uppercase tracking-wider"
                      style={{ color: ONWARDAIR_HOME_ACCENT }}
                    >
                      {row.wave} min
                    </p>
                    <p className="text-[11px] font-medium text-[#1B2430]">{row.who}</p>
                    <p className="text-[10px] text-[#5B6577]">{row.why}</p>
                  </div>
                ))}
              </div>
              <p className="mt-auto pt-2 text-[9px] leading-snug text-[#5B6577] sm:text-[10px]">
                Full workspace opens ~24h before we meet — not before.
              </p>
            </section>
          </div>

          {/* Col 3 — wider video */}
          <section className="flex min-h-[220px] flex-col rounded-xl border border-[#267B90]/20 bg-white/85 p-2.5 backdrop-blur-[2px] sm:col-span-2 sm:min-h-[280px] sm:p-3 xl:col-span-1 xl:min-h-0">
            <h2 className="shrink-0 text-[12px] font-semibold tracking-tight text-[#1B2430] sm:text-[13px]">
              A quick look inside
            </h2>
            <p className="mt-1 text-[9px] text-[#5B6577] sm:text-[10px]">
              Short walkthrough of the platform — recorded for you.
            </p>
            <div className="relative mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#267B90]/20 bg-[#061018]">
              <video
                className="h-full min-h-[180px] w-full flex-1 bg-black object-contain xl:min-h-0"
                controls
                playsInline
                preload="metadata"
              >
                <source src={WALKTHROUGH_VIDEO} type="video/mp4" />
              </video>
            </div>
          </section>
        </div>

        <footer className="mt-2 shrink-0 text-center text-[9px] text-white/40 sm:mt-2.5 sm:text-[10px]">
          OnwardAir · Unit311 Central · Private overview
        </footer>
      </div>
    </div>
  );
}
