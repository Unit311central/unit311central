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

function WhyIllustration() {
  return (
    <svg viewBox="0 0 280 160" fill="none" aria-hidden className="h-full w-full">
      <rect x="24" y="36" width="72" height="88" rx="14" stroke="#60a5fa" strokeWidth="1.4" opacity="0.55" />
      <rect x="104" y="28" width="72" height="104" rx="14" stroke="#93c5fd" strokeWidth="1.6" />
      <rect x="184" y="44" width="72" height="72" rx="14" stroke="#38bdf8" strokeWidth="1.4" opacity="0.55" />
      <circle cx="140" cy="80" r="10" fill="#3b82f6" opacity="0.9" />
      <path d="M96 80H130M150 80H184" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3 4" />
    </svg>
  );
}

function ProblemIllustration() {
  return (
    <svg viewBox="0 0 320 180" fill="none" aria-hidden className="h-full w-full">
      {[
        { x: 28, y: 28, label: "CRM" },
        { x: 210, y: 24, label: "Finance" },
        { x: 30, y: 112, label: "HR" },
        { x: 208, y: 108, label: "Projects" },
      ].map((node) => (
        <g key={node.label}>
          <rect x={node.x} y={node.y} width="84" height="40" rx="10" fill="rgba(255,255,255,0.04)" stroke="#64748b" strokeWidth="1.2" />
          <text x={node.x + 42} y={node.y + 24} textAnchor="middle" fill="#cbd5e1" fontSize="12" fontFamily="system-ui">
            {node.label}
          </text>
        </g>
      ))}
      <path d="M112 48C148 48 148 48 184 44" stroke="#f87171" strokeWidth="1.4" strokeDasharray="4 5" opacity="0.85" />
      <path d="M112 132C150 96 170 96 208 128" stroke="#f87171" strokeWidth="1.4" strokeDasharray="4 5" opacity="0.7" />
      <path d="M70 68V112" stroke="#f87171" strokeWidth="1.3" strokeDasharray="4 5" opacity="0.65" />
      <path d="M252 64V108" stroke="#f87171" strokeWidth="1.3" strokeDasharray="4 5" opacity="0.65" />
    </svg>
  );
}

function SolutionIllustration() {
  return (
    <svg viewBox="0 0 320 180" fill="none" aria-hidden className="h-full w-full">
      <circle cx="160" cy="90" r="34" fill="rgba(59,130,246,0.18)" stroke="#60a5fa" strokeWidth="1.5" />
      <text x="160" y="94" textAnchor="middle" fill="#bfdbfe" fontSize="11" fontFamily="system-ui" fontWeight="600">
        Unit311
      </text>
      {[
        { x: 36, y: 34, label: "Shared AI" },
        { x: 214, y: 34, label: "Shared Data" },
        { x: 110, y: 132, label: "Shared Workflow" },
      ].map((node) => (
        <g key={node.label}>
          <rect x={node.x} y={node.y} width="96" height="34" rx="10" fill="rgba(56,189,248,0.08)" stroke="#38bdf8" strokeWidth="1.2" />
          <text x={node.x + 48} y={node.y + 21} textAnchor="middle" fill="#e2e8f0" fontSize="11" fontFamily="system-ui">
            {node.label}
          </text>
        </g>
      ))}
      <path d="M132 51L148 70" stroke="#60a5fa" strokeWidth="1.3" />
      <path d="M214 51L176 70" stroke="#60a5fa" strokeWidth="1.3" />
      <path d="M160 124L160 110" stroke="#60a5fa" strokeWidth="1.3" />
    </svg>
  );
}

function GrowthIllustration() {
  return (
    <div className="flex h-full items-center justify-center gap-3 sm:gap-5" aria-hidden>
      {["Startup", "SME", "Enterprise"].map((stage, index) => (
        <div key={stage} className="flex items-center gap-3 sm:gap-5">
          <div
            className="flex flex-col items-center justify-center rounded-2xl border border-sky-400/25 bg-sky-400/10 px-4 py-5 text-center sm:px-6 sm:py-6"
            style={{ minWidth: `${5.5 + index * 0.8}rem`, minHeight: `${4.5 + index * 0.55}rem` }}
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-300/80">
              {stage}
            </span>
          </div>
          {index < 2 ? <ArrowRight className="h-4 w-4 text-sky-300/50" strokeWidth={1.75} /> : null}
        </div>
      ))}
    </div>
  );
}

function PlatformIllustration() {
  return (
    <svg viewBox="0 0 340 180" fill="none" aria-hidden className="h-full w-full">
      <rect x="108" y="68" width="124" height="48" rx="14" fill="rgba(59,130,246,0.16)" stroke="#60a5fa" strokeWidth="1.5" />
      <text x="170" y="96" textAnchor="middle" fill="#dbeafe" fontSize="12" fontFamily="system-ui" fontWeight="600">
        Operating Platform
      </text>
      {["Central", "Finance", "People", "Ops", "AI", "Comms"].map((label, index) => {
        const x = 18 + (index % 3) * 110;
        const y = index < 3 ? 18 : 136;
        return (
          <g key={label}>
            <rect x={x} y={y} width="84" height="28" rx="8" fill="rgba(255,255,255,0.04)" stroke="#64748b" strokeWidth="1" />
            <text x={x + 42} y={y + 18} textAnchor="middle" fill="#cbd5e1" fontSize="11" fontFamily="system-ui">
              {label}
            </text>
            <path
              d={index < 3 ? `M${x + 42} ${y + 28}V68` : `M${x + 42} ${y}V116`}
              stroke="#3b82f6"
              strokeWidth="1.1"
              opacity="0.55"
            />
          </g>
        );
      })}
    </svg>
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
          <div className="relative h-40 sm:h-48">
            <WhyIllustration />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className={`grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 ${marketingFadeIn}`}>
        <div className="relative order-2 overflow-hidden rounded-[28px] border border-rose-400/20 bg-gradient-to-br from-rose-500/10 via-[#120b12] to-[#070b14] p-6 lg:order-1">
          <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-rose-400/15 blur-3xl" />
          <div className="relative h-44 sm:h-52">
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
          <div className="relative h-44 sm:h-52">
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
          <div className="relative h-44 sm:h-52">
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
            Software should reduce operational drag, not create another silo.
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
