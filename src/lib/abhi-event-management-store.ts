/**
 * ABHI-only client mock store for internal Event Management
 * (conference lead ops: setup, members, tables, equipment).
 */

type Listener = () => void;

export type AbhiManagedEventStatus = "planning" | "confirmed" | "live" | "completed";

export type AbhiEventTable = {
  id: string;
  label: string;
  capacity: number;
  zone: string;
  notes: string;
};

export type AbhiEventMember = {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  tableId: string;
  dietary: string;
};

export type AbhiEventEquipmentStatus = "ordered" | "on_site" | "installed" | "returned";

export type AbhiEventEquipment = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  status: AbhiEventEquipmentStatus;
  assignedZone: string;
  notes: string;
};

export type AbhiEventChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

export type AbhiManagedEvent = {
  id: string;
  name: string;
  venue: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  status: AbhiManagedEventStatus;
  leadName: string;
  capacity: number;
  roomLayout: string;
  setupNotes: string;
  tables: AbhiEventTable[];
  members: AbhiEventMember[];
  equipment: AbhiEventEquipment[];
  checklist: AbhiEventChecklistItem[];
  createdAt: string;
};

type State = {
  events: AbhiManagedEvent[];
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

function seedEvents(): AbhiManagedEvent[] {
  const dubaiTables: AbhiEventTable[] = [
    { id: "abhi-emt-d1", label: "Table A1", capacity: 8, zone: "UK Pavilion", notes: "Near entrance" },
    { id: "abhi-emt-d2", label: "Table A2", capacity: 8, zone: "UK Pavilion", notes: "" },
    { id: "abhi-emt-d3", label: "Table B1", capacity: 10, zone: "Networking lounge", notes: "VIP hosts" },
    { id: "abhi-emt-d4", label: "Speaker top table", capacity: 6, zone: "Stage left", notes: "Dinner only" },
  ];

  const londonTables: AbhiEventTable[] = [
    { id: "abhi-emt-l1", label: "Table 1", capacity: 10, zone: "Main hall", notes: "" },
    { id: "abhi-emt-l2", label: "Table 2", capacity: 10, zone: "Main hall", notes: "" },
    { id: "abhi-emt-l3", label: "Table 3", capacity: 10, zone: "Main hall", notes: "Press" },
    { id: "abhi-emt-l4", label: "Board table", capacity: 12, zone: "Private dining", notes: "Directors" },
  ];

  return [
    {
      id: "abhi-em-whx-dubai-2027",
      name: "WHX Dubai 2027 — UK Pavilion",
      venue: "Dubai World Trade Centre",
      city: "Dubai",
      country: "UAE",
      startDate: "2027-01-25",
      endDate: "2027-01-28",
      status: "confirmed",
      leadName: "Michelle Michelucci",
      capacity: 120,
      roomLayout: "Open pavilion · 4 member pods · central networking lounge",
      setupNotes:
        "Build starts 23 Jan. Branding kit from London office. AV brief with venue 14 days prior.",
      tables: dubaiTables,
      members: [
        {
          id: "abhi-emm-1",
          name: "Sarah Chen",
          company: "Aether Diagnostics",
          role: "Exhibitor",
          email: "sarah.chen@aetherdx.com",
          tableId: "abhi-emt-d1",
          dietary: "",
        },
        {
          id: "abhi-emm-2",
          name: "Tom Bradley",
          company: "Northstar Telehealth",
          role: "Exhibitor",
          email: "tom.bradley@northstar.health",
          tableId: "abhi-emt-d1",
          dietary: "Vegetarian",
        },
        {
          id: "abhi-emm-3",
          name: "Priya Shah",
          company: "Halcyon Health Analytics",
          role: "Exhibitor",
          email: "priya.shah@halcyonhealth.ai",
          tableId: "abhi-emt-d2",
          dietary: "",
        },
        {
          id: "abhi-emm-4",
          name: "Bayode Adisa",
          company: "ABHI",
          role: "Host",
          email: "bayode.adisa@abhi.org.uk",
          tableId: "abhi-emt-d3",
          dietary: "",
        },
        {
          id: "abhi-emm-5",
          name: "Elena Rossi",
          company: "Iris Imaging Solutions",
          role: "Speaker dinner",
          email: "elena.rossi@irisimaging.co.uk",
          tableId: "abhi-emt-d4",
          dietary: "Gluten free",
        },
      ],
      equipment: [
        {
          id: "abhi-eme-1",
          name: "Shell scheme units (3×3m)",
          category: "Stand",
          quantity: 8,
          status: "ordered",
          assignedZone: "UK Pavilion",
          notes: "White panels · ABHI header boards",
        },
        {
          id: "abhi-eme-2",
          name: "LED screen 55\"",
          category: "AV",
          quantity: 2,
          status: "ordered",
          assignedZone: "Networking lounge",
          notes: "Loop member film",
        },
        {
          id: "abhi-eme-3",
          name: "Literature racks",
          category: "Furniture",
          quantity: 6,
          status: "on_site",
          assignedZone: "UK Pavilion",
          notes: "Shipped from London kit",
        },
        {
          id: "abhi-eme-4",
          name: "Handheld radios",
          category: "Ops",
          quantity: 8,
          status: "ordered",
          assignedZone: "Floor team",
          notes: "Channel 3 for pavilion",
        },
      ],
      checklist: [
        { id: "abhi-emc-1", label: "Confirm pavilion floor plan with venue", done: true },
        { id: "abhi-emc-2", label: "Issue exhibitor kit to members", done: true },
        { id: "abhi-emc-3", label: "Final seating plan for networking dinner", done: false },
        { id: "abhi-emc-4", label: "AV & branding sign-off", done: false },
        { id: "abhi-emc-5", label: "Freight arrival confirmed", done: false },
      ],
      createdAt: nowIso(),
    },
    {
      id: "abhi-em-annual-2026",
      name: "ABHI Annual Conference 2026",
      venue: "ExCeL London",
      city: "London",
      country: "UK",
      startDate: "2026-11-12",
      endDate: "2026-11-13",
      status: "planning",
      leadName: "Jane Lewis",
      capacity: 280,
      roomLayout: "Theatre for plenary · banquet rounds for dinner · breakout rooms 1–3",
      setupNotes: "Registration desk opens 08:00. Board dinner private dining on night 1.",
      tables: londonTables,
      members: [
        {
          id: "abhi-emm-6",
          name: "Judith Mellis",
          company: "ABHI",
          role: "Chair",
          email: "judith.mellis@abhi.org.uk",
          tableId: "abhi-emt-l4",
          dietary: "",
        },
        {
          id: "abhi-emm-7",
          name: "Owain Prescott",
          company: "ABHI",
          role: "Host",
          email: "owain.prescott@abhi.org.uk",
          tableId: "abhi-emt-l1",
          dietary: "",
        },
        {
          id: "abhi-emm-8",
          name: "Hannah Cole",
          company: "Lumina Med Devices",
          role: "Delegate",
          email: "hannah.cole@luminamed.com",
          tableId: "abhi-emt-l1",
          dietary: "Vegan",
        },
        {
          id: "abhi-emm-9",
          name: "David Kwon",
          company: "ClearPath Orthopaedics",
          role: "Delegate",
          email: "david.kwon@clearpathortho.com",
          tableId: "abhi-emt-l2",
          dietary: "",
        },
      ],
      equipment: [
        {
          id: "abhi-eme-5",
          name: "Plenary projector & screen",
          category: "AV",
          quantity: 1,
          status: "ordered",
          assignedZone: "Main hall",
          notes: "16:9 · confidence monitor",
        },
        {
          id: "abhi-eme-6",
          name: "Registration laptops",
          category: "IT",
          quantity: 4,
          status: "on_site",
          assignedZone: "Foyer",
          notes: "Badge printers paired",
        },
        {
          id: "abhi-eme-7",
          name: "Banquet chairs",
          category: "Furniture",
          quantity: 280,
          status: "ordered",
          assignedZone: "Main hall",
          notes: "Venue package",
        },
      ],
      checklist: [
        { id: "abhi-emc-6", label: "Confirm ExCeL room holds", done: true },
        { id: "abhi-emc-7", label: "Speaker run-of-show draft", done: false },
        { id: "abhi-emc-8", label: "Dietary requirements collected", done: false },
        { id: "abhi-emc-9", label: "Table plan signed off by lead", done: false },
      ],
      createdAt: nowIso(),
    },
    {
      id: "abhi-em-ghe-riyadh-2026",
      name: "Global Health Exhibition 2026 — ABHI Delegation",
      venue: "Riyadh Front Exhibition & Conference Center",
      city: "Riyadh",
      country: "Saudi Arabia",
      startDate: "2026-10-26",
      endDate: "2026-10-29",
      status: "planning",
      leadName: "Bayode Adisa",
      capacity: 40,
      roomLayout: "Delegation suite · meeting rooms for MOH intros",
      setupNotes: "Visa letters issued. Kit ships via freight forwarder 10 Oct.",
      tables: [
        {
          id: "abhi-emt-r1",
          label: "Meeting table 1",
          capacity: 6,
          zone: "Delegation suite",
          notes: "",
        },
        {
          id: "abhi-emt-r2",
          label: "Meeting table 2",
          capacity: 6,
          zone: "Delegation suite",
          notes: "",
        },
      ],
      members: [
        {
          id: "abhi-emm-10",
          name: "Bayode Adisa",
          company: "ABHI",
          role: "Delegation lead",
          email: "bayode.adisa@abhi.org.uk",
          tableId: "abhi-emt-r1",
          dietary: "",
        },
        {
          id: "abhi-emm-11",
          name: "Marcus Webb",
          company: "Zenith Biotech Partners",
          role: "Delegate",
          email: "marcus.webb@zenithbiotech.com",
          tableId: "abhi-emt-r1",
          dietary: "Halal",
        },
      ],
      equipment: [
        {
          id: "abhi-eme-8",
          name: "Portable display banners",
          category: "Branding",
          quantity: 4,
          status: "ordered",
          assignedZone: "Suite",
          notes: "Roll-ups in freight crate B",
        },
        {
          id: "abhi-eme-9",
          name: "Name badge printers",
          category: "IT",
          quantity: 1,
          status: "ordered",
          assignedZone: "Suite",
          notes: "",
        },
      ],
      checklist: [
        { id: "abhi-emc-10", label: "Delegation list locked", done: true },
        { id: "abhi-emc-11", label: "Freight booking confirmed", done: false },
        { id: "abhi-emc-12", label: "MOH meeting schedule published", done: false },
      ],
      createdAt: nowIso(),
    },
  ];
}

let state: State = { events: seedEvents() };
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeAbhiEventManagementStore(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAbhiEventManagementSnapshot(): State {
  return state;
}

export function resetAbhiEventManagementStore() {
  state = { events: seedEvents() };
  emit();
}

export function upsertManagedEvent(input: Partial<AbhiManagedEvent> & { id?: string }) {
  const existing = input.id ? state.events.find((row) => row.id === input.id) : null;
  const next: AbhiManagedEvent = {
    id: existing?.id ?? uid("abhi-em"),
    name: input.name ?? existing?.name ?? "New conference",
    venue: input.venue ?? existing?.venue ?? "",
    city: input.city ?? existing?.city ?? "",
    country: input.country ?? existing?.country ?? "",
    startDate: input.startDate ?? existing?.startDate ?? new Date().toISOString().slice(0, 10),
    endDate: input.endDate ?? existing?.endDate ?? input.startDate ?? existing?.startDate ?? "",
    status: input.status ?? existing?.status ?? "planning",
    leadName: input.leadName ?? existing?.leadName ?? "",
    capacity: input.capacity ?? existing?.capacity ?? 0,
    roomLayout: input.roomLayout ?? existing?.roomLayout ?? "",
    setupNotes: input.setupNotes ?? existing?.setupNotes ?? "",
    tables: input.tables ?? existing?.tables ?? [],
    members: input.members ?? existing?.members ?? [],
    equipment: input.equipment ?? existing?.equipment ?? [],
    checklist: input.checklist ?? existing?.checklist ?? [],
    createdAt: existing?.createdAt ?? nowIso(),
  };
  state = {
    events: existing
      ? state.events.map((row) => (row.id === existing.id ? next : row))
      : [next, ...state.events],
  };
  emit();
  return next;
}

export function deleteManagedEvent(id: string) {
  state = { events: state.events.filter((row) => row.id !== id) };
  emit();
}

function updateEvent(id: string, updater: (event: AbhiManagedEvent) => AbhiManagedEvent) {
  state = {
    events: state.events.map((row) => (row.id === id ? updater(row) : row)),
  };
  emit();
}

export function upsertEventTable(
  eventId: string,
  input: Partial<AbhiEventTable> & { id?: string },
) {
  updateEvent(eventId, (event) => {
    const existing = input.id ? event.tables.find((row) => row.id === input.id) : null;
    const next: AbhiEventTable = {
      id: existing?.id ?? uid("abhi-emt"),
      label: input.label ?? existing?.label ?? "New table",
      capacity: input.capacity ?? existing?.capacity ?? 8,
      zone: input.zone ?? existing?.zone ?? "",
      notes: input.notes ?? existing?.notes ?? "",
    };
    return {
      ...event,
      tables: existing
        ? event.tables.map((row) => (row.id === existing.id ? next : row))
        : [...event.tables, next],
    };
  });
}

export function deleteEventTable(eventId: string, tableId: string) {
  updateEvent(eventId, (event) => ({
    ...event,
    tables: event.tables.filter((row) => row.id !== tableId),
    members: event.members.map((member) =>
      member.tableId === tableId ? { ...member, tableId: "" } : member,
    ),
  }));
}

export function upsertEventMember(
  eventId: string,
  input: Partial<AbhiEventMember> & { id?: string },
) {
  updateEvent(eventId, (event) => {
    const existing = input.id ? event.members.find((row) => row.id === input.id) : null;
    const next: AbhiEventMember = {
      id: existing?.id ?? uid("abhi-emm"),
      name: input.name ?? existing?.name ?? "New member",
      company: input.company ?? existing?.company ?? "",
      role: input.role ?? existing?.role ?? "Delegate",
      email: input.email ?? existing?.email ?? "",
      tableId: input.tableId ?? existing?.tableId ?? "",
      dietary: input.dietary ?? existing?.dietary ?? "",
    };
    return {
      ...event,
      members: existing
        ? event.members.map((row) => (row.id === existing.id ? next : row))
        : [...event.members, next],
    };
  });
}

export function deleteEventMember(eventId: string, memberId: string) {
  updateEvent(eventId, (event) => ({
    ...event,
    members: event.members.filter((row) => row.id !== memberId),
  }));
}

export function upsertEventEquipment(
  eventId: string,
  input: Partial<AbhiEventEquipment> & { id?: string },
) {
  updateEvent(eventId, (event) => {
    const existing = input.id ? event.equipment.find((row) => row.id === input.id) : null;
    const next: AbhiEventEquipment = {
      id: existing?.id ?? uid("abhi-eme"),
      name: input.name ?? existing?.name ?? "New item",
      category: input.category ?? existing?.category ?? "Ops",
      quantity: input.quantity ?? existing?.quantity ?? 1,
      status: input.status ?? existing?.status ?? "ordered",
      assignedZone: input.assignedZone ?? existing?.assignedZone ?? "",
      notes: input.notes ?? existing?.notes ?? "",
    };
    return {
      ...event,
      equipment: existing
        ? event.equipment.map((row) => (row.id === existing.id ? next : row))
        : [...event.equipment, next],
    };
  });
}

export function deleteEventEquipment(eventId: string, equipmentId: string) {
  updateEvent(eventId, (event) => ({
    ...event,
    equipment: event.equipment.filter((row) => row.id !== equipmentId),
  }));
}

export function toggleChecklistItem(eventId: string, itemId: string) {
  updateEvent(eventId, (event) => ({
    ...event,
    checklist: event.checklist.map((row) =>
      row.id === itemId ? { ...row, done: !row.done } : row,
    ),
  }));
}

export function addChecklistItem(eventId: string, label: string) {
  const trimmed = label.trim();
  if (!trimmed) return;
  updateEvent(eventId, (event) => ({
    ...event,
    checklist: [...event.checklist, { id: uid("abhi-emc"), label: trimmed, done: false }],
  }));
}

export function deleteChecklistItem(eventId: string, itemId: string) {
  updateEvent(eventId, (event) => ({
    ...event,
    checklist: event.checklist.filter((row) => row.id !== itemId),
  }));
}
