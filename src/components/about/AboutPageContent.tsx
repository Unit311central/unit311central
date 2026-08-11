import Image from "next/image";
import Link from "next/link";
import { Quote } from "lucide-react";

import MarketingPageShell from "@/components/layout/MarketingPageShell";
import {
  marketingBtnPrimary,
  marketingBtnSecondary,
  marketingEyebrow,
  marketingFadeIn,
  marketingPageIntro,
  marketingPageTitle,
  marketingSectionTitle,
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

type StoryArtProps = {
  src: string;
  alt: string;
  priority?: boolean;
};

/** Large premium artwork — no borders, soft shadow, gentle contain (no aggressive crop). */
function StoryArt({ src, alt, priority = false }: StoryArtProps) {
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute -inset-3 rounded-[32px] bg-sky-500/12 blur-2xl sm:-inset-4"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-[28px] shadow-[0_40px_100px_rgba(0,0,0,0.55)]">
        <div className="relative aspect-[3/2] w-full bg-[#050a14]">
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            quality={90}
            className="object-contain object-center"
            sizes="(max-width: 1400px) 100vw, 1320px"
          />
        </div>
      </div>
    </div>
  );
}

type StorySection = {
  eyebrow: string;
  title: string;
  body: string;
  /** Optional local premium artwork. Omit for typography-led beats. */
  art?: StoryArtProps;
};

const STORY_SECTIONS: StorySection[] = [
  {
    eyebrow: "Why Unit311 exists",
    title: "One intelligent platform to run the company.",
    body: "Growing businesses outgrow the patchwork of tools that got them started. Unit311 Central gives founders and operators a connected operating layer—without rip-and-replace.",
    art: {
      src: "/images/image1about.png",
      alt: "Unit311 Central — one intelligent platform connecting the business",
      priority: true,
    },
  },
  {
    eyebrow: "The problem",
    title: "Disconnected software fragments the business.",
    body: "When CRM, finance, HR and projects live apart, teams re-enter data, reports go stale, and leaders spend more time stitching context than deciding what to do next.",
  },
  {
    eyebrow: "How Unit311 solves it",
    title: "Shared AI. Shared data. Shared workflow.",
    body: "Core business functions connect into one operating layer—so the company runs as a system, not a collection of apps.",
  },
  {
    eyebrow: "Grow with your business",
    title: "Built for growing businesses.",
    body: "Start with the workspaces that matter now. Keep the specialist tools that still earn their place. Expand as the organisation matures.",
  },
  {
    eyebrow: "One connected platform",
    title: "Every workspace feeds one operating picture.",
    body: "Business Central, finance, people, technology, corporate, operations, productivity and integrations share the same foundation.",
  },
];

const glassPanel =
  "relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-white/[0.02] shadow-[0_28px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl";

export default function AboutPageContent() {
  return (
    <MarketingPageShell
      contentClassName="relative z-10 mx-auto w-full max-w-[1400px] px-4 py-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-10 lg:px-10 lg:py-12 space-y-14 sm:space-y-16 lg:space-y-20"
      overlayClassName="absolute inset-0 bg-gradient-to-b from-[#020617]/92 via-[#020617]/88 to-[#020617]/94"
    >
      {/* Continuous blue atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(37,99,235,0.22), transparent 55%), radial-gradient(ellipse 50% 30% at 10% 40%, rgba(56,189,248,0.08), transparent 50%), radial-gradient(ellipse 45% 28% at 90% 70%, rgba(37,99,235,0.1), transparent 55%)",
        }}
      />

      {/* Hero */}
      <header className={`relative z-10 max-w-3xl pt-2 pb-0 sm:pt-4 sm:pb-2 ${marketingFadeIn}`}>
        <h1 className={marketingPageTitle}>About</h1>
        <p className={`${marketingPageIntro} mt-4 sm:mt-5`}>
          Why the platform exists—and who it is built to serve.
        </p>
        <Link href="/signup" className={`mt-7 sm:mt-8 ${marketingBtnPrimary}`}>
          Get Started
        </Link>
      </header>

      {/* Story */}
      {STORY_SECTIONS.map((section) => {
        if (section.art) {
          return (
            <section
              key={section.eyebrow}
              className={`relative z-10 space-y-6 sm:space-y-8 ${marketingFadeIn}`}
            >
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/85">
                  {section.eyebrow}
                </p>
                <h2 className="mt-4 max-w-xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl sm:leading-[1.12]">
                  {section.title}
                </h2>
                <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-white/65 sm:text-[17px]">
                  {section.body}
                </p>
              </div>
              <StoryArt {...section.art} />
            </section>
          );
        }

        return (
          <section
            key={section.eyebrow}
            className={`relative z-10 ${glassPanel} px-7 py-9 sm:px-12 sm:py-12 ${marketingFadeIn}`}
          >
            <div
              className="pointer-events-none absolute -right-20 top-0 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl"
              aria-hidden
            />
            <div className="relative max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/85">
                {section.eyebrow}
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl sm:leading-[1.12]">
                {section.title}
              </h2>
              <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-white/65 sm:text-[17px]">
                {section.body}
              </p>
            </div>
          </section>
        );
      })}

      {/* Philosophy */}
      <section
        className={`relative z-10 overflow-hidden rounded-[32px] border border-white/[0.08] bg-gradient-to-br from-[#0c1a33] via-[#070f1c] to-[#04080f] px-8 py-12 sm:px-14 sm:py-16 ${marketingFadeIn}`}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.14),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-blue-600/20 blur-[100px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 top-10 h-56 w-56 rounded-full bg-sky-400/10 blur-[80px]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <Quote className="mx-auto h-9 w-9 text-sky-300/60" strokeWidth={1.25} />
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/80">
            Our philosophy
          </p>
          <blockquote className="mt-5 text-balance text-2xl font-semibold leading-snug tracking-tight text-white sm:text-[2rem] sm:leading-[1.25]">
            Technology should help organisations move faster, make better decisions and operate as one
            connected business.
          </blockquote>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-white/55 sm:text-[16px]">
            We build for clarity, practical adoption and real business action—so teams get instant
            access to information, reports and insights.
          </p>
        </div>
      </section>

      {/* Leadership */}
      <div id="team" className={`relative z-10 scroll-mt-28 ${marketingFadeIn}`}>
        <div className="max-w-2xl">
          <p className={marketingEyebrow}>Leadership</p>
          <h2 className={`mt-3 ${marketingSectionTitle}`}>The team</h2>
        </div>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/65 sm:text-[17px]">
          Built by operators, technologists, and product leaders with deep experience across enterprise
          software, AI, data, and growing SMEs.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {TEAM_MEMBERS.map((member) => (
            <article
              key={member.name}
              className={`${glassPanel} p-6 transition-colors hover:border-white/[0.14]`}
            >
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-1 ring-white/15 shadow-[0_0_24px_rgba(56,189,248,0.15)]">
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
              <ul className="mt-5 space-y-2 text-[14px] leading-relaxed text-white/70">
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

      {/* CTA */}
      <div
        className={`relative z-10 overflow-hidden rounded-[32px] border border-white/[0.08] bg-gradient-to-br from-[#13233d]/90 via-[#0b1528]/95 to-[#070b14] px-8 py-12 text-center shadow-[0_40px_100px_rgba(0,0,0,0.45)] sm:px-14 sm:py-14 ${marketingFadeIn}`}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.16),transparent_60%)]"
          aria-hidden
        />
        <div className="relative">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Ready to connect your business?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/65 sm:text-[17px]">
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
      </div>
    </MarketingPageShell>
  );
}
