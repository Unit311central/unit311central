import type { CustomerArchitectureDiagram } from "@/lib/customer-architecture-store";

/** Starter architecture diagrams for Green Desert Information Repository. */
export const GREENDESERT_ARCHITECTURE_DIAGRAMS: Array<
  Omit<CustomerArchitectureDiagram, "id">
> = [
  {
    title: "Reactor deployment — site overview",
    slug: "reactor-site-overview",
    description:
      "High-level layout of the modular reactor campus, cooling loops, and grid interconnection at the Jeddah site.",
    notes: "Reference: Phase 1 deployment for Jeddah Technologies.",
  },
  {
    title: "Control & safety architecture",
    slug: "control-safety-architecture",
    description:
      "SCADA, safety instrumented systems, and operator HMI layers for reactor monitoring and emergency shutdown.",
    notes: "Includes redundant PLC paths and alarm escalation to operations.",
  },
  {
    title: "Logistics & module delivery",
    slug: "logistics-module-delivery",
    description:
      "Riyadh assembly to Jeddah site transport, receiving yard, and crane lift sequence for reactor modules.",
    notes: "Aligned with active Riyadh → Jeddah shipment tracking.",
  },
  {
    title: "Client integration boundary",
    slug: "client-integration-boundary",
    description:
      "APIs and secure data exchange between Green Desert operations and Jeddah Technologies client systems.",
    notes: "Covers telemetry export, billing interfaces, and support ticketing.",
  },
];
