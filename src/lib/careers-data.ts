export type CareerOpening = {
  id: string;
  title: string;
  team: string;
  location: string;
  description: string;
};

const CAREER_OPENINGS_STORAGE_KEY = "unit311-career-openings";

export const CAREERS_WEBSITE_URL = "https://unit311central.com/careers";

export const CAREER_OPENINGS: CareerOpening[] = [
  {
    id: "chief-systems-engineer",
    title: "Chief Systems Engineer",
    team: "Flight Systems",
    location: "Texas / Hybrid",
    description:
      "The Chief Systems Engineer at OnwardAir will lead the systems engineering program for the Vertex VTOL hybrid electric aircraft, providing comprehensive technical oversight of all subsystems including propulsion, power management, flight controls, avionics, and structural integration. This role is responsible for defining and managing system architecture, establishing technical requirements, ensuring seamless integration of modular components, and maintaining configuration control throughout the development lifecycle. The Chief Systems Engineer will coordinate cross-disciplinary engineering teams, conduct system-level trade studies and analyses, manage technical risk, and ensure compliance with aviation certification standards and safety requirements. The ideal candidate will possess deep expertise in aircraft systems integration, hybrid-electric propulsion architectures, VTOL operations, and certification processes, with proven leadership experience guiding complex aerospace development programs from concept through flight testing and certification.",
  },
  {
    id: "aerospace-engineer-flight-control",
    title: "Aerospace Engineer (Flight Control)",
    team: "Flight Systems",
    location: "Texas / Hybrid",
    description:
      "The Aerospace Engineer (Flight Control) at OnwardAir will be responsible for the development and refinement of the Vertex VTOL’s flight control systems, with emphasis on sensor fusion algorithms that integrate data from multiple sources to provide robust state estimation and situational awareness. This role involves designing, implementing, and validating guidance, navigation, and control (GNC) algorithms to ensure stable and responsive aircraft performance across all flight regimes, including hover, transition, and cruise modes. The engineer will also lead the maturation of OnwardAir’s advanced pilot flight control joystick, developing intuitive control interfaces, haptic feedback systems, and fly-by-wire logic that enhance pilot workload management and aircraft handling qualities. The ideal candidate will possess strong expertise in control theory, Kalman filtering, embedded systems programming, and flight dynamics, with hands-on experience in flight control system development, simulation validation, and flight test support for VTOL or advanced aircraft platforms.",
  },
  {
    id: "electrical-engineer-power-systems",
    title: "Electrical Engineer (Power Systems)",
    team: "Flight Systems",
    location: "Texas / Hybrid",
    description:
      "The Electrical Engineer (Power Systems) at OnwardAir will be responsible for the refinement and optimization of the Vertex VTOL’s high voltage electrical power distribution and management system, ensuring reliable and efficient power delivery from the hybrid powerplant to electric propulsion motors, flight-critical avionics, and auxiliary systems. This role involves designing power distribution architectures, selecting and integrating high voltage components including battery management systems, inverters, converters, and protection devices, while ensuring compliance with aerospace safety standards and electromagnetic compatibility requirements. The engineer will conduct detailed electrical analyses including load profiling, fault scenarios, thermal management, and system efficiency optimization, as well as support ground testing and flight test validation activities. The ideal candidate will possess strong expertise in high voltage electrical systems, power electronics, battery technology, and aircraft electrical architecture, with experience in hybrid-electric propulsion systems, DO-160 compliance, and the unique challenges of VTOL aircraft power management.",
  },
];

export function slugifyCareerId(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function createBlankCareerOpening(): Omit<CareerOpening, "id"> {
  return {
    title: "",
    team: "",
    location: "Texas / Hybrid",
    description: "",
  };
}

export function loadCareerOpenings(): CareerOpening[] {
  if (typeof window === "undefined") return CAREER_OPENINGS;

  try {
    const stored = localStorage.getItem(CAREER_OPENINGS_STORAGE_KEY);
    if (!stored) return CAREER_OPENINGS;
    const parsed = JSON.parse(stored) as CareerOpening[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : CAREER_OPENINGS;
  } catch {
    return CAREER_OPENINGS;
  }
}

export function saveCareerOpenings(openings: CareerOpening[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CAREER_OPENINGS_STORAGE_KEY, JSON.stringify(openings));
}
