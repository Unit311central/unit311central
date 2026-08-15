import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";

import { UNIT311_CENTRAL_OVERVIEW_VIDEO_SRC } from "@/lib/unit311-central-homepage-video";

import HomeSectionTitle from "./HomeSectionTitle";
import WorkspaceDemoLoopVideo from "./WorkspaceDemoLoopVideo";

const SECTION_BG = "/images/workspaces/onwardair-login-bg.png";

const BOX_LABEL_CLASS =
  "text-sm font-bold uppercase tracking-[0.14em] text-white sm:text-[15px]";

const BEFORE_ITEMS = [
  "20+ subscriptions across all major business functions",
  "Leadership reporting rebuilt manually every month",
  "Teams copying data between SharePoint, email and ops tools",
] as const;

const AFTER_ITEMS = [
  "One workspace for leadership, finance, ops and HR",
  "Live overview and AI assistant on real company data",
  "Specialist accounting and comms tools still connected",
] as const;

export default function HomeCustomerProof() {
  return (
    <section
      id="proof"
      className="relative scroll-mt-20 overflow-x-hidden bg-[#030712] py-12 sm:scroll-mt-28 sm:py-16 lg:py-20"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.18] sm:opacity-[0.22]"
          style={{ backgroundImage: `url(${SECTION_BG})` }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(3,7,18,0.72), rgba(3,7,18,0.84), rgba(3,7,18,0.9))",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 20% 20%, rgba(56,189,248,0.08), transparent 55%), radial-gradient(ellipse 60% 45% at 85% 80%, rgba(59,130,246,0.06), transparent 60%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-10">
        <HomeSectionTitle>Built to allow you to focus on running your Business</HomeSectionTitle>

        <div className="mt-10 lg:mt-12">
          <div
            className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-stretch lg:gap-10"
          >
            <div className="space-y-5">
              <p className="max-w-xl text-sm leading-relaxed text-white/55 sm:text-[16px]">
                A typical deployment: a 10–20 person company — past the startup scramble, now drowning
                in many disconnected SaaS applications.
              </p>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <p className={BOX_LABEL_CLASS}>Before</p>
                <ul className="mt-4 space-y-3">
                  {BEFORE_ITEMS.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-white/65">
                      <X
                        className="mt-0.5 h-4 w-4 shrink-0 text-red-400/80"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-[#3b82f6]/25 bg-[#2563eb]/[0.08] p-5 sm:p-6">
                <p className={`${BOX_LABEL_CLASS} text-[#93c5fd]`}>With Unit311 Central</p>
                <ul className="mt-4 space-y-3">
                  {AFTER_ITEMS.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-white/80">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/12 bg-[#0b1220] shadow-[0_28px_90px_rgba(0,0,0,0.35)] sm:rounded-[28px]">
              <WorkspaceDemoLoopVideo
                className="w-full rounded-none"
                frameClassName="aspect-video w-full"
                src={UNIT311_CENTRAL_OVERVIEW_VIDEO_SRC}
                poster={null}
                preload="metadata"
              />
            </div>
          </div>

          <Link
            href="/book"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#93c5fd] transition-colors hover:text-white"
          >
            Book a free demo
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
