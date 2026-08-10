import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HomeSectionTitle from "./HomeSectionTitle";
import WorkspaceDemoLoopVideo from "./WorkspaceDemoLoopVideo";

const BEFORE_ITEMS = [
  "12+ subscriptions across CRM, HR, projects and support",
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
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 20% 20%, rgba(56,189,248,0.08), transparent 55%), radial-gradient(ellipse 60% 45% at 85% 80%, rgba(59,130,246,0.06), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-10">
        <HomeSectionTitle>Built to allow you to focus on running your Business</HomeSectionTitle>

        <div className="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-start lg:gap-10">
          <div className="space-y-5">
            <p className="max-w-xl text-sm leading-relaxed text-white/55 sm:text-[16px]">
              A typical deployment: a 30–80 person company in aviation, services or technology — past
              the startup scramble, now drowning in Pipedrive, Zoho, SharePoint and Teams.
            </p>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                Before
              </p>
              <ul className="mt-4 space-y-3">
                {BEFORE_ITEMS.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-white/65">{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-[#3b82f6]/25 bg-[#2563eb]/[0.08] p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#93c5fd]">
                With Unit311 Central
              </p>
              <ul className="mt-4 space-y-3">
                {AFTER_ITEMS.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-white/80">{item}</li>
                ))}
              </ul>
            </div>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#93c5fd] transition-colors hover:text-white"
            >
              Book a walkthrough of a live workspace
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-b from-white/[0.12] to-white/[0.04] p-2 shadow-[0_28px_90px_rgba(0,0,0,0.35)] sm:rounded-[28px] sm:p-3 lg:sticky lg:top-28">
            <WorkspaceDemoLoopVideo
              className="w-full"
              src="/videos/overview.mp4"
              poster={null}
              frameClassName="aspect-video"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
