import MamPageHero from "./MamPageHero";
import { MamContainer, MamSection } from "./MamUi";
import MamContactForm, { MamContactAside } from "./MamContactForm";

export default function MamContactContent() {
  return (
    <>
      <MamPageHero
        eyebrow="Contact"
        title="Start a Manufacturing Project"
        lead="Tell us what you need to manufacture. Send a drawing, CAD file, specification or simply describe the component and application. Our team can assess the requirement and determine the appropriate next step."
      />

      <MamSection tone="elevated">
        <MamContainer>
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            <MamContactForm />
            <MamContactAside />
          </div>
        </MamContainer>
      </MamSection>
    </>
  );
}
