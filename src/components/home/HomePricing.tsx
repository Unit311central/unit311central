import Link from "next/link";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import HomeSectionTitle from "./HomeSectionTitle";
import {
  formatProfessionalUsd,
  MARKETING_ANNUAL_PREPAY_DISCOUNT,
  MARKETING_CORE_MONTHLY_FROM_USD,
  MARKETING_ENTERPRISE_MONTHLY_FROM_USD,
  MARKETING_IMPLEMENTATION_HIGH_USD,
  MARKETING_IMPLEMENTATION_LOW_USD,
  MARKETING_OPERATOR_MONTHLY_FROM_USD,
} from "@/lib/platform-pricing";

type Tier = {
  id: string;
  name: string;
  monthlyFrom: number;
  description: string;
  features: readonly string[];
  highlighted?: boolean;
  ctaHref: string;
  ctaLabel: string;
};

const TIERS: Tier[] = [
  {
    id: "core",
    name: "Core",
    monthlyFrom: MARKETING_CORE_MONTHLY_FROM_USD,
    description: "Growing SME — standard workspaces, light integrations.",
    features: [
      "Business Central, Clients & Projects, HR & People, Operations",
      "Professional onboarding and configuration",
      "5 business app integrations (review required first)",
      "Standard support",
    ],
    ctaHref: "/book",
    ctaLabel: "Book a free demo",
  },
  {
    id: "professional",
    name: "Professional",
    monthlyFrom: MARKETING_OPERATOR_MONTHLY_FROM_USD,
    description: "Full platform — AI, reporting and priority support.",
    highlighted: true,
    features: [
      "All Core modules plus Financials, Corporate, Technology, Support Desk",
      "AI Executive Assistant and board pack automation",
      "Monthly change budget for module customization",
      "Broader integrations and priority support",
    ],
    ctaHref: "/book",
    ctaLabel: "Book a free demo",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyFrom: MARKETING_ENTERPRISE_MONTHLY_FROM_USD,
    description: "Heavy custom, multi-workspace or white-label deployments.",
    features: [
      "Dedicated rollout and solution architecture",
      "Advanced integrations and automation",
      "Multi-entity or tenant-scale configuration",
      "Scoped proposal for your operating model",
    ],
    ctaHref: "/contact",
    ctaLabel: "Contact us",
  },
];

const IMPLEMENTATION_INCLUDES = [
  "Business configuration and permissions",
  "Data migration and system integrations",
  "Team training and go-live assistance",
] as const;

function TierCardShell({
  highlighted,
  className,
  children,
}: {
  highlighted?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-white/[0.07] to-white/[0.03] shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl ${
        highlighted
          ? "border-[#3b82f6]/40 ring-1 ring-[#3b82f6]/20"
          : "border-[#3b82f6]/25"
      } ${className ?? ""}`}
    >
      {children}
    </article>
  );
}

export default function HomePricing() {
  const annualDiscountPct = Math.round(MARKETING_ANNUAL_PREPAY_DISCOUNT * 100);

  return (
    <section
      id="pricing"
      className="relative scroll-mt-20 overflow-x-hidden bg-[#050816] pt-7 pb-12 sm:scroll-mt-28 sm:pt-12 sm:pb-20 lg:pt-14 lg:pb-24"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 100%, rgba(37,99,235,0.1), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[1760px] px-4 sm:px-8 lg:px-10">
        <HomeSectionTitle>Transparent pricing, scoped to you</HomeSectionTitle>
        <p className="mx-auto mt-4 max-w-3xl text-balance text-center text-sm leading-relaxed text-white/60 sm:mt-6 sm:text-[15px] md:text-[17px] lg:max-w-[52rem] xl:whitespace-nowrap">
          From {formatProfessionalUsd(MARKETING_CORE_MONTHLY_FROM_USD)}/month — fixed subscription, implementation quoted before you commit. Annual prepay saves {annualDiscountPct}%.
        </p>

        <div className="mx-auto mt-8 max-w-6xl sm:mt-12">
          <div className="grid gap-4 lg:grid-cols-3 lg:gap-5 lg:items-stretch">
            {TIERS.map((tier) => (
              <div key={tier.id} className="flex min-w-0 flex-col">
                <div className="mb-3 flex h-6 items-center justify-center sm:h-7">
                  {tier.highlighted ? (
                    <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#93c5fd] sm:text-[13px] sm:tracking-[0.14em]">
                      Most common for SMEs
                    </p>
                  ) : null}
                </div>
                <TierCardShell highlighted={tier.highlighted} className="flex-1">
                  <div className="flex h-full flex-1 flex-col px-5 py-7 sm:px-8 sm:py-10">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#93c5fd]">
                      {tier.name}
                    </h3>
                    <p className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-[2.25rem]">
                      From {formatProfessionalUsd(tier.monthlyFrom)}
                      <span className="text-base font-semibold text-white/50 sm:text-lg"> / month</span>
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-white/55">{tier.description}</p>
                    <ul className="mt-6 space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm text-white/75">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-[#3b82f6]"
                            strokeWidth={2.5}
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-8">
                      <Link
                        href={tier.ctaHref}
                        className={`flex h-11 w-full items-center justify-center rounded-lg px-5 text-sm font-semibold transition-colors ${
                          tier.highlighted
                            ? "bg-white text-[#0b2d63] hover:bg-[#f8fafc]"
                            : "border border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                        }`}
                      >
                        {tier.ctaLabel}
                      </Link>
                    </div>
                  </div>
                </TierCardShell>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-6xl rounded-2xl border border-white/[0.12] bg-gradient-to-b from-white/[0.08] to-white/[0.04] px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:px-8 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#93c5fd]">
                Launch & implementation
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/50">
                Every organisation is different. We issue a fixed implementation proposal before your
                project begins — no hourly billing, no surprise invoices.
              </p>
              <p className="mt-5 text-sm font-medium text-white/70">
                Typical implementation investment:
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">
                {formatProfessionalUsd(MARKETING_IMPLEMENTATION_LOW_USD)} to{" "}
                {formatProfessionalUsd(MARKETING_IMPLEMENTATION_HIGH_USD)}
              </p>
              <p className="mt-1 text-sm text-white/45">Scoped to your systems and rollout.</p>
            </div>
            <div>
              <p className="text-sm font-medium text-white/70">Implementation includes:</p>
              <ul className="mt-3 space-y-3">
                {IMPLEMENTATION_INCLUDES.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/75">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#3b82f6]" strokeWidth={2.5} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm text-white/45">
                Billed quarterly by default. Initial commitment: 3 months. Annual prepay:{" "}
                {annualDiscountPct}% discount.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14 px-2 text-center sm:mt-20 sm:px-0">
          <Link
            href="/book"
            className="inline-flex min-h-14 w-full max-w-lg items-center justify-center rounded-xl bg-[#15803d] px-6 text-base font-semibold text-white shadow-[0_2px_12px_rgba(21,128,61,0.35)] transition-colors hover:bg-[#166534] sm:h-16 sm:w-auto sm:px-10 sm:text-lg"
          >
            Book a free demo
          </Link>
          <p className="mt-6 text-sm text-white/40 sm:mt-8">
            Pricing confirmed in your proposal — demos are the right first step for most teams.
          </p>
        </div>
      </div>
    </section>
  );
}
