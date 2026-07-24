import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Layers3,
  Network,
  Quote,
  Sparkles,
  Workflow,
} from "lucide-react";

import MarketingPageShell from "@/components/layout/MarketingPageShell";
import {
  marketingBtnPrimary,
  marketingBtnSecondary,
  marketingCardLarge,
  marketingEyebrow,
  marketingFadeIn,
  marketingPageIntro,
  marketingPageTitle,
  marketingSectionTitle,
  MARKETING_CONTENT_CLASS,
} from "@/lib/marketing-ui";

const TEAM_MEMBERS = [
  {
    name: "Paul Fotheringham",
    title: "CEO",
    photo: "/images/people/paul.jpg",
    highlights: [
      "Seasoned 25+ technologist",
      "Worked for large corporates and built SMEs with significant funding",
    ],
  },
  {
    name: "Dr. Ashley Pursglove",
    title: "Chief Technology Officer",
    photo: "/images/people/ashley.jpg",
    highlights: ["PhDs in multiple disciplines", "Expert in AI agents and LLMs"],
  },
  {
    name: "Paul Ormandy",
    title: "Head of Digital Management",
    photo: "/images/people/paulo.jpg",
    highlights: ["30 years experience in app building, UI/UX, and digital marketing"],
  },
  {
    name: "Hannes Hampus",
    title: "Head of Data",
    photo: "/images/people/hannes.jpg",
    highlights: [
      "20 years experience in large corporates building out big data infrastructure and analysis",
    ],
  },
  {
    name: "Stefan Siraov",
    title: "Head of Engineering",
    photo: "/images/people/stefan.jpg",
    highlights: ["Former European Space Agency", "Expert in AI"],
  },
  {
    name: "Stephen Saffin",
    title: "CFO, Legal and COO",
    photo: "/images/people/saffin.jpg",
    highlights: ["Lawyer", "20 years running successful SMEs"],
  },
] as const;

function FlowStep({ label, tone = "neutral" }: { label: string; tone?: "bad" | "good" | "neutral" | "hub" }) {
  const tones = {
    bad: "border-rose-400/35 bg-rose-500/10 text-rose-100",
    good: "border-emerald-400/35 bg-emerald-500/10 text-emerald-50",
    neutral: "border-white/15 bg-white/[0.05] text-white/85",
    hub: "border-sky-400/40 bg-sky-500/15 text-sky-50",
  } as const;

  return (
    <div
      className={`rounded-xl border px-3 py-2 text-center text-[11px] font-semibold leading-snug sm:px-3.5 sm:text-[12px] ${tones[tone]}`}
    >
      {label}
    </div>
  );
}

function FlowArrow() {
  return <ArrowRight className="mx-auto h-4 w-4 shrink-0 text-white/35" strokeWidth={1.8} aria-hidden />;
}

function WhyIllustration() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-2" aria-hidden>
      <div className="grid w-full grid-cols-3 gap-2">
        {["CRM", "Finance", "HR", "Projects", "Docs", "Email"].map((label) => (
          <FlowStep key={label} label={label} tone="neutral" />
        ))}
      </div>
      <FlowArrow />
      <FlowStep label="One Unit311 Central operating platform" tone="hub" />
    </div>
  );
}

function ProblemIllustration() {
  return (
    <div className="flex h-full flex-col justify-center gap-3 px-1" aria-hidden>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {["CRM", "Finance", "HR", "Projects", "Documents"].map((label) => (
          <FlowStep key={label} label={label} tone="bad" />
        ))}
      </div>
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-300/70">
        all disconnected
      </p>
      <div className="flex flex-col items-center gap-2">
        <FlowArrow />
        <FlowStep label="Duplicate work" tone="bad" />
        <FlowArrow />
        <FlowStep label="Poor visibility" tone="bad" />
        <FlowArrow />
        <FlowStep label="Slow decisions" tone="bad" />
      </div>
    </div>
  );
}

