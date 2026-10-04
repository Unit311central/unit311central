import Image from "next/image";

import { MamButton, MamContainer, MamEyebrow, MamHeading, MamLead } from "./MamUi";

type MamPageHeroProps = {
  eyebrow?: string;
  title: string;
  lead: string;
  imageSrc?: string;
  imageAlt?: string;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
};

export default function MamPageHero({
  eyebrow,
  title,
  lead,
  imageSrc,
  imageAlt = "",
  primaryCta,
  secondaryCta,
}: MamPageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#0c0e11] text-white">
      {imageSrc ? (
        <>
          <div className="absolute inset-0">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              priority
              className="object-cover opacity-35"
              sizes="100vw"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c0e11] via-[#0c0e11]/90 to-[#0c0e11]/40" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,#0c0e11_100%)]" />
        </>
      ) : null}
      <div className="relative border-b border-white/10">
        <MamContainer className="py-20 sm:py-24 lg:py-28">
          {eyebrow ? <MamEyebrow>{eyebrow}</MamEyebrow> : null}
          <MamHeading as="h1" className="mt-4 max-w-3xl">
            {title}
          </MamHeading>
          <MamLead className="mt-6">{lead}</MamLead>
          {primaryCta || secondaryCta ? (
            <div className="mt-8 flex flex-wrap gap-4">
              {primaryCta ? (
                <MamButton href={primaryCta.href} variant="primary">
                  {primaryCta.label}
                </MamButton>
              ) : null}
              {secondaryCta ? (
                <MamButton href={secondaryCta.href} variant="secondary">
                  {secondaryCta.label}
                </MamButton>
              ) : null}
            </div>
          ) : null}
        </MamContainer>
      </div>
    </section>
  );
}
