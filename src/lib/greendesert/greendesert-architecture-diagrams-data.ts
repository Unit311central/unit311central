import type { CustomerArchitectureDiagram } from "@/lib/customer-architecture-store";

/** Architecture diagrams for Green Desert algae cultivation platform. */
export const GREENDESERT_ARCHITECTURE_DIAGRAMS: Array<
  Omit<CustomerArchitectureDiagram, "id">
> = [
  {
    title: "Algae cultivation platform overview",
    slug: "algae-cultivation-overview",
    description:
      "End-to-end photobioreactor layout, nutrient dosing, harvest, and powder production for the Jeddah pilot site.",
    notes: "Source: greendesert.tech — innovative algae production technology.",
  },
  {
    title: "IoT monitoring & control layer",
    slug: "iot-monitoring-control",
    description:
      "Sensor mesh, edge controllers, and ML-driven growth optimisation across cultivation tanks.",
    notes: "Chemical engineering, IoT, and machine learning integration.",
  },
  {
    title: "Water efficiency closed loop",
    slug: "water-efficiency-loop",
    description:
      "Recirculation, quality sensors, and recovery systems — 10× less water than comparable protein sources.",
    notes: "Critical for Saudi Arabia water-scarce operations.",
  },
  {
    title: "Client integration — Jeddah Technologies",
    slug: "jeddah-client-integration",
    description:
      "Secure APIs and telemetry export between Green Desert operations and Jeddah Technologies client systems.",
    notes: "Board and client portal access boundaries.",
  },
];

export const GREENDESERT_ARCHITECTURE_DIAGRAM_SLUGS = GREENDESERT_ARCHITECTURE_DIAGRAMS.map(
  (diagram) => diagram.slug,
);
