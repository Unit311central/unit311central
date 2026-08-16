"use client";

import { useState } from "react";
import { ExternalLink, FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";

import {
  CorporateKpiTile,
  CorporateSection,
  CorporateStatusPill,
  corporatePrimaryButtonClass,
  corporateSecondaryButtonClass,
} from "@/components/testflighthub/corporate-ui";
import {
  NORTHSTAR_FUNDING_ROUNDS,
  NORTHSTAR_INVESTORS,
  NORTHSTAR_SEED_TARGET_GBP,
  NORTHSTAR_SERIES_A_TARGET_GBP,
  NORTHSTAR_TOTAL_RAISED_GBP,
  type DataRoomRow,
  type DemoInvestor,
  type FundraisingMeeting,
  type FundraisingPipelineDeal,
  type FundraisingPipelineStage,
  type PitchDeckVersion,
} from "@/lib/demo/fundraising-data";
import {
  getNorthstarDataRooms,
  getNorthstarFundraisingMeetings,
  getNorthstarFundraisingPipeline,
  getNorthstarPitchDecks,
} from "@/lib/demo/module-fixtures";
import { cn } from "@/lib/utils";

function formatGbp(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function thClass() {
  return "px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45";
}

function tdClass() {
  return "px-3 py-2.5 text-sm text-white/75";
}

function tableWrapClass() {
  return "overflow-x-auto rounded-xl border border-white/10";
}

const PIPELINE_STAGES: FundraisingPipelineStage[] = [
  "Intro",
  "Pitch sent",
  "Meeting",
  "Diligence",
  "Term sheet",
  "Passed",
];

function stagePillClass(stage: string) {
  if (stage === "Term sheet" || stage === "Diligence") {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  }
  if (stage === "Passed") return "border-white/15 bg-white/5 text-white/50";
  if (stage === "Meeting" || stage === "Pitch sent") {
    return "border-sky-400/30 bg-sky-500/15 text-sky-100";
  }
  return "border-amber-400/30 bg-amber-500/15 text-amber-100";
}

export function DemoFundraisingDashboardWorkspace() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Fundraising Dashboard</h1>
        <p className="mt-1 text-sm text-white/60">Northstar funding history and investor relations</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CorporateKpiTile
          label="Total raised"
          value={formatGbp(NORTHSTAR_TOTAL_RAISED_GBP)}
          hint="Pre-seed closed (2023)"
        />
        <CorporateKpiTile
          label="Seed round"
          value={formatGbp(NORTHSTAR_SEED_TARGET_GBP)}
          hint="In progress · £5M target"
        />
        <CorporateKpiTile
          label="Series A aspiration"
          value={formatGbp(NORTHSTAR_SERIES_A_TARGET_GBP)}
          hint="Target raise 2027"
        />
        <CorporateKpiTile label="Cash" value={formatGbp(1_900_000)} hint="Treasury position" />
      </div>
      <CorporateSection title="Funding rounds">
        <div className="space-y-3">
          {NORTHSTAR_FUNDING_ROUNDS.map((round) => (
            <div
              key={round.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">
                    {round.label} · {round.year}
                  </p>
                  <p className="text-sm text-white/55">Lead: {round.lead}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{formatGbp(round.amountGbp)}</p>
                  <CorporateStatusPill>{round.status}</CorporateStatusPill>
                </div>
              </div>
              {round.investors.length > 0 ? (
                <ul className="mt-3 space-y-1 border-t border-white/[0.06] pt-3 text-xs text-white/50">
                  {round.investors.map((name) => (
                    <li key={name}>· {name}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </CorporateSection>
    </div>
  );
}

export function DemoFundraisingInvestorsWorkspace() {
  const [investors, setInvestors] = useState<DemoInvestor[]>(() => [...NORTHSTAR_INVESTORS]);
  const [editing, setEditing] = useState<DemoInvestor | null>(null);

  function saveInvestor() {
    if (!editing) return;
    setInvestors((current) => {
      const exists = current.some((row) => row.id === editing.id);
      if (exists) return current.map((row) => (row.id === editing.id ? editing : row));
      return [editing, ...current];
    });
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Investors</h1>
          <p className="mt-1 text-sm text-white/60">Northstar cap table investors — editable in Demo.</p>
        </div>
        <button
          type="button"
          className={corporatePrimaryButtonClass()}
          onClick={() =>
            setEditing({
              id: `inv-${Date.now()}`,
              firm: "",
              contact: "",
              stage: "",
              status: "pipeline",
              lastContact: new Date().toISOString().slice(0, 10),
            })
          }
        >
          <Plus className="mr-1.5 inline h-4 w-4" />
          Add investor
        </button>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {investors.map((inv) => (
          <div key={inv.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-medium text-white">{inv.firm}</h2>
                <p className="text-sm text-white/55">{inv.contact}</p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-white/10 p-2 text-white/60 hover:text-white"
                onClick={() => setEditing(inv)}
                aria-label={`Edit ${inv.firm}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-white/70">
              {inv.stage} · Last contact {inv.lastContact}
            </p>
            <CorporateStatusPill className="mt-3">{inv.status}</CorporateStatusPill>
          </div>
        ))}
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1524] p-5">
            <h3 className="text-lg font-semibold text-white">{editing.firm ? "Edit investor" : "New investor"}</h3>
            <div className="mt-4 space-y-3">
              {(["firm", "contact", "stage", "lastContact"] as const).map((field) => (
                <label key={field} className="block text-sm text-white/60">
                  {field === "lastContact" ? "Last contact" : field.charAt(0).toUpperCase() + field.slice(1)}
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#060d18] px-3 py-2 text-white"
                    value={editing[field]}
                    onChange={(e) => setEditing({ ...editing, [field]: e.target.value })}
                  />
                </label>
              ))}
              <label className="block text-sm text-white/60">
                Status
                <select
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#060d18] px-3 py-2 text-white"
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({ ...editing, status: e.target.value as DemoInvestor["status"] })
                  }
                >
                  <option value="portfolio">portfolio</option>
                  <option value="pipeline">pipeline</option>
                  <option value="passed">passed</option>
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={corporateSecondaryButtonClass()} onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="button" className={corporatePrimaryButtonClass()} onClick={saveInvestor}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DemoFundraisingPipelineWorkspace() {
  const pipeline = getNorthstarFundraisingPipeline();
  const openDeals = pipeline.filter((d) => d.stage !== "Passed");
  const pipelineGbp = openDeals.reduce((sum, d) => sum + d.amountGbp, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-1 py-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Pipeline</h1>
        <p className="mt-1 text-sm text-white/60">Series B extension — Northstar investor progression.</p>
      </header>
      <section className="grid gap-3 sm:grid-cols-3">
        <CorporateKpiTile label="Open deals" value={openDeals.length} hint="Active pipeline" />
        <CorporateKpiTile label="Pipeline value" value={formatGbp(pipelineGbp)} hint="Excludes passed" />
        <CorporateKpiTile label="Raise target" value={formatGbp(NORTHSTAR_SEED_TARGET_GBP)} hint="Growth extension" />
      </section>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {PIPELINE_STAGES.map((stage) => (
          <div key={stage} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">{stage}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
              {pipeline.filter((d) => d.stage === stage).length}
            </p>
          </div>
        ))}
      </div>
      <CorporateSection title="Active deals" subtitle="Northstar fundraising pipeline.">
        <div className={tableWrapClass()}>
          <table className="min-w-full text-left">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className={thClass()}>Investor</th>
                <th className={thClass()}>Firm</th>
                <th className={thClass()}>Stage</th>
                <th className={thClass()}>Amount</th>
                <th className={thClass()}>Owner</th>
                <th className={thClass()}>Last touch</th>
                <th className={thClass()}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {pipeline.map((deal: FundraisingPipelineDeal) => (
                <tr key={deal.id} className="border-b border-white/5 last:border-0">
                  <td className={cn(tdClass(), "font-medium text-white")}>{deal.investor}</td>
                  <td className={tdClass()}>{deal.firm}</td>
                  <td className={tdClass()}>
                    <CorporateStatusPill className={stagePillClass(deal.stage)}>{deal.stage}</CorporateStatusPill>
                  </td>
                  <td className={cn(tdClass(), "tabular-nums")}>{formatGbp(deal.amountGbp)}</td>
                  <td className={tdClass()}>{deal.owner}</td>
                  <td className={tdClass()}>{formatDate(deal.lastTouch)}</td>
                  <td className={cn(tdClass(), "max-w-xs text-white/55")}>{deal.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CorporateSection>
    </div>
  );
}

export function DemoFundraisingMeetingsWorkspace() {
  const meetings = getNorthstarFundraisingMeetings();
  return (
    <div className="mx-auto max-w-6xl space-y-5 px-1 py-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Meetings</h1>
        <p className="mt-1 text-sm text-white/60">Upcoming Northstar investor meetings.</p>
      </header>
      <section className="grid gap-3 sm:grid-cols-3">
        <CorporateKpiTile label="Upcoming" value={meetings.length} hint="Scheduled sessions" />
        <CorporateKpiTile
          label="Deck sent"
          value={meetings.filter((m) => m.pitchDeckSent).length}
          hint="Pitch deck shared"
        />
        <CorporateKpiTile
          label="Confirmed"
          value={meetings.filter((m) => m.status === "Confirmed").length}
          hint="On calendar"
        />
      </section>
      <CorporateSection title="Investor meetings">
        <div className={tableWrapClass()}>
          <table className="min-w-full text-left">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className={thClass()}>Title</th>
                <th className={thClass()}>Investor</th>
                <th className={thClass()}>Date</th>
                <th className={thClass()}>With</th>
                <th className={thClass()}>Deck</th>
                <th className={thClass()}>Link</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((meeting: FundraisingMeeting) => (
                <tr key={meeting.id} className="border-b border-white/5 last:border-0">
                  <td className={cn(tdClass(), "font-medium text-white")}>{meeting.title}</td>
                  <td className={tdClass()}>{meeting.firm}</td>
                  <td className={tdClass()}>
                    {formatDate(meeting.date)} · {meeting.time}
                  </td>
                  <td className={tdClass()}>{meeting.withWhom}</td>
                  <td className={tdClass()}>{meeting.pitchDeckSent ? "Sent" : "Pending"}</td>
                  <td className={tdClass()}>
                    <a href={meeting.meetingLink} className="text-sky-300 hover:text-sky-200">
                      Join
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CorporateSection>
    </div>
  );
}

type DeckForm = {
  id?: string;
  version: string;
  title: string;
  fileName: string;
  notes: string;
  lastUpdatedBy: string;
};

export function DemoFundraisingPitchDecksWorkspace() {
  const [decks, setDecks] = useState<PitchDeckVersion[]>(() => getNorthstarPitchDecks());
  const [form, setForm] = useState<DeckForm | null>(null);

  function saveForm() {
    if (!form || !form.version.trim() || !form.title.trim()) return;
    const now = new Date().toISOString();
    if (form.id) {
      setDecks((prev) =>
        prev.map((d) =>
          d.id === form.id
            ? {
                ...d,
                version: form.version,
                title: form.title,
                fileName: form.fileName || d.fileName,
                notes: form.notes,
                lastUpdatedAt: now,
                lastUpdatedBy: form.lastUpdatedBy || "Admin",
              }
            : d,
        ),
      );
    } else {
      setDecks((prev) => [
        {
          id: `nst-deck-${Date.now()}`,
          version: form.version,
          title: form.title,
          dateAdded: now.slice(0, 10),
          lastUpdatedAt: now,
          lastUpdatedBy: form.lastUpdatedBy || "Admin",
          fileName: form.fileName || `Northstar_Pitch_v${form.version}.pdf`,
          notes: form.notes,
        },
        ...prev,
      ]);
    }
    setForm(null);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-1 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Pitch Decks</h1>
          <p className="mt-1 text-sm text-white/60">Northstar investor materials — add, edit, or remove versions.</p>
        </div>
        <button
          type="button"
          className={corporatePrimaryButtonClass()}
          onClick={() =>
            setForm({
              version: "3.3",
              title: "Northstar Industrial Technologies — Investor Overview",
              fileName: "Northstar_Investor_Overview_v3.3.pdf",
              notes: "",
              lastUpdatedBy: "Elena Hart",
            })
          }
        >
          <Plus className="mr-1.5 inline h-4 w-4" />
          Add deck
        </button>
      </header>
      <CorporateSection title="Deck versions">
        <div className="space-y-3">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <div>
                <p className="font-medium text-white">
                  v{deck.version} — {deck.title}
                </p>
                <p className="text-sm text-white/55">
                  {deck.fileName} · Updated {formatDateTime(deck.lastUpdatedAt)} by {deck.lastUpdatedBy}
                </p>
                {deck.notes ? <p className="mt-1 text-sm text-white/45">{deck.notes}</p> : null}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={corporateSecondaryButtonClass()}
                  onClick={() =>
                    setForm({
                      id: deck.id,
                      version: deck.version,
                      title: deck.title,
                      fileName: deck.fileName,
                      notes: deck.notes,
                      lastUpdatedBy: deck.lastUpdatedBy,
                    })
                  }
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={corporateSecondaryButtonClass()}
                  onClick={() => setDecks((prev) => prev.filter((d) => d.id !== deck.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </CorporateSection>

      {form ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b1524] p-5">
            <h3 className="text-lg font-semibold text-white">{form.id ? "Edit deck" : "New deck"}</h3>
            <div className="mt-4 space-y-3">
              {(["version", "title", "fileName", "lastUpdatedBy", "notes"] as const).map((field) => (
                <label key={field} className="block text-sm text-white/60">
                  {field}
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#060d18] px-3 py-2 text-white"
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  />
                </label>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={corporateSecondaryButtonClass()} onClick={() => setForm(null)}>
                Cancel
              </button>
              <button type="button" className={corporatePrimaryButtonClass()} onClick={saveForm}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DemoFundraisingDataRoomsWorkspace() {
  const rooms = getNorthstarDataRooms();
  return (
    <div className="mx-auto max-w-6xl space-y-5 px-1 py-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Data Rooms</h1>
        <p className="mt-1 text-sm text-white/60">Northstar investor data rooms.</p>
      </header>
      <section className="grid gap-3 sm:grid-cols-3">
        <CorporateKpiTile label="Active rooms" value={rooms.length} hint="Current investors" />
        <CorporateKpiTile
          label="Open access"
          value={rooms.filter((r) => r.status === "Open").length}
          hint="Full folder access"
        />
        <CorporateKpiTile
          label="Documents"
          value={rooms.reduce((sum, r) => sum + r.documents, 0)}
          hint="Across all rooms"
        />
      </section>
      <CorporateSection title="Investor data rooms">
        <div className={tableWrapClass()}>
          <table className="min-w-full text-left">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className={thClass()}>Investor</th>
                <th className={thClass()}>Firm</th>
                <th className={thClass()}>Folder</th>
                <th className={thClass()}>Documents</th>
                <th className={thClass()}>Last updated</th>
                <th className={thClass()}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room: DataRoomRow) => (
                <tr key={room.id} className="border-b border-white/5 last:border-0">
                  <td className={cn(tdClass(), "font-medium text-white")}>{room.investor}</td>
                  <td className={tdClass()}>{room.firm}</td>
                  <td className={tdClass()}>
                    <a
                      href={room.folderLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sky-300 hover:text-sky-200"
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                      Open
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </td>
                  <td className={cn(tdClass(), "tabular-nums")}>{room.documents}</td>
                  <td className={tdClass()}>{formatDateTime(room.lastUpdatedAt)}</td>
                  <td className={tdClass()}>
                    <CorporateStatusPill>{room.status}</CorporateStatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CorporateSection>
    </div>
  );
}
