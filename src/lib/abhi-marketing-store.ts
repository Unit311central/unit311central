/**
 * ABHI-only client mock store for Marketing & Events.
 * Future: swap selectors/mutations for GET/POST /api/abhi/marketing/... endpoints.
 */

type Listener = () => void;

export type AbhiMemberCompany = {
  id: string;
  companyName: string;
  contactEmail: string;
};

export type AbhiEvent = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  year: number;
  city: string;
  country: string;
  website: string;
  memberIds: string[];
  notes: string;
  /** ABHI staff member responsible for delivery. */
  ownerId: string;
  ownerName: string;
  calendarSynced: boolean;
  createdAt: string;
};

/** Staff options for External Events ownership. */
export const ABHI_EVENT_OWNERS = [
  { id: "abhi-emp-michelle-michelucci", name: "Michelle Michelucci" },
  { id: "abhi-emp-paul-benton", name: "Paul Benton" },
  { id: "abhi-emp-bayode-adisa", name: "Bayode Adisa" },
  { id: "abhi-emp-jane-lewis", name: "Jane Lewis" },
  { id: "abhi-emp-lauren-hayes", name: "Lauren Hayes" },
  { id: "abhi-emp-sophie-green", name: "Sophie Green" },
  { id: "abhi-emp-jonathan-evans", name: "Jonathan Evans" },
  { id: "abhi-emp-charlotte-hart", name: "Charlotte Hart" },
] as const;

export type AbhiNewsletterStatus = "draft" | "scheduled" | "sent";
export type AbhiRecipientMode = "all" | "selected" | "manual";

export type AbhiNewsletterChannels = {
  email: boolean;
  linkedin: boolean;
  twitter: boolean;
};

export type AbhiNewsletterMetrics = {
  openRate: number;
  clickRate: number;
  responseRate: number;
  clientsAcquired: number;
};

export type AbhiNewsletter = {
  id: string;
  title: string;
  subject: string;
  htmlBody: string;
  status: AbhiNewsletterStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  recipientMode: AbhiRecipientMode;
  recipientMemberIds: string[];
  manualEmails: string[];
  channels: AbhiNewsletterChannels;
  imageDataUrls: string[];
  metrics: AbhiNewsletterMetrics;
  createdAt: string;
  updatedAt: string;
};

export type AbhiMailingCampaign = {
  id: string;
  subject: string;
  body: string;
  status: AbhiNewsletterStatus;
  recipientMode: AbhiRecipientMode;
  recipientMemberIds: string[];
  manualEmails: string[];
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
};

export type AbhiWorkingGroupPerson = {
  id: string;
  name: string;
  company: string;
  email: string;
  role: string;
};

export type AbhiWorkingGroupMeeting = {
  id: string;
  title: string;
  scheduledDate: string;
  scheduledTime: string;
  location: string;
  agenda: string;
  attendeePersonIds: string[];
  notes: string;
};

export type AbhiWorkingGroup = {
  id: string;
  name: string;
  description: string;
  lead: string;
  meetingCadence: string;
  people: AbhiWorkingGroupPerson[];
  meetings: AbhiWorkingGroupMeeting[];
};

export type AbhiAcceleratorRegion = "us" | "me";
export type AbhiAcceleratorStatus = "recruiting" | "active" | "completed";
export type AbhiAcceleratorVisitType = "company" | "hospital" | "health-system";

export type AbhiAcceleratorScheduleItem = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  notes: string;
};

export type AbhiAcceleratorVisitTarget = {
  id: string;
  name: string;
  type: AbhiAcceleratorVisitType;
  location: string;
  focus: string;
  confirmed: boolean;
};

export type AbhiAcceleratorCohort = {
  id: string;
  region: AbhiAcceleratorRegion;
  cohortName: string;
  location: string;
  startYear: number;
  status: AbhiAcceleratorStatus;
  /** ABHI programme lead for the cohort. */
  programmeLead: string;
  /** Extra delivery / market notes. */
  notes: string;
  /** Editable cohort plan summary. */
  cohortPlan: string;
  schedule: AbhiAcceleratorScheduleItem[];
  visitTargets: AbhiAcceleratorVisitTarget[];
  companyIds: string[];
};

type AbhiMarketingState = {
  members: AbhiMemberCompany[];
  events: AbhiEvent[];
  newsletters: AbhiNewsletter[];
  mailingCampaigns: AbhiMailingCampaign[];
  workingGroups: AbhiWorkingGroup[];
  acceleratorCohorts: AbhiAcceleratorCohort[];
};

