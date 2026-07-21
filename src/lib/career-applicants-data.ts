export type CareerApplicantStatus =
  | "new"
  | "screening"
  | "interview-scheduled"
  | "interviewed"
  | "offer"
  | "rejected"
  | "withdrawn";

export type CareerApplicant = {
  id: string;
  openingId: string;
  name: string;
  email: string;
  phone?: string;
  resumeFileName: string;
  resumeUrl?: string;
  coverLetter?: string;
  appliedAt: string;
  interviewDate?: string;
  status: CareerApplicantStatus;
  notes?: string;
};

export const CAREER_APPLICANT_STATUS_LABELS: Record<CareerApplicantStatus, string> = {
  new: "New",
  screening: "Screening",
  "interview-scheduled": "Interview scheduled",
  interviewed: "Interviewed",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const CAREER_APPLICANTS: CareerApplicant[] = [
  {
    id: "app-cse-1",
    openingId: "chief-systems-engineer",
    name: "Dr. Elena Vasquez",
    email: "e.vasquez@aerospace-mail.com",
    phone: "+1 512 555 0142",
    resumeFileName: "Elena_Vasquez_CV.pdf",
    resumeUrl: "#",
    coverLetter: "15 years in hybrid-electric VTOL systems integration at Tier-1 OEMs.",
    appliedAt: "2026-06-12",
    interviewDate: "2026-06-28",
    status: "interview-scheduled",
    notes: "Strong certification background — panel interview with CTO.",
  },
  {
    id: "app-cse-2",
    openingId: "chief-systems-engineer",
    name: "James Okonkwo",
    email: "j.okonkwo@engineering.io",
    resumeFileName: "James_Okonkwo_Resume.pdf",
    resumeUrl: "#",
    appliedAt: "2026-06-18",
    status: "screening",
    notes: "Former Boeing systems lead — reviewing references.",
  },
  {
    id: "app-cse-3",
    openingId: "chief-systems-engineer",
    name: "Sarah Mitchell",
    email: "s.mitchell@flighttech.com",
    phone: "+1 713 555 0198",
    resumeFileName: "Sarah_Mitchell_CV.pdf",
    resumeUrl: "#",
    appliedAt: "2026-06-22",
    status: "new",
  },
  {
    id: "app-fc-1",
    openingId: "aerospace-engineer-flight-control",
    name: "Marcus Chen",
    email: "marcus.chen@gnc.dev",
    phone: "+1 469 555 0167",
    resumeFileName: "Marcus_Chen_GNC.pdf",
    resumeUrl: "#",
    coverLetter: "Specialist in sensor fusion and VTOL GNC algorithm development.",
    appliedAt: "2026-06-10",
    interviewDate: "2026-06-24",
    status: "interviewed",
    notes: "Technical interview completed — awaiting flight systems panel feedback.",
  },
  {
    id: "app-fc-2",
    openingId: "aerospace-engineer-flight-control",
    name: "Priya Sharma",
    email: "priya.sharma@controls.ai",
    resumeFileName: "Priya_Sharma_Resume.pdf",
    resumeUrl: "#",
    appliedAt: "2026-06-20",
    status: "screening",
  },
  {
    id: "app-ps-1",
    openingId: "electrical-engineer-power-systems",
    name: "David Kowalski",
    email: "d.kowalski@power.aero",
    phone: "+1 281 555 0133",
    resumeFileName: "David_Kowalski_CV.pdf",
    resumeUrl: "#",
    appliedAt: "2026-06-15",
    interviewDate: "2026-07-02",
    status: "interview-scheduled",
    notes: "HV distribution experience on eVTOL demonstrator programmes.",
  },
  {
    id: "app-ps-2",
    openingId: "electrical-engineer-power-systems",
    name: "Amara Osei",
    email: "amara.osei@electrical.dev",
    resumeFileName: "Amara_Osei_Resume.pdf",
    resumeUrl: "#",
    appliedAt: "2026-06-25",
    status: "new",
  },
];

export function getApplicantsForOpening(openingId: string): CareerApplicant[] {
  return CAREER_APPLICANTS.filter((applicant) => applicant.openingId === openingId);
}

export function formatApplicantDate(value?: string) {
  if (!value) return "—";
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function applicantStatusClass(status: CareerApplicantStatus) {
  switch (status) {
    case "new":
      return "border-sky-400/40 bg-sky-500/15 text-sky-200";
    case "screening":
      return "border-amber-400/40 bg-amber-500/15 text-amber-200";
    case "interview-scheduled":
      return "border-violet-400/40 bg-violet-500/15 text-violet-200";
    case "interviewed":
      return "border-cyan-400/40 bg-cyan-500/15 text-cyan-200";
    case "offer":
      return "border-emerald-400/40 bg-emerald-500/15 text-emerald-200";
    case "rejected":
      return "border-rose-400/40 bg-rose-500/15 text-rose-200";
    case "withdrawn":
      return "border-white/15 bg-white/5 text-white/45";
    default:
      return "border-white/15 bg-white/5 text-white/45";
  }
}
