import Image from "next/image";
import Link from "next/link";
import { Quote } from "lucide-react";

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

type StoryVisualProps = {
  src: string;
  alt: string;
  accent: string;
};

function StoryVisual({ src, alt, accent }: StoryVisualProps) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/12 shadow-[0_32px_90px_rgba(0,0,0,0.45)]">
      <div className="relative aspect-[4/3] w-full sm:aspect-[5/4]">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 48vw"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(160deg, ${accent} 0%, rgba(2,6,23,0.35) 42%, rgba(2,6,23,0.72) 100%)`,
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.14),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#020617]/80 to-transparent" />
        <div className="pointer-events-none absolute left-5 top-5 h-16 w-16 rounded-2xl border border-white/20 bg-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md sm:left-6 sm:top-6 sm:h-20 sm:w-20" />
        <div className="pointer-events-none absolute bottom-6 right-6 h-10 w-28 rounded-full border border-white/15 bg-white/10 backdrop-blur-md sm:bottom-8 sm:right-8" />
      </div>
    </div>
  );
}

type StorySection = {
  eyebrow: string;
  eyebrowClass: string;
  title: string;
  body: string;
  image: StoryVisualProps;
  imageFirst: boolean;
};

const STORY_SECTIONS: StorySection[] = [
  {
    eyebrow: "Why Unit311 exists",
    eyebrowClass: "text-sky-300/85",
    title: "One intelligent platform to run the company.",
    body: "Growing businesses outgrow the patchwork of tools that got them started. Unit311 Central gives founders and operators a connected operating layer—without rip-and-replace.",
    image: {
      src: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
      alt: "Modern operating workspace",
      accent: "rgba(56,189,248,0.28)",
    },
    imageFirst: false,
  },
  {
    eyebrow: "The problem",
    eyebrowClass: "text-rose-300/85",
    title: "Disconnected software fragments the business.",
    body: "When CRM, finance, HR and projects live apart, teams re-enter data, reports go stale, and leaders spend more time stitching context than deciding what to do next.",
    image: {
      src: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1600&q=80",
      alt: "Teams working across disconnected tools",
      accent: "rgba(251,113,133,0.26)",
    },
    imageFirst: true,
  },
  {
    eyebrow: "How Unit311 solves it",
    eyebrowClass: "text-emerald-300/85",
    title: "Shared AI. Shared data. Shared workflow.",
    body: "Core business functions connect into one operating layer—so the company runs as a system, not a collection of apps.",
    image: {
      src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
      alt: "Unified business intelligence and dashboards",
      accent: "rgba(52,211,153,0.24)",
    },
    imageFirst: false,
  },
  {
    eyebrow: "Grow with your business",
    eyebrowClass: "text-violet-300/85",
    title: "Built for growing businesses.",
    body: "Start with the workspaces that matter now. Keep the specialist tools that still earn their place. Expand as the organisation matures.",
    image: {
      src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80",
      alt: "Growing teams collaborating",
      accent: "rgba(167,139,250,0.26)",
    },
    imageFirst: true,
  },
  {
    eyebrow: "One connected platform",
    eyebrowClass: "text-indigo-300/85",
    title: "Every workspace feeds one operating picture.",
    body: "Business Central, finance, people, technology, corporate, operations, productivity and integrations share the same foundation.",
    image: {
      src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80",
      alt: "Connected enterprise operations",
      accent: "rgba(129,140,248,0.28)",
    },
    imageFirst: false,
  },
];

export default function AboutPageContent() {
  return (
    <MarketingPageShell
      contentClassName={`${MARKETING_CONTENT_CLASS} space-y-20 sm:space-y-28`}
    >
      <div className={`max-w-3xl ${marketingFadeIn}`}>
        <p className={marketingEyebrow}>Unit311 Central</p>
        <h1 className={`mt-4 ${marketingPageTitle}`}>About</h1>
        <p className={marketingPageIntro}>
          Why the platform exists—and who it is built to serve.
        </p>
        <Link href="/signup" className={`mt-8 ${marketingBtnPrimary}`}>
          Get started
        </Link>
      </div>

      {STORY_SECTIONS.map((section) => (
        <section
          key={section.eyebrow}
          className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${marketingFadeIn}`}
        >
          <div className={section.imageFirst ? "lg:order-1" : "lg:order-2"}>
            <StoryVisual {...section.image} />
          </div>
          <div className={section.imageFirst ? "lg:order-2" : "lg:order-1"}>
            <p
              className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${section.eyebrowClass}`}
            >
              {section.eyebrow}
            </p>
            <h2 className="mt-4 max-w-xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl sm:leading-[1.15]">
              {section.title}
            </h2>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-white/65 sm:text-[17px]">
              {section.body}
            </p>
          </div>
        </section>
      ))}

      <section
        className={`relative overflow-hidden rounded-[32px] border border-white/12 bg-gradient-to-br from-[#13233d] via-[#0b1528] to-[#070b14] px-6 py-14 sm:px-12 sm:py-20 ${marketingFadeIn}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(96,165,250,0.16),transparent_55%)]" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
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
