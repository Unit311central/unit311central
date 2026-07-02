export type BcdCourseId =
  | "uas-applications"
  | "sora-regulatory"
  | "design-construction"
  | "integrated-pilot"
  | "operational-authorisation"
  | "radiophonist"
  | "geo-zones"
  | "customized";

export type BcdTrainingClient = {
  id: string;
  name: string;
  organisation: string;
  country: string;
  courseId: BcdCourseId;
  courseLabel: string;
  edition: string;
  status: "Confirmed" | "Waitlisted" | "In Progress" | "Completed";
  email: string;
};

export type BcdCourseTile = {
  id: BcdCourseId;
  title: string;
  edition: string;
  description: string;
  accent: string;
  enrolled: number;
};

export const BCD_COURSE_TILES: readonly BcdCourseTile[] = [
  {
    id: "uas-applications",
    title: "UAS Applications Workshop",
    edition: "1–5 Jun 2026",
    description:
      "Hands-on applications workshop covering payloads, mission planning, and real-world UAS use cases.",
    accent: "from-sky-500/20 to-blue-600/10 border-sky-400/30",
    enrolled: 2,
  },
  {
    id: "sora-regulatory",
    title: "UAS Regulatory & SORA 2.5 Training",
    edition: "8–12 Jun 2026",
    description:
      "EU regulatory framework, operational categories, and SORA 2.5 risk assessment methodology.",
    accent: "from-indigo-500/20 to-violet-600/10 border-indigo-400/30",
    enrolled: 1,
  },
  {
    id: "design-construction",
    title: "Design & Construction Course",
    edition: "15–19 Jun 2026",
    description:
      "UAS design principles, construction techniques, and airworthiness considerations for custom platforms.",
    accent: "from-amber-500/20 to-orange-600/10 border-amber-400/30",
    enrolled: 2,
  },
  {
    id: "integrated-pilot",
    title: "Integrated Drone Pilot Training (STS-01 & STS-02)",
    edition: "22–26 Jun 2026",
    description:
      "Official pilot certification pathway for EU standard scenarios STS-01 and STS-02.",
    accent: "from-emerald-500/20 to-teal-600/10 border-emerald-400/30",
    enrolled: 1,
  },
  {
    id: "operational-authorisation",
    title: "UAS Pilot Training – Operational Authorisation",
    edition: "On demand",
    description:
      "Specific Category operational authorisation preparation with NAA submission support.",
    accent: "from-cyan-500/20 to-sky-600/10 border-cyan-400/30",
    enrolled: 1,
  },
  {
    id: "radiophonist",
    title: "UAS Radiophonist Course",
    edition: "On demand",
    description:
      "Aeronautical radio phraseology and radiophonist certification for professional UAS operations.",
    accent: "from-rose-500/20 to-red-600/10 border-rose-400/30",
    enrolled: 1,
  },
  {
    id: "geo-zones",
    title: "Geographical Zones & Airspace Restrictions",
    edition: "On demand",
    description:
      "EU geographical zones, U-space interfaces, and airspace restriction management for operators.",
    accent: "from-fuchsia-500/20 to-purple-600/10 border-fuchsia-400/30",
    enrolled: 1,
  },
  {
    id: "customized",
    title: "Customized Course",
    edition: "On demand",
    description:
      "Tailored corporate programmes — duration, content, and delivery adapted to your organisation.",
    accent: "from-slate-500/20 to-zinc-600/10 border-slate-400/30",
    enrolled: 1,
  },
];

export const BCD_TRAINING_CLIENTS: readonly BcdTrainingClient[] = [
  {
    id: "train-1",
    name: "Ian Asige Mweresa",
    organisation: "RCMRD",
    country: "Kenya",
    courseId: "uas-applications",
    courseLabel: "UAS Applications Workshop",
    edition: "1–5 Jun 2026",
    status: "Confirmed",
    email: "i.mweresa@rcmrd.go.ke",
  },
  {
    id: "train-2",
    name: "Andrés Flores",
    organisation: "Universidad de Perú",
    country: "Peru",
    courseId: "uas-applications",
    courseLabel: "UAS Applications Workshop",
    edition: "1–5 Jun 2026",
    status: "Confirmed",
    email: "a.flores@universidad.pe",
  },
  {
    id: "train-3",
    name: "Gregor Calderwood",
    organisation: "Tullow Oil",
    country: "United Kingdom",
    courseId: "sora-regulatory",
    courseLabel: "UAS Regulatory & SORA 2.5 Training",
    edition: "8–12 Jun 2026",
    status: "Confirmed",
    email: "g.calderwood@tullowoil.com",
  },
  {
    id: "train-4",
    name: "Sanket P Inamdar",
    organisation: "Bharat Forge",
    country: "India",
    courseId: "design-construction",
    courseLabel: "Design & Construction Course",
    edition: "15–19 Jun 2026",
    status: "Confirmed",
    email: "s.inamdar@bharatforge.com",
  },
  {
    id: "train-5",
    name: "Eduard Gómez",
    organisation: "Venturi Aeronautical",
    country: "Spain",
    courseId: "design-construction",
    courseLabel: "Design & Construction Course",
    edition: "15–19 Jun 2026",
    status: "Confirmed",
    email: "e.gomez@venturi.aero",
  },
  {
    id: "train-6",
    name: "Felipe Balazs",
    organisation: "Independent Operator",
    country: "Chile",
    courseId: "integrated-pilot",
    courseLabel: "Integrated Drone Pilot Training (STS-01 & STS-02)",
    edition: "22–26 Jun 2026",
    status: "Waitlisted",
    email: "f.balazs@outlook.cl",
  },
  {
    id: "train-7",
    name: "Milton Nodier García Juliao",
    organisation: "Smithsonian Tropical Research Inst.",
    country: "Panama",
    courseId: "geo-zones",
    courseLabel: "Geographical Zones & Airspace Restrictions",
    edition: "On demand — Jul 2026",
    status: "Confirmed",
    email: "m.garcia@stri.org",
  },
  {
    id: "train-8",
    name: "Sergio Fernández Roza",
    organisation: "Freelance UAS Operator",
    country: "Spain",
    courseId: "radiophonist",
    courseLabel: "UAS Radiophonist Course",
    edition: "On demand — Jul 2026",
    status: "Confirmed",
    email: "s.fernandez@uas.es",
  },
  {
    id: "train-9",
    name: "Máté Gajdos",
    organisation: "Hungarian University of Public Service",
    country: "Hungary",
    courseId: "operational-authorisation",
    courseLabel: "Operational Authorisation (Specific Category)",
    edition: "On demand — Jul 2026",
    status: "In Progress",
    email: "m.gajdos@uni-nke.hu",
  },
  {
    id: "train-10",
    name: "Fernando Jimenez",
    organisation: "OMD Colombia",
    country: "Colombia",
    courseId: "customized",
    courseLabel: "Customized Course",
    edition: "On demand — Aug 2026",
    status: "Confirmed",
    email: "f.jimenez@omd.co",
  },
];

export function trainingStatusClass(status: BcdTrainingClient["status"]) {
  switch (status) {
    case "Confirmed":
      return "border-emerald-400/40 bg-emerald-500/15 text-emerald-300";
    case "Waitlisted":
      return "border-amber-400/40 bg-amber-500/15 text-amber-200";
    case "In Progress":
      return "border-sky-400/40 bg-sky-500/15 text-sky-300";
    case "Completed":
      return "border-white/20 bg-white/10 text-white/60";
  }
}

export function getCourseTile(id: BcdCourseId) {
  return BCD_COURSE_TILES.find((course) => course.id === id);
}
