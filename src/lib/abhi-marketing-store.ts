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
  calendarSynced: boolean;
  createdAt: string;
};

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

export type AbhiWorkingGroup = {
  id: string;
  name: string;
  description: string;
  lead: string;
  meetingCadence: string;
  memberIds: string[];
};

export type AbhiAcceleratorRegion = "us" | "me";
export type AbhiAcceleratorStatus = "recruiting" | "active" | "completed";

export type AbhiAcceleratorCohort = {
  id: string;
  region: AbhiAcceleratorRegion;
  cohortName: string;
  location: string;
  startYear: number;
  status: AbhiAcceleratorStatus;
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

function seedWorkingGroups(memberIds: string[]): AbhiWorkingGroup[] {
  const pick = (...idx: number[]) => idx.map((i) => memberIds[i]).filter(Boolean) as string[];
  return [
    {
      id: "abhi-wg-regulatory",
      name: "Regulatory Affairs",
      description: "Tracks MHRA, UKCA, and international regulatory developments affecting members.",
      lead: "Judith Mellis",
      meetingCadence: "Monthly — first Tuesday",
      memberIds: pick(1, 3, 6, 9),
    },
    {
      id: "abhi-wg-digital-health",
      name: "Digital Health",
      description: "Shapes ABHI positions on NHS digital adoption, AI in health, and interoperability.",
      lead: "Rebecca Parkin",
      meetingCadence: "Bi-weekly",
      memberIds: pick(0, 4, 5, 10),
    },
    {
      id: "abhi-wg-market-access",
      name: "Market Access",
      description: "Supports members navigating NICE, procurement frameworks, and NHS commercial routes.",
      lead: "Owain Prescott",
      meetingCadence: "Monthly — third Wednesday",
      memberIds: pick(2, 7, 8, 11),
    },
    {
      id: "abhi-wg-sustainability",
      name: "Sustainability",
      description: "Develops guidance on net-zero supply chains and sustainable HealthTech manufacturing.",
      lead: "Addie Macgregor",
      meetingCadence: "Quarterly",
      memberIds: pick(3, 6, 9),
    },
  ];
}

function seedAccelerators(memberIds: string[]): AbhiAcceleratorCohort[] {
  const pick = (...idx: number[]) => idx.map((i) => memberIds[i]).filter(Boolean) as string[];
  return [
    {
      id: "abhi-acc-us-boston-2026",
      region: "us",
      cohortName: "ABHI US Accelerator — Boston Cohort 4",
      location: "Boston, USA",
      startYear: 2026,
      status: "active",
      companyIds: pick(0, 2, 5, 8),
    },
    {
      id: "abhi-acc-us-sf-2027",
      region: "us",
      cohortName: "ABHI US Accelerator — San Francisco Cohort 5",
      location: "San Francisco, USA",
      startYear: 2027,
      status: "recruiting",
      companyIds: pick(4, 10),
    },
    {
      id: "abhi-acc-me-dubai-2026",
      region: "me",
      cohortName: "ABHI Middle East Accelerator — Dubai Cohort 2",
      location: "Dubai, UAE",
      startYear: 2026,
      status: "active",
      companyIds: pick(1, 3, 9, 11),
    },
    {
      id: "abhi-acc-me-riyadh-2027",
      region: "me",
      cohortName: "ABHI Middle East Accelerator — Riyadh Cohort 3",
      location: "Riyadh, Saudi Arabia",
      startYear: 2027,
      status: "recruiting",
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
    memberIds: input.memberIds ?? existing?.memberIds ?? [],
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

export function toggleWorkingGroupMember(groupId: string, memberId: string) {
  state = {
    ...state,
    workingGroups: state.workingGroups.map((row) => {
      if (row.id !== groupId) return row;
      const already = row.memberIds.includes(memberId);
      return {
        ...row,
        memberIds: already
          ? row.memberIds.filter((id) => id !== memberId)
          : [...row.memberIds, memberId],
      };
    }),
  };
  emit();
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

/* —— Dashboard helpers —— */

export function computeEventsDashboardKpis(snapshot: AbhiMarketingState = state) {
  const now = Date.now();
  const upcoming = snapshot.events.filter((row) => Date.parse(row.endDate) >= now).length;
  const uniqueMembersSignedUp = new Set(snapshot.events.flatMap((row) => row.memberIds)).size;
  const calendarSyncedCount = snapshot.events.filter((row) => row.calendarSynced).length;
  return { upcoming, uniqueMembersSignedUp, calendarSyncedCount, totalEvents: snapshot.events.length };
}
