import MamPageHero from "./MamPageHero";
import { MamContainer, MamEyebrow, MamHeading, MamSection } from "./MamUi";

const DESIGN = [
  "Design review",
  "Manufacturability considerations",
  "Geometry optimisation",
  "Production preparation",
] as const;

const AM = [
  "Complex geometries",
  "Custom components",
  "Prototypes",
  "Functional parts",
  "Low-volume production",
] as const;

export default function MamCapabilitiesContent() {
  return (
    <>
      <MamPageHero
        eyebrow="Capabilities"
        title="Manufacturing Capability Built Around Your Requirements"
        lead="Capability is organised around how your component is designed, produced and finished — not around a fixed catalogue of machine specifications."
      />

      <MamSection tone="elevated">
        <MamContainer className="space-y-16">
          <div>
            <MamEyebrow>Design & Engineering</MamEyebrow>
            <MamHeading as="h2" className="mt-3 text-2xl">
              Design & Engineering
            </MamHeading>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {DESIGN.map((item) => (
                <li
                  key={item}
                  className="border border-white/10 bg-[#0c0e11] px-4 py-3 text-sm text-[#b0b8c0]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <MamEyebrow>Additive Manufacturing</MamEyebrow>
            <MamHeading as="h2" className="mt-3 text-2xl">
              Additive Manufacturing
            </MamHeading>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {AM.map((item) => (
                <li
                  key={item}
                  className="border border-white/10 bg-[#0c0e11] px-4 py-3 text-sm text-[#b0b8c0]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <MamEyebrow>Post-Processing</MamEyebrow>
            <MamHeading as="h2" className="mt-3 text-2xl">
              Post-Processing
            </MamHeading>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#b0b8c0] sm:text-base">
              Finishing and post-processing options can be evaluated according to the requirements
              of each component.
            </p>
          </div>

          <div>
            <MamEyebrow>Quality</MamEyebrow>
            <MamHeading as="h2" className="mt-3 text-2xl">
              Quality
            </MamHeading>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#b0b8c0] sm:text-base">
              Inspection and quality requirements are defined according to the application and
              customer requirements.
            </p>
          </div>
        </MamContainer>
      </MamSection>
    </>
  );
}
