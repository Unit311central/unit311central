"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const HERO_BACKGROUND = "/images/overview-corporate-intelligence-bg.png";

export default function HeroVideoBackground() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setPrefersReducedMotion(media.matches);

    syncPreference();
    media.addEventListener("change", syncPreference);
    return () => media.removeEventListener("change", syncPreference);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {prefersReducedMotion ? (
        <div
          className="absolute inset-0 bg-[#020617]"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(37, 99, 235, 0.22), transparent 70%), #020617",
          }}
        />
      ) : (
        <>
          <Image
            src={HERO_BACKGROUND}
            alt=""
            fill
            priority
            quality={92}
            sizes="100vw"
            className="object-cover object-center opacity-[0.52] sm:opacity-[0.5] lg:opacity-[0.48]"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-[#030712]/45 via-[#020617]/60 to-[#020617]/78"
            aria-hidden
          />
        </>
      )}
    </div>
  );
}
