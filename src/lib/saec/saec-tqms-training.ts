import type { TqmsMockState } from "@/lib/tqms-mock-store";
import type { TqmsCourse, TqmsDocStatus, TqmsQmsSection } from "@/lib/tqms-data";

const SAEC_COURSES: TqmsCourse[] = [
  {
    id: "saec-course-lift-tech",
    code: "SAEC-LIFT-101",
    title: "Passenger lift technician certification",
    category: "Technical",
    mandatory: true,
    durationHours: 16,
    status: "Published",
    owner: "Pieter van der Merwe",
    description: "Installation, adjustment, and safety testing for passenger lifts.",
  },
  {
    id: "saec-course-esc-tech",
    code: "SAEC-ESC-201",
    title: "Escalator commissioning & safety",
    category: "Technical",
    mandatory: true,
    durationHours: 12,
    status: "Published",
    owner: "Bongani Cele",
    description: "Escalator commissioning, step chain inspection, and public safety.",
  },
  {
    id: "saec-course-hs",
    code: "SAEC-HS-040",
    title: "Working at height — lift shafts",
    category: "Health & Safety",
    mandatory: true,
    durationHours: 4,
    status: "Published",
    owner: "Lerato Nkosi",
  },
  {
    id: "saec-course-qms",
    code: "SAEC-QMS-010",
    title: "ISO 9001 awareness for field teams",
    category: "QMS",
    mandatory: false,
    durationHours: 3,
    status: "Published",
    owner: "Nadia Govender",
  },
];

const SAEC_QMS_SECTIONS: TqmsQmsSection[] = [
  {
    id: "saec-qms-install",
    name: "Installation procedures",
    owner: "Pieter van der Merwe",
    status: "On track",
    outstanding: 2,
    nextDue: "2026-10-01",
    view: "qms-procedures",
  },
  {
    id: "saec-qms-service",
    name: "Service & maintenance SOPs",
    owner: "Lerato Nkosi",
    status: "On track",
    outstanding: 1,
    nextDue: "2026-09-15",
    view: "qms-procedures",
  },
  {
    id: "saec-qms-safety",
    name: "Health & safety",
    owner: "Nadia Govender",
    status: "On track",
    outstanding: 0,
    nextDue: "2026-11-01",
    view: "qms-compliance",
  },
];

export function applySaecTqmsSeed(base: TqmsMockState): TqmsMockState {
  return {
    ...base,
    courses: SAEC_COURSES,
    qmsSections: SAEC_QMS_SECTIONS,
    documents: base.documents.slice(0, 3).map((doc, index) => ({
      ...doc,
      id: `saec-doc-${index + 1}`,
      number: `SAEC-POL-${String(index + 1).padStart(3, "0")}`,
      title:
        index === 0
          ? "Lift installation quality plan"
          : index === 1
            ? "Emergency rescue procedure"
            : "Escalator inspection checklist",
      owner: "Nadia Govender",
      status: "Approved" as TqmsDocStatus,
    })),
    capas: [
      {
        id: "saec-capa-1",
        reference: "CAPA-2026-014",
        issue: "Incomplete commissioning checklist on site file",
        owner: "Bongani Cele",
        priority: "Medium",
        status: "Open",
        dueDate: "2026-09-15",
        rootCause: "Mobile form sync delay",
        timeline: [{ at: "2026-08-10", label: "Opened" }],
      },
    ],
    audits: [
      {
        id: "saec-audit-1",
        title: "ISO 9001 surveillance audit",
        scope: "Pretoria HQ and Gauteng service depots",
        lead: "Nadia Govender",
        scheduledFor: "2026-09-22",
        status: "Scheduled",
        findings: 0,
        actionsOpen: 0,
      },
    ],
    activity: [
      {
        id: "saec-tqms-act",
        at: new Date().toISOString(),
        label: "SAEC training & QMS loaded",
        detail: "Elevator/escalator courses and quality procedures.",
      },
      ...base.activity.slice(0, 4),
    ],
  };
}
