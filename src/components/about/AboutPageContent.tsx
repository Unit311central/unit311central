import Image from "next/image";
import Link from "next/link";

import MarketingPageShell from "@/components/layout/MarketingPageShell";
import {
  marketingBtnPrimary,
  marketingBtnSecondary,
  marketingCard,
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

const STORY_SECTIONS = [
  {
    title: "Why Unit311 Central exists",
    body: "Growing businesses eventually outgrow the patchwork of tools that got them started. Unit311 Central exists to give founders and operators one intelligent platform to run the company—without forcing a rip-and-replace of every specialist system they already rely on.",
  },
  {
    title: "The problem with disconnected business software",
    body: "When CRM, projects, finance, HR, documents and communications live in separate products, information fragments. Teams re-enter the same data, reports go stale, approvals stall, and leaders spend more time stitching context together than deciding what to do next.",
  },
  {
    title: "How Unit311 Central solves it",
    body: "Unit311 Central connects core business functions into a single operating layer. Shared data, role-based visibility, workflows and an AI Executive Assistant sit across workspaces—so the business runs as one system instead of a collection of apps.",
  },
  {
    title: "Built for growing businesses",
    body: "The platform is designed for early-stage startups, growing startups, scaleups and SMEs. Start with the workspaces that matter now, keep the specialist tools that still earn their place, and expand as the organisation matures.",
  },
  {
    title: "One connected platform",
    body: "Business Central, clients and projects, financials, people, technology, corporate information, operations, productivity and integrations share the same foundation. That is what turns day-to-day work into a coherent operating picture for every team.",
  },
  {
    title: "Our philosophy",
    body: "Software should reduce operational drag, not create another silo. We build for clarity, practical adoption and real business action—so teams get instant access to information, reports and insights without rebuilding their company around a rigid product suite.",
  },
] as const;

export default function AboutPageContent() {
  return (
    <MarketingPageShell
      contentClassName={`${MARKETING_CONTENT_CLASS} space-y-12 sm:space-y-16`}
    >
      <div className={`max-w-3xl ${marketingFadeIn}`}>
        <p className={marketingEyebrow}>Unit311 Central</p>
        <h1 className={`mt-4 ${marketingPageTitle}`}>About</h1>
        <p className={marketingPageIntro}>
          Unit311 Central is the connected business operating platform for companies that have
          outgrown disconnected software. This page explains why the platform exists—and who it is
          built to serve.
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

      <div className={`grid gap-5 lg:grid-cols-2 ${marketingFadeIn}`} style={{ animationDelay: "60ms" }}>
        {STORY_SECTIONS.map((section) => (
          <article key={section.title} className={`${marketingCard} p-6 sm:p-7`}>
            <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {section.title}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/70 sm:text-[16px]">
              {section.body}
            </p>
          </article>
        ))}
      </div>

      <div className={marketingFadeIn} style={{ animationDelay: "100ms" }}>
        <div className="max-w-2xl">
          <p className={marketingEyebrow}>Leadership</p>
          <h2 className={`mt-4 ${marketingSectionTitle}`}>The team</h2>
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-white/70 sm:text-[17px]">
          Unit311 is built by operators, technologists, and product leaders with deep experience
          across enterprise software, AI, data, and growing SMEs.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {TEAM_MEMBERS.map((member) => (
            <article key={member.name} className={`${marketingCard} p-6`}>
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
                    <span
                      aria-hidden
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#60a5fa]"
                    />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>

      <div
        className={`${marketingCardLarge} px-6 py-8 text-center sm:px-10 sm:py-10 ${marketingFadeIn}`}
        style={{ animationDelay: "140ms" }}
      >
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
