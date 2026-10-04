import MamPageHero from "./MamPageHero";
import { MamContainer, MamEyebrow, MamHeading, MamSection } from "./MamUi";

const PILLARS = [
  {
    title: "Engineering mindset",
    body: "Production decisions start from how the part must perform in service.",
  },
  {
    title: "Manufacturing capability",
    body: "Advanced additive routes for prototypes, functional parts and low-volume runs.",
  },
  {
    title: "Customer collaboration",
    body: "Clear communication from requirement review through delivery.",
  },
  {
    title: "Flexible production",
    body: "Scale from a single prototype to repeat batches without traditional tooling.",
  },
  {
    title: "Moroccan base",
    body: "Operations anchored in Casablanca with scope to serve regional and international customers.",
  },
  {
    title: "International ambition",
    body: "Built to meet the expectations of engineering-led customers wherever they are based.",
  },
] as const;

export default function MamAboutContent() {
  return (
    <>
      <MamPageHero
        eyebrow="About"
        title="Building Advanced Manufacturing Capability in Morocco"
        lead="MAM is focused on bringing modern additive manufacturing and advanced production capability to customers from its base in Casablanca."
      />

      <MamSection tone="elevated">
        <MamContainer>
          <MamEyebrow>Who we are</MamEyebrow>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#b0b8c0]">
            Moroccan Advanced Manufacturing — MAM — is an industrial company, not a software
            platform. We exist to help engineering teams and businesses convert digital design data
            into physical components through additive manufacturing and related production support.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p) => (
              <div key={p.title} className="border border-white/10 p-5">
                <h2 className="text-base font-semibold text-white">{p.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#b0b8c0]">{p.body}</p>
              </div>
            ))}
          </div>
        </MamContainer>
      </MamSection>
    </>
  );
}
