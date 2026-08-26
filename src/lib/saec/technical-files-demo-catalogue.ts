/**
 * Demo technical file records for OmniTransit — clearly labelled demonstration content.
 */

export type SaecTechnicalFileDemoRow = {
  masterId: string;
  fileId: string;
  versionId: string;
  masterTitle: string;
  title: string;
  description: string;
  category: string;
  status: string;
  programRef: string;
  productRef: string;
  partNumber: string | null;
  drawingNumber: string | null;
  revision: string;
  fileName: string;
  tags: string[];
};

export const SAEC_TECHNICAL_FILES_DEMO: SaecTechnicalFileDemoRow[] = [
  {
    masterId: "saec-tf-master-klk",
    fileId: "saec-tf-001",
    versionId: "saec-tf-ver-001",
    masterTitle: "KLK escalator range",
    title: "KLK escalator installation manual (demo)",
    description: "Demonstration installation manual for KLK escalator range — not a regulated document.",
    category: "Specification",
    status: "Released",
    programRef: "KLK-2026",
    productRef: "KLK-500",
    partNumber: "KLK-INST-MAN-001",
    drawingNumber: null,
    revision: "Rev C",
    fileName: "DEMO_KLK_Installation_Manual.pdf",
    tags: ["escalator", "installation", "demo"],
  },
  {
    masterId: "saec-tf-master-pass-lift",
    fileId: "saec-tf-002",
    versionId: "saec-tf-ver-002",
    masterTitle: "Passenger lift portfolio",
    title: "Passenger lift maintenance handbook (demo)",
    description: "Demonstration service handbook for passenger lifts.",
    category: "Reference",
    status: "Approved",
    programRef: "SVC-2026",
    productRef: "PL-800",
    partNumber: "PL-SVC-HB-010",
    drawingNumber: null,
    revision: "Rev 2",
    fileName: "DEMO_Passenger_Lift_Service_Handbook.pdf",
    tags: ["lift", "maintenance", "demo"],
  },
  {
    masterId: "saec-tf-master-centurion",
    fileId: "saec-tf-003",
    versionId: "saec-tf-ver-003",
    masterTitle: "Centurion Mall programme",
    title: "Centurion lift bank installation drawing (demo)",
    description: "Demonstration installation layout drawing — engineering demo only.",
    category: "Drawing",
    status: "Released",
    programRef: "CENT-2026",
    productRef: "PL-800",
    partNumber: null,
    drawingNumber: "DWG-CENT-LB-042",
    revision: "Rev 1",
    fileName: "DEMO_Centurion_Lift_Bank_Layout.dwg",
    tags: ["drawing", "installation", "demo"],
  },
  {
    masterId: "saec-tf-master-safety",
    fileId: "saec-tf-004",
    versionId: "saec-tf-ver-004",
    masterTitle: "Safety documentation",
    title: "Escalator step chain inspection checklist (demo)",
    description: "Demonstration inspection checklist for field teams.",
    category: "Test / Validation",
    status: "Approved",
    programRef: "SAFETY-2026",
    productRef: "KLK-500",
    partNumber: null,
    drawingNumber: null,
    revision: "Rev 4",
    fileName: "DEMO_Step_Chain_Inspection_Checklist.pdf",
    tags: ["safety", "inspection", "demo"],
  },
  {
    masterId: "saec-tf-master-safety",
    fileId: "saec-tf-005",
    versionId: "saec-tf-ver-005",
    masterTitle: "Safety documentation",
    title: "Shaft rescue procedure — demonstration SOP",
    description: "Demonstration emergency rescue procedure for training purposes.",
    category: "Design Document",
    status: "Approved",
    programRef: "SAFETY-2026",
    productRef: "PL-800",
    partNumber: null,
    drawingNumber: null,
    revision: "Rev 1",
    fileName: "DEMO_Shaft_Rescue_Procedure.pdf",
    tags: ["safety", "rescue", "demo"],
  },
  {
    masterId: "saec-tf-master-klk",
    fileId: "saec-tf-006",
    versionId: "saec-tf-ver-006",
    masterTitle: "KLK escalator range",
    title: "Escalator commissioning test record template (demo)",
    description: "Demonstration commissioning record — not an official inspection certificate.",
    category: "Test / Validation",
    status: "In Review",
    programRef: "KLK-2026",
    productRef: "KLK-500",
    partNumber: "KLK-COMM-TPL-002",
    drawingNumber: null,
    revision: "Draft",
    fileName: "DEMO_Commissioning_Test_Template.xlsx",
    tags: ["commissioning", "demo"],
  },
  {
    masterId: "saec-tf-master-engineering",
    fileId: "saec-tf-007",
    versionId: "saec-tf-ver-007",
    masterTitle: "Engineering programmes",
    title: "Motor room layout — Brooklyn Mall (demo)",
    description: "Demonstration motor room layout drawing.",
    category: "CAD",
    status: "Released",
    programRef: "BKN-2026",
    productRef: "PL-800",
    partNumber: null,
    drawingNumber: "DWG-BKN-MR-018",
    revision: "Rev 2",
    fileName: "DEMO_Brooklyn_Motor_Room_Layout.dwg",
    tags: ["cad", "drawing", "demo"],
  },
  {
    masterId: "saec-tf-master-engineering",
    fileId: "saec-tf-008",
    versionId: "saec-tf-ver-008",
    masterTitle: "Engineering programmes",
    title: "Service documentation — V&A Waterfront coastal programme (demo)",
    description: "Demonstration service programme documentation for coastal escalator maintenance.",
    category: "Manufacturing",
    status: "Approved",
    programRef: "VAW-2026",
    productRef: "KLK-500",
    partNumber: null,
    drawingNumber: null,
    revision: "Rev 1",
    fileName: "DEMO_VAW_Service_Programme.pdf",
    tags: ["service", "coastal", "demo"],
  },
];

export const SAEC_TECHNICAL_FILE_MASTERS = [
  {
    id: "saec-tf-master-klk",
    title: "KLK escalator range",
    description: "Demonstration document set for KLK escalator programmes.",
    programRef: "KLK-2026",
    productRef: "KLK-500",
  },
  {
    id: "saec-tf-master-pass-lift",
    title: "Passenger lift portfolio",
    description: "Demonstration passenger lift technical library.",
    programRef: "SVC-2026",
    productRef: "PL-800",
  },
  {
    id: "saec-tf-master-centurion",
    title: "Centurion Mall programme",
    description: "Demonstration installation programme files.",
    programRef: "CENT-2026",
    productRef: "PL-800",
  },
  {
    id: "saec-tf-master-safety",
    title: "Safety documentation",
    description: "Demonstration safety and inspection templates.",
    programRef: "SAFETY-2026",
    productRef: null,
  },
  {
    id: "saec-tf-master-engineering",
    title: "Engineering programmes",
    description: "Demonstration engineering drawings and service docs.",
    programRef: "ENG-2026",
    productRef: null,
  },
];
