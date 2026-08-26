/**
 * OmniTransit engineering risk register — distinct from team/capacity views.
 */

export type SaecEngineeringRisk = {
  id: string;
  title: string;
  category: string;
  probability: "low" | "medium" | "high";
  impact: "low" | "medium" | "high" | "critical";
  score: number;
  owner: string;
  mitigation: string;
  status: "open" | "mitigating" | "accepted" | "closed";
  dueDate: string;
  program: string;
};

export const SAEC_ENGINEERING_RISKS: SaecEngineeringRisk[] = [
  {
    id: "saec-risk-01",
    title: "Centurion Mall commissioning delay — hoist beam rework",
    category: "Delivery",
    probability: "medium",
    impact: "high",
    score: 12,
    owner: "Pieter van der Merwe",
    mitigation: "Second-site fabrication slot booked; daily client engineering stand-up.",
    status: "mitigating",
    dueDate: "2026-09-12",
    program: "Centurion Mall KLK",
  },
  {
    id: "saec-risk-02",
    title: "National spare escalator step supply lead time",
    category: "Supply chain",
    probability: "high",
    impact: "medium",
    score: 9,
    owner: "Lerato Nkosi",
    mitigation: "Buffer stock at Johannesburg depot; alternate OEM steps qualified.",
    status: "open",
    dueDate: "2026-08-30",
    program: "National maintenance",
  },
  {
    id: "saec-risk-03",
    title: "Load-shedding affecting Cape Town call-out SLA",
    category: "Operations",
    probability: "high",
    impact: "high",
    score: 16,
    owner: "Nadia Govender",
    mitigation: "Generator-backed depot; priority routing for hospitals and malls.",
    status: "mitigating",
    dueDate: "2026-09-05",
    program: "Western Cape service",
  },
  {
    id: "saec-risk-04",
    title: "Inspector availability — Limpopo compliance backlog",
    category: "Compliance",
    probability: "medium",
    impact: "medium",
    score: 6,
    owner: "Mpho Sebata",
    mitigation: "Contracted third-party inspector pool; weekend inspection windows.",
    status: "open",
    dueDate: "2026-09-20",
    program: "Compliance programme",
  },
  {
    id: "saec-risk-05",
    title: "Escalator entrapment — legacy controller firmware",
    category: "Safety",
    probability: "low",
    impact: "critical",
    score: 8,
    owner: "Elaine Fourie",
    mitigation: "Firmware patch rolled out to 78% of fleet; remaining sites scheduled.",
    status: "mitigating",
    dueDate: "2026-08-28",
    program: "Firmware remediation",
  },
  {
    id: "saec-risk-06",
    title: "Skills gap — MRL installation technicians",
    category: "People",
    probability: "medium",
    impact: "high",
    score: 12,
    owner: "Bongani Cele",
    mitigation: "KLK certification cohort (18 engineers) completing Aug 2026.",
    status: "open",
    dueDate: "2026-10-01",
    program: "Engineering training",
  },
  {
    id: "saec-risk-07",
    title: "Hyprop portfolio — concurrent modernisation windows",
    category: "Delivery",
    probability: "medium",
    impact: "medium",
    score: 6,
    owner: "Thabo Mokoena",
    mitigation: "Phased mall closures agreed with centre management.",
    status: "accepted",
    dueDate: "2026-11-15",
    program: "Hyprop modernisation",
  },
  {
    id: "saec-risk-08",
    title: "Remote monitoring gateway connectivity — mining sites",
    category: "Technology",
    probability: "low",
    impact: "medium",
    score: 4,
    owner: "Dewald Lassen",
    mitigation: "LTE failover modules deployed; quarterly signal audits.",
    status: "closed",
    dueDate: "2026-07-15",
    program: "IoT monitoring",
  },
];