function uid(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function daysAgoIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function daysFromNowDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function seedMembers(): AbhiMemberCompany[] {
  return [
    { id: "abhi-mem-1", companyName: "Corvus Health Systems", contactEmail: "partnerships@corvushealth.co.uk" },
    { id: "abhi-mem-2", companyName: "Meridian Diagnostics Ltd", contactEmail: "info@meridiandiagnostics.com" },
    { id: "abhi-mem-3", companyName: "Vireo Medical Devices", contactEmail: "hello@vireomedical.com" },
    { id: "abhi-mem-4", companyName: "Northstar Telehealth", contactEmail: "partnerships@northstartelehealth.io" },
    { id: "abhi-mem-5", companyName: "Elysium Digital Health", contactEmail: "contact@elysiumdigitalhealth.com" },
    { id: "abhi-mem-6", companyName: "Pulsewave Robotics", contactEmail: "team@pulsewaverobotics.com" },
    { id: "abhi-mem-7", companyName: "Sentinel Genomics", contactEmail: "members@sentinelgenomics.co.uk" },
    { id: "abhi-mem-8", companyName: "Aurora Care Technologies", contactEmail: "hello@auroracaretech.com" },
    { id: "abhi-mem-9", companyName: "Beacon Surgical Innovations", contactEmail: "info@beaconsurgical.com" },
    { id: "abhi-mem-10", companyName: "Halcyon Health Analytics", contactEmail: "contact@halcyonhealth.ai" },
    { id: "abhi-mem-11", companyName: "Iris Imaging Solutions", contactEmail: "sales@irisimaging.co.uk" },
    { id: "abhi-mem-12", companyName: "Zenith Biotech Partners", contactEmail: "info@zenithbiotech.com" },
  ];
}

function seedEvents(memberIds: string[]): AbhiEvent[] {
  const pick = (...idx: number[]) => idx.map((i) => memberIds[i]).filter(Boolean) as string[];
  const owner = (id: (typeof ABHI_EVENT_OWNERS)[number]["id"]) => {
    const row = ABHI_EVENT_OWNERS.find((item) => item.id === id)!;
    return { ownerId: row.id, ownerName: row.name };
  };
  return [
    {
      id: "abhi-evt-whx-jhb-2026",
      name: "WHX Johannesburg 2026",
      startDate: "2026-10-06",
      endDate: "2026-10-08",
      year: 2026,
      city: "Johannesburg",
      country: "South Africa",
      website: "https://whxjohannesburg.com",
      memberIds: pick(0, 3, 7),
      notes: "ABHI-led UK pavilion — African market access focus.",
      ...owner("abhi-emp-michelle-michelucci"),
      calendarSynced: true,
      createdAt: daysAgoIso(120),
    },
    {
      id: "abhi-evt-ghe-riyadh-2026",
      name: "Global Health Exhibition 2026",
      startDate: "2026-10-26",
      endDate: "2026-10-29",
      year: 2026,
      city: "Riyadh",
      country: "Saudi Arabia",
      website: "https://globalhealthexhibition.com",
      memberIds: pick(1, 6, 9, 10),
      notes: "Largest healthcare exhibition in the MENA region — Vision 2030 alignment.",
      ...owner("abhi-emp-bayode-adisa"),
      calendarSynced: true,
      createdAt: daysAgoIso(110),
    },
    {
      id: "abhi-evt-whx-dubai-2027",
      name: "WHX Dubai 2027",
      startDate: "2027-01-25",
      endDate: "2027-01-28",
      year: 2027,
      city: "Dubai",
      country: "UAE",
      website: "https://whxdubai.com",
      memberIds: pick(2, 4, 8),
      notes: "Flagship Middle East congress — co-located with WHX Tech.",
      ...owner("abhi-emp-michelle-michelucci"),
      calendarSynced: true,
      createdAt: daysAgoIso(95),
    },
    {
      id: "abhi-evt-whx-tech-2027",
      name: "WHX Tech 2027",
      startDate: "2027-01-27",
      endDate: "2027-01-29",
      year: 2027,
      city: "Dubai",
      country: "UAE",
      website: "https://whxtech.com",
      memberIds: pick(5, 9),
      notes: "Digital health and health-tech innovation track.",
      ...owner("abhi-emp-lauren-hayes"),
      calendarSynced: false,
      createdAt: daysAgoIso(90),
    },
    {
      id: "abhi-evt-hospitalar-2027",
      name: "Hospitalar 2027",
      startDate: "2027-05-18",
      endDate: "2027-05-21",
      year: 2027,
      city: "Sao Paulo",
      country: "Brazil",
      website: "https://hospitalar.com",
      memberIds: pick(2, 6),
      notes: "Latin America's largest healthcare trade show.",
      ...owner("abhi-emp-michelle-michelucci"),
      calendarSynced: false,
      createdAt: daysAgoIso(60),
    },
    {
      id: "abhi-evt-whx-lagos-2027",
      name: "WHX Lagos 2027",
      startDate: "2027-06-01",
      endDate: "2027-06-03",
      year: 2027,
      city: "Lagos",
      country: "Nigeria",
      website: "https://whxlagos.com",
      memberIds: pick(0, 7, 11),
      notes: "West Africa market entry showcase.",
      ...owner("abhi-emp-paul-benton"),
      calendarSynced: false,
      createdAt: daysAgoIso(45),
    },
    {
      id: "abhi-evt-hlth-europe-2027",
      name: "HLTH Europe 2027",
      startDate: "2027-06-21",
      endDate: "2027-06-24",
      year: 2027,
      city: "Amsterdam",
      country: "Netherlands",
      website: "https://hlth.com/europe",
      memberIds: pick(3, 4, 5, 10),
      notes: "Pan-European health innovation summit.",
      ...owner("abhi-emp-jane-lewis"),
      calendarSynced: true,
      createdAt: daysAgoIso(30),
    },
    {
      id: "abhi-evt-whx-miami-2027",
      name: "WHX Miami 2027",
      startDate: "2027-06-15",
      endDate: "2027-06-17",
      year: 2027,
      city: "Miami",
      country: "USA",
      website: "https://whxmiami.com",
      memberIds: pick(1, 8, 11),
      notes: "US gateway congress — LatAm and North America crossover.",
      ...owner("abhi-emp-sophie-green"),
      calendarSynced: false,
      createdAt: daysAgoIso(20),
    },
  ];
}

function seedNewsletters(memberIds: string[]): AbhiNewsletter[] {
  return [
    {
      id: "abhi-news-1",
      title: "ABHI Digital Health Bulletin — May 2026",
      subject: "Digital Health Bulletin: NHS adoption pathways update",
      htmlBody:
        "<p>This month we cover the latest NHS digital adoption pathways, member wins across remote monitoring, and upcoming ABHI events.</p><ul><li>MHRA software guidance update</li><li>Member spotlight: Northstar Telehealth</li><li>WHX Dubai 2027 — early registration</li></ul>",
      status: "sent",
      scheduledAt: null,
      sentAt: daysAgoIso(80),
      recipientMode: "all",
      recipientMemberIds: [],
      manualEmails: [],
      channels: { email: true, linkedin: true, twitter: true },
      imageDataUrls: [],
      metrics: { openRate: 42, clickRate: 11, responseRate: 6, clientsAcquired: 3 },
      createdAt: daysAgoIso(84),
      updatedAt: daysAgoIso(80),
    },
    {
      id: "abhi-news-2",
      title: "Member Spotlight: Q2 2026 Growth Report",
      subject: "Q2 2026 growth report — 350 members and counting",
      htmlBody:
        "<p>ABHI membership crossed 350 companies this quarter. Read how our Working Groups are shaping regulatory affairs, market access, and sustainability across UK HealthTech.</p>",
      status: "sent",
      scheduledAt: null,
      sentAt: daysAgoIso(50),
      recipientMode: "all",
      recipientMemberIds: [],
      manualEmails: [],
      channels: { email: true, linkedin: true, twitter: false },
      imageDataUrls: [],
      metrics: { openRate: 38, clickRate: 9, responseRate: 5, clientsAcquired: 2 },
      createdAt: daysAgoIso(54),
      updatedAt: daysAgoIso(50),
    },
    {
      id: "abhi-news-3",
      title: "WHX Dubai 2027 — Early Bird Registration Open",
      subject: "Secure your stand at WHX Dubai 2027",
      htmlBody:
        "<p>Early bird registration is now open for WHX Dubai 2027. ABHI members save 15% on pavilion packages — book before 30 September.</p>",
      status: "sent",
      scheduledAt: null,
      sentAt: daysAgoIso(18),
      recipientMode: "selected",
      recipientMemberIds: memberIds.slice(0, 6),
      manualEmails: [],
      channels: { email: true, linkedin: true, twitter: true },
      imageDataUrls: [],
      metrics: { openRate: 51, clickRate: 17, responseRate: 9, clientsAcquired: 5 },
      createdAt: daysAgoIso(21),
      updatedAt: daysAgoIso(18),
    },
    {
      id: "abhi-news-draft-1",
      title: "Global Health Exhibition 2026 — Delegation Recap",
      subject: "Thank you for joining the ABHI delegation in Riyadh",
      htmlBody: "<p>Draft recap of the ABHI delegation at Global Health Exhibition 2026 in Riyadh…</p>",
      status: "draft",
      scheduledAt: null,
      sentAt: null,
      recipientMode: "all",
      recipientMemberIds: [],
      manualEmails: [],
      channels: { email: true, linkedin: false, twitter: false },
      imageDataUrls: [],
      metrics: { openRate: 0, clickRate: 0, responseRate: 0, clientsAcquired: 0 },
      createdAt: daysAgoIso(3),
      updatedAt: daysAgoIso(1),
    },
  ];
}

function seedMailingCampaigns(memberIds: string[]): AbhiMailingCampaign[] {
  return [
    {
      id: "abhi-mail-1",
      subject: "Reminder: ABHI Working Group nominations close Friday",
      body: "Nominations for the 2026/27 ABHI Working Groups close this Friday. Reply to confirm your representative.",
      status: "sent",
      recipientMode: "all",
      recipientMemberIds: [],
      manualEmails: [],
      scheduledAt: null,
      sentAt: daysAgoIso(35),
      createdAt: daysAgoIso(36),
    },
    {
      id: "abhi-mail-2",
      subject: "Invitation: ABHI Middle East Accelerator info session",
      body: "Join our info session on the ABHI Middle East Accelerator — Dubai and Riyadh cohorts now open for applications.",
      status: "sent",
      recipientMode: "selected",
      recipientMemberIds: memberIds.slice(2, 8),
      manualEmails: ["accelerator-lead@partner.example"],
      scheduledAt: null,
      sentAt: daysAgoIso(12),
      createdAt: daysAgoIso(14),
    },
    {
      id: "abhi-mail-draft-1",
      subject: "Draft: WHX Lagos 2027 — call for pavilion partners",
      body: "Draft outreach to member companies interested in the WHX Lagos 2027 UK pavilion.",
      status: "draft",
      recipientMode: "manual",
      recipientMemberIds: [],
      manualEmails: [],
      scheduledAt: null,
      sentAt: null,
      createdAt: daysAgoIso(2),
    },
  ];
}

function seedWorkingGroups(_memberIds: string[]): AbhiWorkingGroup[] {
  const person = (
    id: string,
    name: string,
    company: string,
    email: string,
    role = "Member",
  ): AbhiWorkingGroupPerson => ({ id, name, company, email, role });

  const meeting = (
    id: string,
    title: string,
    daysAhead: number,
    time: string,
    location: string,
    agenda: string,
    attendeeIds: string[] = [],
    notes = "",
  ): AbhiWorkingGroupMeeting => ({
    id,
    title,
    scheduledDate: daysFromNowDate(daysAhead),
    scheduledTime: time,
    location,
    agenda,
    attendeePersonIds: attendeeIds,
    notes,
  });

  return [
    {
      id: "abhi-wg-regulatory",
      name: "Regulatory Affairs",
      description: "Tracks MHRA, UKCA, and international regulatory developments affecting members.",
      lead: "Judith Mellis",
      meetingCadence: "Monthly — first Tuesday",
      people: [
        person("abhi-wgp-reg-1", "Judith Mellis", "ABHI", "judith.mellis@abhi.org.uk", "Lead"),
        person("abhi-wgp-reg-2", "Sarah Chen", "Aether Diagnostics", "sarah.chen@aetherdx.com"),
        person("abhi-wgp-reg-3", "Tom Bradley", "Northstar Telehealth", "tom.bradley@northstar.health"),
        person("abhi-wgp-reg-4", "Priya Shah", "Halcyon Health Analytics", "priya.shah@halcyonhealth.ai"),
      ],
      meetings: [
        meeting(
          "abhi-wgm-reg-1",
          "MHRA software as medical device update",
          7,
          "10:00",
          "Microsoft Teams",
          "Review MHRA SaMD consultation responses and member impact summary.",
          ["abhi-wgp-reg-1", "abhi-wgp-reg-2"],
        ),
        meeting(
          "abhi-wgm-reg-2",
          "UKCA transition checkpoint",
          35,
          "10:00",
          "ABHI London office",
          "Member readiness survey results and Q3 regulatory horizon scan.",
          [],
        ),
        meeting(
          "abhi-wgm-reg-3",
          "International equivalence pathways",
          63,
          "14:00",
          "Microsoft Teams",
          "US FDA / EU MDR alignment briefing with member Q&A.",
          ["abhi-wgp-reg-1"],
        ),
      ],
    },
    {
      id: "abhi-wg-digital-health",
      name: "Digital Health",
      description: "Shapes ABHI positions on NHS digital adoption, AI in health, and interoperability.",
      lead: "Rebecca Parkin",
      meetingCadence: "Bi-weekly",
      people: [
        person("abhi-wgp-dh-1", "Rebecca Parkin", "ABHI", "rebecca.parkin@abhi.org.uk", "Lead"),
        person("abhi-wgp-dh-2", "James Okonkwo", "Pulseware Systems", "james@pulseware.co.uk"),
        person("abhi-wgp-dh-3", "Elena Rossi", "Iris Imaging Solutions", "elena.rossi@irisimaging.co.uk"),
        person("abhi-wgp-dh-4", "Marcus Webb", "Zenith Biotech Partners", "marcus.webb@zenithbiotech.com"),
      ],
      meetings: [
        meeting(
          "abhi-wgm-dh-1",
          "NHS Federated Data Platform — member briefing",
          5,
          "11:00",
          "Microsoft Teams",
          "Guest speaker from NHS England on FDP procurement and interoperability standards.",
          ["abhi-wgp-dh-1", "abhi-wgp-dh-3"],
        ),
        meeting(
          "abhi-wgm-dh-2",
          "AI assurance framework workshop",
          19,
          "11:00",
          "Microsoft Teams",
          "Draft ABHI position on responsible AI deployment in clinical settings.",
          [],
        ),
        meeting(
          "abhi-wgm-dh-3",
          "Digital adoption playbook review",
          33,
          "11:00",
          "ABHI London office",
          "Finalise member-facing playbook chapter on remote monitoring.",
          ["abhi-wgp-dh-1", "abhi-wgp-dh-2", "abhi-wgp-dh-4"],
        ),
      ],
    },
    {
      id: "abhi-wg-market-access",
      name: "Market Access",
      description: "Supports members navigating NICE, procurement frameworks, and NHS commercial routes.",
      lead: "Owain Prescott",
      meetingCadence: "Monthly — third Wednesday",
      people: [
        person("abhi-wgp-ma-1", "Owain Prescott", "ABHI", "owain.prescott@abhi.org.uk", "Lead"),
        person("abhi-wgp-ma-2", "Hannah Cole", "Lumina Med Devices", "hannah.cole@luminamed.com"),
        person("abhi-wgp-ma-3", "David Kwon", "ClearPath Orthopaedics", "david.kwon@clearpathortho.com"),
        person("abhi-wgp-ma-4", "Amelia Frost", "Vitaflow Therapeutics", "amelia.frost@vitaflow.co.uk"),
      ],
      meetings: [
        meeting(
          "abhi-wgm-ma-1",
          "NICE early value assessment update",
          12,
          "15:00",
          "Microsoft Teams",
          "Impact of updated EVA guidance on diagnostics and digital therapeutics.",
          ["abhi-wgp-ma-1", "abhi-wgp-ma-2"],
        ),
        meeting(
          "abhi-wgm-ma-2",
          "NHS Supply Chain framework changes",
          40,
          "15:00",
          "Microsoft Teams",
          "Member feedback on new med-tech framework lots and submission timelines.",
          [],
        ),
        meeting(
          "abhi-wgm-ma-3",
          "Integrated care board engagement",
          68,
          "15:00",
          "ABHI London office",
          "Best practice sharing on ICB commercial discussions.",
          ["abhi-wgp-ma-1"],
        ),
      ],
    },
    {
      id: "abhi-wg-sustainability",
      name: "Sustainability",
      description: "Develops guidance on net-zero supply chains and sustainable HealthTech manufacturing.",
      lead: "Addie Macgregor",
      meetingCadence: "Quarterly",
      people: [
        person("abhi-wgp-sus-1", "Addie Macgregor", "ABHI", "addie.macgregor@abhi.org.uk", "Lead"),
        person("abhi-wgp-sus-2", "Nina Patel", "GreenMed Manufacturing", "nina.patel@greenmed.co.uk"),
        person("abhi-wgp-sus-3", "Chris Doyle", "Orbit Surgical", "chris.doyle@orbitsurgical.com"),
      ],
      meetings: [
        meeting(
          "abhi-wgm-sus-1",
          "Scope 3 emissions baseline review",
          21,
          "09:30",
          "Microsoft Teams",
          "Member survey results and draft net-zero roadmap milestones.",
          ["abhi-wgp-sus-1", "abhi-wgp-sus-2"],
        ),
        meeting(
          "abhi-wgm-sus-2",
          "Circular economy in med-tech manufacturing",
          55,
          "09:30",
          "ABHI London office",
          "Case studies from members on reusable device programmes.",
          [],
        ),
        meeting(
          "abhi-wgm-sus-3",
          "NHS Greener NHS alignment session",
          84,
          "09:30",
          "Microsoft Teams",
          "Mapping ABHI sustainability guidance to Greener NHS supplier requirements.",
          ["abhi-wgp-sus-1"],
        ),
      ],
    },
  ];
}

function seedAccelerators(memberIds: string[]): AbhiAcceleratorCohort[] {
  const pick = (...idx: number[]) => idx.map((i) => memberIds[i]).filter(Boolean) as string[];
  const scheduleItem = (
    id: string,
    label: string,
    startDays: number,
    endDays: number,
    notes: string,
  ): AbhiAcceleratorScheduleItem => ({
    id,
    label,
    startDate: daysFromNowDate(startDays),
    endDate: daysFromNowDate(endDays),
    notes,
  });
  const visit = (
    id: string,
    name: string,
    type: AbhiAcceleratorVisitType,
    location: string,
    focus: string,
    confirmed: boolean,
  ): AbhiAcceleratorVisitTarget => ({ id, name, type, location, focus, confirmed });

  return [
    {
      id: "abhi-acc-us-boston-2026",
      region: "us",
      cohortName: "ABHI US Accelerator — Boston Cohort 4",
      location: "Boston, USA",
      startYear: 2026,
      status: "active",
      programmeLead: "Michelle Michelucci",
      notes: "FDA pathway clinics, payer introductions, and East Coast hospital network meetings.",
      cohortPlan:
        "Two-week immersion in Boston's health innovation corridor. Week 1 focuses on regulatory and reimbursement pathways; Week 2 on hospital pilot discussions and investor readiness.",
      schedule: [
        scheduleItem(
          "abhi-acc-us-bos-s1",
          "Cohort kick-off & FDA clinic",
          14,
          16,
          "Welcome dinner, FDA Digital Health Center briefing, and member pitch rehearsals.",
        ),
        scheduleItem(
          "abhi-acc-us-bos-s2",
          "Hospital innovation tours",
          17,
          19,
          "Site visits to Mass General Brigham and Partners Health innovation labs.",
        ),
        scheduleItem(
          "abhi-acc-us-bos-s3",
          "Payer & investor showcase",
          20,
          21,
          "Closed-door sessions with US payers and East Coast HealthTech VCs.",
        ),
      ],
      visitTargets: [
        visit(
          "abhi-acc-us-bos-v1",
          "Massachusetts General Hospital",
          "hospital",
          "Boston, MA",
          "Digital surgery and perioperative monitoring pilots",
          true,
        ),
        visit(
          "abhi-acc-us-bos-v2",
          "Brigham and Women's Hospital",
          "hospital",
          "Boston, MA",
          "Remote patient monitoring and care-at-home programmes",
          true,
        ),
        visit(
          "abhi-acc-us-bos-v3",
          "Philips HealthTech Innovation Hub",
          "company",
          "Cambridge, MA",
          "Interoperability and connected care partnerships",
          true,
        ),
        visit(
          "abhi-acc-us-bos-v4",
          "CVS Health Innovation Lab",
          "company",
          "Woonsocket, RI",
          "Retail health and pharmacy-led diagnostics",
          false,
        ),
        visit(
          "abhi-acc-us-bos-v5",
          "FDA Digital Health Center of Excellence",
          "health-system",
          "Silver Spring, MD",
          "SaMD pre-submission and Q-Sub pathway briefing",
          true,
        ),
      ],
      companyIds: pick(0, 2, 5, 8),
    },
    {
      id: "abhi-acc-us-sf-2027",
      region: "us",
      cohortName: "ABHI US Accelerator — San Francisco Cohort 5",
      location: "San Francisco, USA",
      startYear: 2027,
      status: "recruiting",
      programmeLead: "Paul Benton",
      notes: "Digital health and AI focus — Bay Area investor and health-system immersion.",
      cohortPlan:
        "Bay Area programme blending UCSF Health partnerships, AI assurance workshops, and Silicon Valley investor office hours for UK HealthTech scale-ups.",
      schedule: [
        scheduleItem(
          "abhi-acc-us-sf-s1",
          "AI in health assurance workshop",
          45,
          46,
          "Responsible AI deployment frameworks with UCSF digital health faculty.",
        ),
        scheduleItem(
          "abhi-acc-us-sf-s2",
          "Health system immersion week",
          47,
          51,
          "UCSF, Stanford Health, and Kaiser Permanente innovation introductions.",
        ),
        scheduleItem(
          "abhi-acc-us-sf-s3",
          "Investor demo day",
          52,
          52,
          "Pitch sessions with Bay Area HealthTech VCs and strategic corporates.",
        ),
      ],
      visitTargets: [
        visit(
          "abhi-acc-us-sf-v1",
          "UCSF Health Hub for Digital Health Innovation",
          "health-system",
          "San Francisco, CA",
          "Clinical AI validation and digital therapeutics pilots",
          false,
        ),
        visit(
          "abhi-acc-us-sf-v2",
          "Stanford Health Care",
          "hospital",
          "Palo Alto, CA",
          "Precision medicine and genomics-enabled diagnostics",
          false,
        ),
        visit(
          "abhi-acc-us-sf-v3",
          "Kaiser Permanente Innovation Center",
          "health-system",
          "Oakland, CA",
          "Population health analytics and remote monitoring at scale",
          false,
        ),
        visit(
          "abhi-acc-us-sf-v4",
          "Verily Life Sciences",
          "company",
          "South San Francisco, CA",
          "Real-world evidence and connected device partnerships",
          false,
        ),
        visit(
          "abhi-acc-us-sf-v5",
          "Rock Health",
          "company",
          "San Francisco, CA",
          "US market entry strategy and fundraising readiness",
          true,
        ),
      ],
      companyIds: pick(4, 10),
    },
    {
      id: "abhi-acc-me-dubai-2026",
      region: "me",
      cohortName: "ABHI Middle East Accelerator — Dubai Cohort 2",
      location: "Dubai, UAE",
      startYear: 2026,
      status: "active",
      programmeLead: "Bayode Adisa",
      notes: "DHA and private provider introductions; co-located with WHX Dubai engagement.",
      cohortPlan:
        "Dubai immersion aligned with DHA digital health strategy. Members receive regulatory briefings, private hospital introductions, and WHX Dubai pavilion preparation support.",
      schedule: [
        scheduleItem(
          "abhi-acc-me-dxb-s1",
          "DHA regulatory & licensing briefing",
          10,
          10,
          "Dubai Health Authority digital health licensing and SaMD requirements.",
        ),
        scheduleItem(
          "abhi-acc-me-dxb-s2",
          "Private hospital roadshow",
          11,
          14,
          "Site visits across Mediclinic, Saudi German, and American Hospital Dubai.",
        ),
        scheduleItem(
          "abhi-acc-me-dxb-s3",
          "WHX Dubai pavilion prep",
          15,
          16,
          "Stand design, buyer meetings, and Gulf distributor matchmaking.",
        ),
      ],
      visitTargets: [
        visit(
          "abhi-acc-me-dxb-v1",
          "Dubai Health Authority (DHA)",
          "health-system",
          "Dubai, UAE",
          "Digital health licensing and NABIDH integration",
          true,
        ),
        visit(
          "abhi-acc-me-dxb-v2",
          "Mediclinic City Hospital",
          "hospital",
          "Dubai, UAE",
          "Robotic surgery and perioperative digital workflows",
          true,
        ),
        visit(
          "abhi-acc-me-dxb-v3",
          "Saudi German Hospital Dubai",
          "hospital",
          "Dubai, UAE",
          "Telehealth and remote diagnostics deployment",
          true,
        ),
        visit(
          "abhi-acc-me-dxb-v4",
          "G42 Healthcare",
          "company",
          "Abu Dhabi, UAE",
          "AI-enabled diagnostics and population screening",
          false,
        ),
        visit(
          "abhi-acc-me-dxb-v5",
          "M42 / Cleveland Clinic Abu Dhabi",
          "health-system",
          "Abu Dhabi, UAE",
          "Precision medicine and advanced imaging partnerships",
          true,
        ),
      ],
      companyIds: pick(1, 3, 9, 11),
    },
    {
      id: "abhi-acc-me-riyadh-2027",
      region: "me",
      cohortName: "ABHI Middle East Accelerator — Riyadh Cohort 3",
      location: "Riyadh, Saudi Arabia",
      startYear: 2027,
      status: "recruiting",
      programmeLead: "Jane Lewis",
      notes: "Vision 2030 health transformation partnerships and MOH pathway workshops.",
      cohortPlan:
        "Riyadh programme focused on Vision 2030 health transformation. MOH engagement, SEHA cluster introductions, and Global Health Exhibition follow-on meetings.",
      schedule: [
        scheduleItem(
          "abhi-acc-me-ruh-s1",
          "MOH digital transformation briefing",
          60,
          60,
          "Ministry of Health procurement pathways and local content requirements.",
        ),
        scheduleItem(
          "abhi-acc-me-ruh-s2",
          "SEHA cluster hospital visits",
          61,
          64,
          "King Faisal Specialist Hospital and King Saud Medical City introductions.",
        ),
        scheduleItem(
          "abhi-acc-me-ruh-s3",
          "Vision 2030 partner showcase",
          65,
          66,
          "Closed sessions with NEOM Health and Saudi German Hospital Group.",
        ),
      ],
      visitTargets: [
        visit(
          "abhi-acc-me-ruh-v1",
          "Ministry of Health (Saudi Arabia)",
          "health-system",
          "Riyadh, Saudi Arabia",
          "National digital health platform and procurement frameworks",
          false,
        ),
        visit(
          "abhi-acc-me-ruh-v2",
          "King Faisal Specialist Hospital",
          "hospital",
          "Riyadh, Saudi Arabia",
          "Oncology diagnostics and precision therapeutics",
          false,
        ),
        visit(
          "abhi-acc-me-ruh-v3",
          "King Saud Medical City",
          "hospital",
          "Riyadh, Saudi Arabia",
          "Emergency care digital triage and connected devices",
          false,
        ),
        visit(
          "abhi-acc-me-ruh-v4",
          "NEOM Health",
          "health-system",
          "NEOM, Saudi Arabia",
          "Greenfield health system technology adoption",
          false,
        ),
        visit(
          "abhi-acc-me-ruh-v5",
          "Saudi German Hospitals Group",
          "hospital",
          "Riyadh, Saudi Arabia",
          "Private sector expansion and UK supplier partnerships",
          true,
        ),
      ],
      companyIds: pick(6, 7),
    },
  ];
}

function seedState(): AbhiMarketingState {
  const members = seedMembers();
  const memberIds = members.map((m) => m.id);
  return {
    members,
    events: seedEvents(memberIds),
    newsletters: seedNewsletters(memberIds),
    mailingCampaigns: seedMailingCampaigns(memberIds),
    workingGroups: seedWorkingGroups(memberIds),
    acceleratorCohorts: seedAccelerators(memberIds),
  };
}

let state: AbhiMarketingState = seedState();
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeAbhiMarketingStore(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAbhiMarketingSnapshot(): AbhiMarketingState {
  return state;
}

export function resetAbhiMarketingStore() {
  state = seedState();
  emit();
}

/** Re-seed events when the store is empty (demo / first load). */
export function ensureAbhiMarketingEventsSeeded() {
  if (state.events.length > 0) return;
  state = {
    ...state,
    events: seedEvents(state.members.map((member) => member.id)),
  };
  emit();
}

/* —— Members —— */

export function listMembers() {
  return state.members;
}

export function addMember(input: { companyName: string; contactEmail: string }) {
  const member: AbhiMemberCompany = {
    id: uid("abhi-mem"),
    companyName: input.companyName.trim(),
    contactEmail: input.contactEmail.trim(),
  };
  state = { ...state, members: [member, ...state.members] };
  emit();
  return member;
}

export function updateMember(
  id: string,
  input: Partial<Pick<AbhiMemberCompany, "companyName" | "contactEmail">>,
) {
  const existing = state.members.find((row) => row.id === id);
  if (!existing) return null;
  const next: AbhiMemberCompany = {
    ...existing,
    companyName: input.companyName?.trim() || existing.companyName,
    contactEmail: input.contactEmail?.trim() || existing.contactEmail,
  };
  state = {
    ...state,
    members: state.members.map((row) => (row.id === id ? next : row)),
  };
  emit();
  return next;
}

export function deleteMember(id: string) {
  state = {
    ...state,
    members: state.members.filter((row) => row.id !== id),
    events: state.events.map((row) => ({
      ...row,
      memberIds: row.memberIds.filter((memberId) => memberId !== id),
    })),
    mailingCampaigns: state.mailingCampaigns.map((row) => ({
      ...row,
      recipientMemberIds: row.recipientMemberIds.filter((memberId) => memberId !== id),
    })),
    acceleratorCohorts: state.acceleratorCohorts.map((row) => ({
      ...row,
      companyIds: row.companyIds.filter((companyId) => companyId !== id),
    })),
  };
  emit();
}

/* —— Events —— */

export function listEvents() {
  return state.events;
}

export function upsertEvent(input: Partial<AbhiEvent> & { id?: string }) {
  const existing = input.id ? state.events.find((row) => row.id === input.id) : null;
  const startDate = input.startDate ?? existing?.startDate ?? new Date().toISOString().slice(0, 10);
  const next: AbhiEvent = {
    id: existing?.id ?? uid("abhi-evt"),
    name: input.name ?? existing?.name ?? "New event",
    startDate,
    endDate: input.endDate ?? existing?.endDate ?? startDate,
    year: input.year ?? existing?.year ?? new Date(startDate).getFullYear(),
    city: input.city ?? existing?.city ?? "",
    country: input.country ?? existing?.country ?? "",
    website: input.website ?? existing?.website ?? "",
    memberIds: input.memberIds ?? existing?.memberIds ?? [],
    notes: input.notes ?? existing?.notes ?? "",
    ownerId: input.ownerId ?? existing?.ownerId ?? "",
    ownerName: input.ownerName ?? existing?.ownerName ?? "",
    calendarSynced: input.calendarSynced ?? existing?.calendarSynced ?? false,
    createdAt: existing?.createdAt ?? nowIso(),
  };
  state = {
    ...state,
    events: existing
      ? state.events.map((row) => (row.id === existing.id ? next : row))
      : [next, ...state.events],
  };
  emit();
  return next;
}

export function deleteEvent(id: string) {
  state = { ...state, events: state.events.filter((row) => row.id !== id) };
  emit();
}

export function toggleEventCalendarSync(id: string) {
  state = {
    ...state,
    events: state.events.map((row) =>
      row.id === id ? { ...row, calendarSynced: !row.calendarSynced } : row,
    ),
  };
  emit();
}

export function setEventMembers(id: string, memberIds: string[]) {
  state = {
    ...state,
    events: state.events.map((row) => (row.id === id ? { ...row, memberIds } : row)),
  };
  emit();
}

/* —— Newsletters —— */

export function listNewsletters() {
  return state.newsletters;
}

export function upsertNewsletter(input: Partial<AbhiNewsletter> & { id?: string }) {
  const existing = input.id ? state.newsletters.find((row) => row.id === input.id) : null;
  const next: AbhiNewsletter = {
    id: existing?.id ?? uid("abhi-news"),
    title: input.title ?? existing?.title ?? "Untitled newsletter",
    subject: input.subject ?? existing?.subject ?? "",
    htmlBody: input.htmlBody ?? existing?.htmlBody ?? "",
    status: input.status ?? existing?.status ?? "draft",
    scheduledAt: input.scheduledAt !== undefined ? input.scheduledAt : (existing?.scheduledAt ?? null),
    sentAt: input.sentAt !== undefined ? input.sentAt : (existing?.sentAt ?? null),
    recipientMode: input.recipientMode ?? existing?.recipientMode ?? "all",
    recipientMemberIds: input.recipientMemberIds ?? existing?.recipientMemberIds ?? [],
    manualEmails: input.manualEmails ?? existing?.manualEmails ?? [],
    channels: input.channels ?? existing?.channels ?? { email: true, linkedin: false, twitter: false },
    imageDataUrls: input.imageDataUrls ?? existing?.imageDataUrls ?? [],
    metrics: input.metrics ?? existing?.metrics ?? { openRate: 0, clickRate: 0, responseRate: 0, clientsAcquired: 0 },
    createdAt: existing?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  };
  state = {
    ...state,
    newsletters: existing
      ? state.newsletters.map((row) => (row.id === existing.id ? next : row))
      : [next, ...state.newsletters],
  };
  emit();
  return next;
}

function fakeMetrics(): AbhiNewsletterMetrics {
  return {
    openRate: 32 + Math.round(Math.random() * 22),
    clickRate: 6 + Math.round(Math.random() * 12),
    responseRate: 3 + Math.round(Math.random() * 8),
    clientsAcquired: Math.round(Math.random() * 5),
  };
}

export function sendNewsletterNow(id: string) {
  state = {
    ...state,
    newsletters: state.newsletters.map((row) =>
      row.id === id
        ? { ...row, status: "sent" as const, sentAt: nowIso(), scheduledAt: null, metrics: fakeMetrics(), updatedAt: nowIso() }
        : row,
    ),
  };
  emit();
}

export function scheduleNewsletter(id: string, scheduledAt: string) {
  state = {
    ...state,
    newsletters: state.newsletters.map((row) =>
      row.id === id
        ? { ...row, status: "scheduled" as const, scheduledAt, sentAt: null, updatedAt: nowIso() }
        : row,
    ),
  };
  emit();
}

export function deleteNewsletter(id: string) {
  state = { ...state, newsletters: state.newsletters.filter((row) => row.id !== id) };
  emit();
}

/* —— Mailing list campaigns —— */

export function listMailingCampaigns() {
  return state.mailingCampaigns;
}

export function upsertMailingCampaign(input: Partial<AbhiMailingCampaign> & { id?: string }) {
  const existing = input.id ? state.mailingCampaigns.find((row) => row.id === input.id) : null;
  const next: AbhiMailingCampaign = {
    id: existing?.id ?? uid("abhi-mail"),
    subject: input.subject ?? existing?.subject ?? "Untitled campaign",
    body: input.body ?? existing?.body ?? "",
    status: input.status ?? existing?.status ?? "draft",
    recipientMode: input.recipientMode ?? existing?.recipientMode ?? "all",
    recipientMemberIds: input.recipientMemberIds ?? existing?.recipientMemberIds ?? [],
    manualEmails: input.manualEmails ?? existing?.manualEmails ?? [],
    scheduledAt: input.scheduledAt !== undefined ? input.scheduledAt : (existing?.scheduledAt ?? null),
    sentAt: input.sentAt !== undefined ? input.sentAt : (existing?.sentAt ?? null),
    createdAt: existing?.createdAt ?? nowIso(),
  };
  state = {
    ...state,
    mailingCampaigns: existing
      ? state.mailingCampaigns.map((row) => (row.id === existing.id ? next : row))
      : [next, ...state.mailingCampaigns],
  };
  emit();
  return next;
}

export function sendMailingCampaignNow(id: string) {
  state = {
    ...state,
    mailingCampaigns: state.mailingCampaigns.map((row) =>
      row.id === id ? { ...row, status: "sent" as const, sentAt: nowIso(), scheduledAt: null } : row,
    ),
  };
  emit();
}

export function deleteMailingCampaign(id: string) {
  state = { ...state, mailingCampaigns: state.mailingCampaigns.filter((row) => row.id !== id) };
  emit();
}

/* —— Working groups —— */

export function listWorkingGroups() {
  return state.workingGroups;
}

export function upsertWorkingGroup(input: Partial<AbhiWorkingGroup> & { id?: string }) {
  const existing = input.id ? state.workingGroups.find((row) => row.id === input.id) : null;
  const next: AbhiWorkingGroup = {
    id: existing?.id ?? uid("abhi-wg"),
    name: input.name ?? existing?.name ?? "New working group",
    description: input.description ?? existing?.description ?? "",
    lead: input.lead ?? existing?.lead ?? "",
    meetingCadence: input.meetingCadence ?? existing?.meetingCadence ?? "Monthly",
    people: input.people ?? existing?.people ?? [],
    meetings: input.meetings ?? existing?.meetings ?? [],
  };
  state = {
    ...state,
    workingGroups: existing
      ? state.workingGroups.map((row) => (row.id === existing.id ? next : row))
      : [next, ...state.workingGroups],
  };
  emit();
  return next;
}

export function deleteWorkingGroup(id: string) {
  state = { ...state, workingGroups: state.workingGroups.filter((row) => row.id !== id) };
  emit();
}

export function upsertWorkingGroupPerson(
  groupId: string,
  input: Partial<AbhiWorkingGroupPerson> & { id?: string },
) {
  const group = state.workingGroups.find((row) => row.id === groupId);
  if (!group) return null;
  const existing = input.id ? group.people.find((row) => row.id === input.id) : null;
  const nextPerson: AbhiWorkingGroupPerson = {
    id: existing?.id ?? uid("abhi-wgp"),
    name: input.name ?? existing?.name ?? "New member",
    company: input.company ?? existing?.company ?? "",
    email: input.email ?? existing?.email ?? "",
    role: input.role ?? existing?.role ?? "Member",
  };
  const people = existing
    ? group.people.map((row) => (row.id === existing.id ? nextPerson : row))
    : [...group.people, nextPerson];
  upsertWorkingGroup({ id: groupId, people });
  return nextPerson;
}

export function deleteWorkingGroupPerson(groupId: string, personId: string) {
  const group = state.workingGroups.find((row) => row.id === groupId);
  if (!group) return;
  upsertWorkingGroup({
    id: groupId,
    people: group.people.filter((row) => row.id !== personId),
    meetings: group.meetings.map((meeting) => ({
      ...meeting,
      attendeePersonIds: meeting.attendeePersonIds.filter((id) => id !== personId),
    })),
  });
}

export function updateWorkingGroupMeeting(
  groupId: string,
  meetingId: string,
  input: Partial<Pick<AbhiWorkingGroupMeeting, "attendeePersonIds" | "notes">>,
) {
  const group = state.workingGroups.find((row) => row.id === groupId);
  if (!group) return null;
  const existing = group.meetings.find((row) => row.id === meetingId);
  if (!existing) return null;
  const nextMeeting: AbhiWorkingGroupMeeting = {
    ...existing,
    attendeePersonIds: input.attendeePersonIds ?? existing.attendeePersonIds,
    notes: input.notes !== undefined ? input.notes : existing.notes,
  };
  upsertWorkingGroup({
    id: groupId,
    meetings: group.meetings.map((row) => (row.id === meetingId ? nextMeeting : row)),
  });
  return nextMeeting;
}

export function toggleWorkingGroupMeetingAttendee(
  groupId: string,
  meetingId: string,
  personId: string,
) {
  const group = state.workingGroups.find((row) => row.id === groupId);
  if (!group) return;
  const meeting = group.meetings.find((row) => row.id === meetingId);
  if (!meeting) return;
  const already = meeting.attendeePersonIds.includes(personId);
  updateWorkingGroupMeeting(groupId, meetingId, {
    attendeePersonIds: already
      ? meeting.attendeePersonIds.filter((id) => id !== personId)
      : [...meeting.attendeePersonIds, personId],
  });
}

/* —— Accelerators —— */

export function listAcceleratorCohorts(region: AbhiAcceleratorRegion) {
  return state.acceleratorCohorts.filter((row) => row.region === region);
}

export function upsertAcceleratorCohort(
  input: Partial<AbhiAcceleratorCohort> & { id?: string; region: AbhiAcceleratorRegion },
) {
  const existing = input.id ? state.acceleratorCohorts.find((row) => row.id === input.id) : null;
  const next: AbhiAcceleratorCohort = {
    id: existing?.id ?? uid("abhi-acc"),
    region: input.region,
    cohortName: input.cohortName ?? existing?.cohortName ?? "New cohort",
    location: input.location ?? existing?.location ?? "",
    startYear: input.startYear ?? existing?.startYear ?? new Date().getFullYear(),
    status: input.status ?? existing?.status ?? "recruiting",
    programmeLead: input.programmeLead ?? existing?.programmeLead ?? "",
    notes: input.notes ?? existing?.notes ?? "",
    cohortPlan: input.cohortPlan ?? existing?.cohortPlan ?? "",
    schedule: input.schedule ?? existing?.schedule ?? [],
    visitTargets: input.visitTargets ?? existing?.visitTargets ?? [],
    companyIds: input.companyIds ?? existing?.companyIds ?? [],
  };
  state = {
    ...state,
    acceleratorCohorts: existing
      ? state.acceleratorCohorts.map((row) => (row.id === existing.id ? next : row))
      : [next, ...state.acceleratorCohorts],
  };
  emit();
  return next;
}

export function deleteAcceleratorCohort(id: string) {
  state = { ...state, acceleratorCohorts: state.acceleratorCohorts.filter((row) => row.id !== id) };
  emit();
}

export function toggleAcceleratorCompany(cohortId: string, companyId: string) {
  state = {
    ...state,
    acceleratorCohorts: state.acceleratorCohorts.map((row) => {
      if (row.id !== cohortId) return row;
      const already = row.companyIds.includes(companyId);
      return {
        ...row,
        companyIds: already
          ? row.companyIds.filter((id) => id !== companyId)
          : [...row.companyIds, companyId],
      };
    }),
  };
  emit();
}

export function updateAcceleratorCohortPlan(cohortId: string, cohortPlan: string) {
  const cohort = state.acceleratorCohorts.find((row) => row.id === cohortId);
  if (!cohort) return null;
  return upsertAcceleratorCohort({ id: cohortId, region: cohort.region, cohortPlan: cohortPlan.trim() });
}

export function upsertAcceleratorScheduleItem(
  cohortId: string,
  input: Partial<AbhiAcceleratorScheduleItem> & { id?: string },
) {
  const cohort = state.acceleratorCohorts.find((row) => row.id === cohortId);
  if (!cohort) return null;
  const existing = input.id ? cohort.schedule.find((row) => row.id === input.id) : null;
  const nextItem: AbhiAcceleratorScheduleItem = {
    id: existing?.id ?? uid("abhi-acc-sch"),
    label: input.label ?? existing?.label ?? "New milestone",
    startDate: input.startDate ?? existing?.startDate ?? daysFromNowDate(30),
    endDate: input.endDate ?? existing?.endDate ?? daysFromNowDate(30),
    notes: input.notes ?? existing?.notes ?? "",
  };
  const schedule = existing
    ? cohort.schedule.map((row) => (row.id === existing.id ? nextItem : row))
    : [...cohort.schedule, nextItem];
  return upsertAcceleratorCohort({ id: cohortId, region: cohort.region, schedule });
}

export function deleteAcceleratorScheduleItem(cohortId: string, itemId: string) {
  const cohort = state.acceleratorCohorts.find((row) => row.id === cohortId);
  if (!cohort) return;
  upsertAcceleratorCohort({
    id: cohortId,
    region: cohort.region,
    schedule: cohort.schedule.filter((row) => row.id !== itemId),
  });
}

/* —— Dashboard helpers —— */

export function computeEventsDashboardKpis(snapshot: AbhiMarketingState = state) {
  const now = Date.now();
  const upcoming = snapshot.events.filter((row) => Date.parse(row.endDate) >= now).length;
  const uniqueMembersSignedUp = new Set(snapshot.events.flatMap((row) => row.memberIds)).size;
  const calendarSyncedCount = snapshot.events.filter((row) => row.calendarSynced).length;
  return { upcoming, uniqueMembersSignedUp, calendarSyncedCount, totalEvents: snapshot.events.length };
}
