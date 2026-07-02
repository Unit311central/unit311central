import Link from "next/link";

const OFFERS = [
  {
    title: "Surveying & Geospatial Intelligence",
    tagline: "Measure. Map. Monitor.",
    href: "/surveying",
    bullets: [
      "Stockpile & Volume",
      "Construction Surveying",
      "Progress Monitoring",
      "Orthomosaic Mapping",
    ],
  },
  {
    title: "Inspection & Asset Intelligence",
    tagline: "Inspect. Assess. Report.",
    href: "/inspection",
    bullets: [
      "Building & Roof",
      "Energy Assets",
      "Infrastructure",
      "Defect Detection",
    ],
  },
  {
    title: "Premium Media & Broadcast",
    tagline: "Capture. Create. Communicate.",
    href: "/commercial-imaging",
    bullets: [
      "Commercial Productions",
      "Sports & Live Events",
      "Hospitality & Yachting",
      "Brand Content",
    ],
  },
] as const;

function ServiceIcon({ index }: { index: number }) {
  const cls = "h-[22px] w-[22px] stroke-white";
  if (index === 0) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}>
        <path d="M3 6l6-3 6 3v12l-6 3-6-3V6z" />
        <path d="M9 3v18M15 6v12" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}>
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}>
      <path d="M4 7h3l2-3h6l2 3h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

export default function WhatWeOffer() {
  return (
    <section id="services" className="topo-bg pb-[88px] pt-[88px]">
      <div className="mx-auto max-w-[1280px] px-8">
        <div className="text-center">
          <h2 className="text-[34px] font-bold leading-tight tracking-[-0.01em] text-[#1a2b4a]">
            What We Can Offer
          </h2>
          <p className="mt-[10px] text-[16px] text-[#1a2b4a]/65">
            End-to-end aerial intelligence and media solutions.
          </p>
        </div>

        <div className="mt-[48px] grid gap-[28px] lg:grid-cols-3">
          {OFFERS.map((item, i) => (
            <div
              key={item.title}
              className="flex min-h-[360px] flex-col rounded-xl bg-white px-[28px] py-[32px] shadow-[0_4px_24px_rgba(11,45,99,0.07)]"
            >
              <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#2563eb]">
                <ServiceIcon index={i} />
              </div>
              <h3 className="mt-[20px] text-[17px] font-bold leading-[1.3] text-[#1a2b4a]">
                {item.title}
              </h3>
              <Link
                href={item.href}
                className="mt-[6px] text-[13px] font-semibold text-[#2563eb]"
              >
                {item.tagline}
              </Link>
              <ul className="mt-[22px] flex-1 space-y-[12px]">
                {item.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-[10px] text-[13px] leading-[1.4] text-[#1a2b4a]/75">
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      className="mt-[2px] h-[14px] w-[14px] shrink-0 text-[#2563eb]"
                      aria-hidden
                    >
                      <path
                        d="M3 8.5l3 3 7-7"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
