import MamPageHero from "./MamPageHero";
import { MamContainer, MamHeading, MamSection } from "./MamUi";

const INDUSTRIES = [
  {
    name: "Aerospace",
    body: "Lightweight structures, bracketry and development hardware where complex geometry and rapid iteration matter.",
  },
  {
    name: "Automotive",
    body: "Prototypes, jigs, fixtures and low-volume components for validation and specialised applications.",
  },
  {
    name: "Medical",
    body: "Patient-specific or small-series components where design flexibility supports clinical or R&D workflows.",
  },
  {
    name: "Industrial",
    body: "Replacement parts, tooling aids and custom machine components without long tooling lead times.",
  },
  {
    name: "Robotics",
    body: "Enclosures, end-effector components and bespoke mechanical parts for agile hardware development.",
  },
  {
    name: "Energy",
    body: "Specialised components and prototypes for equipment development and field trials.",
  },
  {
    name: "Consumer Products",
    body: "Design validation, ergonomic models and short-run parts for product launches and testing.",
  },
  {
    name: "Architecture",
    body: "Scale models, facades and experimental structures where additive methods unlock form complexity.",
  },
  {
    name: "Research & Development",
    body: "Experimental geometries and one-off assemblies for laboratories and engineering programmes.",
  },
] as const;

export default function MamIndustriesContent() {
  return (
    <>
      <MamPageHero
        eyebrow="Industries"
        title="Manufacturing Across Industries"
        lead="Additive manufacturing supports different technical drivers in each sector — MAM adapts production approach to your application, not the other way around."
      />

      <MamSection tone="elevated">
        <MamContainer>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {INDUSTRIES.map((ind) => (
              <article
                key={ind.name}
                className="flex h-full flex-col border border-white/10 bg-[#0c0e11] p-6"
              >
                <MamHeading as="h2" className="text-xl">
                  {ind.name}
                </MamHeading>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[#b0b8c0]">{ind.body}</p>
              </article>
            ))}
          </div>
        </MamContainer>
      </MamSection>
    </>
  );
}