function SolutionIllustration() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5 px-1" aria-hidden>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {["CRM", "Finance", "HR", "Projects"].map((label) => (
          <FlowStep key={label} label={label} tone="neutral" />
        ))}
      </div>
      <FlowArrow />
      <FlowStep label="Shared Data" tone="good" />
      <FlowArrow />
      <FlowStep label="Shared Workflow Engine" tone="good" />
      <FlowArrow />
      <FlowStep label="AI Executive Assistant" tone="good" />
      <FlowArrow />
      <FlowStep label="One Operating Platform" tone="hub" />
    </div>
  );
}

function GrowthIllustration() {
  const steps = [
    "Start with CRM",
    "Add Projects",
    "Add Financials",
    "Add HR",
    "Add AI Executive Assistant",
    "One Connected Platform",
  ];

  return (
    <div className="mx-auto flex max-w-xl flex-col items-stretch gap-2.5" aria-hidden>
      {steps.map((step, index) => (
        <div key={step} className="flex flex-col items-center gap-2.5">
          <FlowStep label={step} tone={index === steps.length - 1 ? "hub" : "neutral"} />
          {index < steps.length - 1 ? <FlowArrow /> : null}
        </div>
      ))}
    </div>
  );
}

function PlatformIllustration() {
  const workspaces = [
    "Business Central",
    "Clients & Projects",
    "Financials",
    "HR & People",
    "Technology",
    "Corporate",
    "Operations",
    "Productivity",
    "AI Assistant",
    "Integrations",
  ];

  return (
    <div className="flex h-full flex-col justify-center gap-4 px-1" aria-hidden>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {workspaces.map((label) => (
          <FlowStep key={label} label={label} tone="neutral" />
        ))}
      </div>
      <div className="flex flex-col items-center gap-2">
        <FlowArrow />
        <FlowStep label="Unit311 Central · One Operating Platform" tone="hub" />
      </div>
    </div>
  );
}

