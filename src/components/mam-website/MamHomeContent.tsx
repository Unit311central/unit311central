import Image from "next/image";

import {
  MAM_CASA_IMAGE,
  MAM_HERO_IMAGE,
  MAM_PROCESS_IMAGE,
} from "@/lib/mam/mam-website";

import MamPageHero from "./MamPageHero";
import {
  MamButton,
  MamContainer,
  MamEyebrow,
  MamHeading,
  MamIndustryPill,
  MamLead,
  MamProcessStep,
  MamSection,
  MamServiceCard,
  MamWhyItem,
} from "./MamUi";

const WORKFLOW = ["Design", "Engineering", "Production", "Finishing", "Delivery"] as const;

const SERVICES = [
  {
    title: "Additive Manufacturing",
    body: "Production of complex components and products using advanced additive manufacturing technologies.",
  },
  {
    title: "Rapid Prototyping",
    body: "Quickly transform digital designs into physical prototypes for testing, validation and development.",
  },
  {
    title: "Functional Parts",
    body: "Manufacture components designed for real-world use rather than visual prototypes alone.",
  },
  {
    title: "Low-Volume Production",
    body: "Produce small production runs without committing to expensive tooling or large manufacturing volumes.",
  },
  {
    title: "Custom Components",
    body: "Manufacture specialised components based on customer designs and engineering requirements.",
  },
  {
    title: "Engineering & Production Support",
    body: "Support customers through material selection, manufacturability considerations, production and finishing.",
  },
] as const;

const INDUSTRIES = [
  "Aerospace",
  "Automotive",
  "Medical",
  "Industrial",
  "Robotics",
  "Energy",
  "Consumer Products",
  "Architecture",
  "Research & Development",
] as const;

export default function MamHomeContent() {
  return (
    <>
      <MamPageHero
        title="Advanced Manufacturing. Engineered in Morocco."
        lead="MAM provides advanced additive manufacturing and precision production services from Casablanca, helping businesses turn digital designs into high-quality physical components and products."
        imageSrc={MAM_HERO_IMAGE}
        imageAlt="Precision manufactured metal component in an industrial setting"
        primaryCta={{ href: "/contact", label: "Request a Quote" }}
        secondaryCta={{ href: "/capabilities", label: "Explore Capabilities" }}
      />

      <MamSection tone="elevated">
        <MamContainer>
          <MamEyebrow>Introduction</MamEyebrow>
          <MamHeading as="h2" className="mt-3 max-w-2xl">
            From Digital Design to Physical Reality
          </MamHeading>
          <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="space-y-4 text-sm leading-relaxed text-[#b0b8c0] sm:text-base">
              <p>
                MAM combines advanced additive manufacturing technology with engineering-focused
                production capabilities to help customers move from concept and design to physical
                parts faster.
              </p>
              <p>
                Whether developing a new product, validating an engineering concept or producing a
                limited production run, MAM provides a flexible manufacturing route without the
                tooling requirements and constraints associated with traditional production methods.
              </p>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden border border-white/10">
              <Image
                src={MAM_PROCESS_IMAGE}
                alt="Engineering review of a manufactured component"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border border-white/10 bg-[#0c0e11] px-4 py-6 sm:px-8">
            {WORKFLOW.map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#8fa4b8]">{step}</span>
                {i < WORKFLOW.length - 1 ? (
                  <span className="hidden text-white/25 sm:inline" aria-hidden>
                    →
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </MamContainer>
      </MamSection>

      <MamSection>
        <MamContainer>
          <MamEyebrow>Services</MamEyebrow>
          <MamHeading as="h2" className="mt-3">
            Manufacturing Services
          </MamHeading>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <MamServiceCard key={s.title} title={s.title}>
                {s.body}
              </MamServiceCard>
            ))}
          </div>
        </MamContainer>
      </MamSection>

      <MamSection tone="elevated">
        <MamContainer>
          <MamHeading as="h2">Why MAM</MamHeading>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <MamWhyItem title="Advanced Technology">
              Modern additive manufacturing capabilities for complex and demanding applications.
            </MamWhyItem>
            <MamWhyItem title="Engineering Focus">
              Manufacturing decisions driven by the requirements of the final component or product.
            </MamWhyItem>
            <MamWhyItem title="Production Flexibility">
              From individual prototypes to repeat low-volume production.
            </MamWhyItem>
            <MamWhyItem title="Faster Iteration">
              Move from digital design to physical validation without lengthy tooling cycles.
            </MamWhyItem>
            <MamWhyItem title="Casablanca-Based">
              Advanced manufacturing capability located in Morocco, serving local and international
              customers.
            </MamWhyItem>
          </div>
        </MamContainer>
      </MamSection>

      <MamSection>
        <MamContainer>
          <MamHeading as="h2">Manufacturing Across Industries</MamHeading>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#b0b8c0] sm:text-base">
            MAM works with customers across multiple industries and adapts manufacturing approaches
            to their technical requirements — from early prototypes through to repeat production
            support.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
            {INDUSTRIES.map((label) => (
              <MamIndustryPill key={label} label={label} />
            ))}
          </div>
          <div className="mt-8">
            <MamButton href="/industries" variant="ghost">
              View industries →
            </MamButton>
          </div>
        </MamContainer>
      </MamSection>

      <MamSection tone="elevated">
        <MamContainer>
          <MamHeading as="h2">How We Work</MamHeading>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <MamProcessStep step="01" title="Submit">
              Send MAM your design, drawings or manufacturing requirements.
            </MamProcessStep>
            <MamProcessStep step="02" title="Review">
              The MAM team reviews the component and production requirements.
            </MamProcessStep>
            <MamProcessStep step="03" title="Engineer">
              Manufacturing parameters, materials and production approach are evaluated.
            </MamProcessStep>
            <MamProcessStep step="04" title="Manufacture">
              The component is produced using the appropriate additive manufacturing process.
            </MamProcessStep>
            <MamProcessStep step="05" title="Deliver">
              Parts are finished, inspected as required and prepared for delivery.
            </MamProcessStep>
          </div>
          <div className="mt-10">
            <MamButton href="/contact" variant="primary">
              Start Your Project
            </MamButton>
          </div>
        </MamContainer>
      </MamSection>

      <MamSection>
        <MamContainer>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <MamEyebrow>Location</MamEyebrow>
              <MamHeading as="h2" className="mt-3">
                Advanced Manufacturing from Casablanca
              </MamHeading>
              <p className="mt-6 text-sm leading-relaxed text-[#b0b8c0] sm:text-base">
                Based in Casablanca, MAM brings advanced manufacturing capabilities to Morocco and
                the wider international market.
              </p>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden border border-white/10 grayscale">
              <Image
                src={MAM_CASA_IMAGE}
                alt="Casablanca skyline — industrial and business district"
                fill
                className="object-cover opacity-80"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </MamContainer>
      </MamSection>

      <MamSection tone="elevated" className="border-t border-white/10">
        <MamContainer className="text-center">
          <MamHeading as="h2">Have a Part to Manufacture?</MamHeading>
          <MamLead className="mx-auto mt-4">
            Send us your design or manufacturing requirement and let&apos;s determine the right
            production approach.
          </MamLead>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <MamButton href="/contact" variant="primary">
              Request a Quote
            </MamButton>
            <MamButton href="/contact" variant="ghost">
              Contact MAM
            </MamButton>
          </div>
        </MamContainer>
      </MamSection>
    </>
  );
}
