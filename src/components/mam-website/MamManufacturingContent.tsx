import Image from "next/image";

import { MAM_MANUFACTURING_HERO_IMAGE } from "@/lib/mam/mam-website";

import MamPageHero from "./MamPageHero";
import { MamButton, MamContainer, MamHeading, MamSection } from "./MamUi";

const SECTIONS = [
  {
    title: "Prototyping",
    body: "Physical prototypes to validate geometry, assembly and function before committing to production decisions.",
  },
  {
    title: "Functional Components",
    body: "Parts intended for operational use — produced with the application requirements in mind.",
  },
  {
    title: "Custom Parts",
    body: "One-off or specialised components manufactured from your CAD data and engineering inputs.",
  },
  {
    title: "Low-Volume Production",
    body: "Repeatable small batches without the lead time and cost of traditional tooling.",
  },
  {
    title: "Complex Geometries",
    body: "Additive routes for shapes that are difficult or uneconomic to produce conventionally.",
  },
  {
    title: "Iterative Product Development",
    body: "Fast design-build-test cycles to refine products with physical feedback at each stage.",
  },
] as const;

export default function MamManufacturingContent() {
  return (
    <>
      <MamPageHero
        eyebrow="Manufacturing"
        title="Advanced Additive Manufacturing"
        lead="MAM applies advanced additive manufacturing to turn engineering intent into physical components — from first prototypes through to low-volume production runs."
        imageSrc={MAM_MANUFACTURING_HERO_IMAGE}
        imageAlt="Industrial additive manufacturing environment"
        primaryCta={{ href: "/contact", label: "Discuss Your Manufacturing Requirement" }}
      />

      <MamSection tone="elevated">
        <MamContainer>
          <p className="max-w-3xl text-base leading-relaxed text-[#b0b8c0]">
            Additive manufacturing allows complex parts to be built directly from digital data. MAM
            focuses on translating your design and application requirements into a practical
            production approach — selecting processes, sequencing and finishing steps that match
            how the part will be used.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {SECTIONS.map((s) => (
              <article key={s.title} className="border border-white/10 p-6">
                <h2 className="text-lg font-semibold text-white">{s.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[#b0b8c0]">{s.body}</p>
              </article>
            ))}
          </div>
          <div className="mt-12 relative aspect-[21/9] max-h-80 overflow-hidden border border-white/10">
            <Image
              src={MAM_MANUFACTURING_HERO_IMAGE}
              alt="Manufacturing process detail"
              fill
              className="object-cover opacity-90"
              sizes="100vw"
            />
          </div>
          <div className="mt-10">
            <MamButton href="/contact" variant="primary">
              Discuss Your Manufacturing Requirement
            </MamButton>
          </div>
        </MamContainer>
      </MamSection>
    </>
  );
}