export default function AboutPageContent() {
  return (
    <MarketingPageShell
      contentClassName={`${MARKETING_CONTENT_CLASS} space-y-16 sm:space-y-24`}
    >
      <div className={`max-w-3xl ${marketingFadeIn}`}>
        <p className={marketingEyebrow}>Unit311 Central</p>
        <h1 className={`mt-4 ${marketingPageTitle}`}>About</h1>
        <p className={marketingPageIntro}>
          Why the platform exists—and who it is built to serve.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup" className={marketingBtnPrimary}>
            Get started
          </Link>
          <Link href="/#services" className={marketingBtnSecondary}>
            Explore workspaces
          </Link>
        </div>
      </div>

      {/* Why */}
      <section className={`grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 ${marketingFadeIn}`}>
        <div>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-400/10 text-sky-300">
            <Sparkles className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/80">
            Why Unit311 exists
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            One intelligent platform to run the company.
          </h2>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-white/65 sm:text-[17px]">
            Growing businesses outgrow the patchwork of tools that got them started. Unit311 Central
            gives founders and operators a connected operating layer—without rip-and-replace.
          </p>
        </div>
        <div className="relative overflow-hidden rounded-[28px] border border-sky-400/20 bg-gradient-to-br from-sky-500/10 via-[#0b1220] to-[#070b14] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="relative min-h-[14rem] sm:min-h-[16rem]">
            <WhyIllustration />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className={`grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 ${marketingFadeIn}`}>
        <div className="relative order-2 overflow-hidden rounded-[28px] border border-rose-400/20 bg-gradient-to-br from-rose-500/10 via-[#120b12] to-[#070b14] p-6 lg:order-1">
          <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-rose-400/15 blur-3xl" />
          <div className="relative min-h-[18rem] sm:min-h-[20rem]">
            <ProblemIllustration />
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-400/30 bg-rose-400/10 text-rose-300">
            <Network className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-300/80">
            The problem
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Disconnected software fragments the business.
          </h2>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-white/65 sm:text-[17px]">
            When CRM, finance, HR and projects live apart, teams re-enter data, reports go stale, and
            leaders spend more time stitching context than deciding what to do next.
          </p>
        </div>
      </section>

      {/* Solution */}
      <section className={`grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 ${marketingFadeIn}`}>
        <div>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
            <Workflow className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">
            How Unit311 solves it
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Shared AI. Shared data. Shared workflow.
          </h2>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-white/65 sm:text-[17px]">
            Core business functions connect into one operating layer—so the company runs as a system,
            not a collection of apps.
          </p>
        </div>
        <div className="relative overflow-hidden rounded-[28px] border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-[#0a1412] to-[#070b14] p-6">
          <div className="relative min-h-[20rem] sm:min-h-[22rem]">
            <SolutionIllustration />
          </div>
        </div>
      </section>

      {/* Grow */}
      <section
        className={`rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent px-6 py-10 sm:px-10 sm:py-14 ${marketingFadeIn}`}
      >
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-400/10 text-violet-300">
            <Building2 className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/80">
            Grow with your business
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Built for growing businesses.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-white/65 sm:text-[17px]">
            Start with the workspaces that matter now. Keep the specialist tools that still earn their
            place. Expand as the organisation matures.
          </p>
        </div>
        <div className="mx-auto mt-10 max-w-3xl">
          <GrowthIllustration />
        </div>
      </section>

      {/* One platform */}
      <section className={`grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 ${marketingFadeIn}`}>
        <div className="relative overflow-hidden rounded-[28px] border border-indigo-400/20 bg-gradient-to-br from-indigo-500/10 via-[#0c1020] to-[#070b14] p-6">
          <div className="relative min-h-[16rem] sm:min-h-[18rem]">
            <PlatformIllustration />
          </div>
        </div>
        <div>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-400/30 bg-indigo-400/10 text-indigo-300">
            <Layers3 className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-300/80">
            One connected platform
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Every workspace feeds one operating picture.
          </h2>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-white/65 sm:text-[17px]">
            Business Central, finance, people, technology, corporate, operations, productivity and
            integrations share the same foundation.
          </p>
        </div>
      </section>

      {/* Philosophy */}
      <section
        className={`relative overflow-hidden rounded-[32px] border border-white/12 bg-gradient-to-br from-[#13233d] via-[#0b1528] to-[#070b14] px-6 py-12 sm:px-12 sm:py-16 ${marketingFadeIn}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(96,165,250,0.14),transparent_55%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <Quote className="mx-auto h-8 w-8 text-sky-300/70" strokeWidth={1.5} />
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/80">
            Our philosophy
          </p>
          <blockquote className="mt-5 text-balance text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl sm:leading-snug">
            Technology should help organisations move faster, make better decisions and operate as one
            connected business.
          </blockquote>
          <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-white/60 sm:text-[16px]">
            We build for clarity, practical adoption and real business action—so teams get instant
            access to information, reports and insights.
          </p>
        </div>
      </section>

      <div className={marketingFadeIn}>
        <div className="max-w-2xl">
          <p className={marketingEyebrow}>Leadership</p>
          <h2 className={`mt-4 ${marketingSectionTitle}`}>The team</h2>
        </div>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/70 sm:text-[17px]">
          Built by operators, technologists, and product leaders with deep experience across enterprise
          software, AI, data, and growing SMEs.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {TEAM_MEMBERS.map((member) => (
            <article
              key={member.name}
              className="rounded-2xl border border-white/12 bg-gradient-to-b from-white/[0.07] to-white/[0.03] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.28)]"
            >
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white/15">
                  <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                  <p className="text-sm font-medium text-[#93c5fd]">{member.title}</p>
                </div>
              </div>
              <ul className="mt-5 space-y-2 text-[14px] leading-relaxed text-white/72">
                {member.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-2">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#60a5fa]" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>

      <div className={`${marketingCardLarge} px-6 py-8 text-center sm:px-10 sm:py-10 ${marketingFadeIn}`}>
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Ready to connect your business?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/70 sm:text-[17px]">
          Create your workspace or tell us about the challenges you want to solve.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className={marketingBtnPrimary}>
            Get started
          </Link>
          <Link href="/contact" className={marketingBtnSecondary}>
            Contact us
          </Link>
        </div>
      </div>
    </MarketingPageShell>
  );
}
