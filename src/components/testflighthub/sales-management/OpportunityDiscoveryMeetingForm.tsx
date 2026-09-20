"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import type { CrmLead } from "@/lib/crm-data";
import type { ManagedClient } from "@/lib/client-management-data";

export type OpportunityDiscoveryMeetingSummary = {
  id: string;
  name: string;
  organization: string;
  role: string | null;
  email: string;
  formattedWhenGmt: string;
  formattedWhenClient: string | null;
  statusLabel: string;
  meetingLink: string;
};

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  return JSON.parse(text) as T;
}

function combineDateAndTime(datePart: string, timePart: string): string | null {
  if (!datePart?.trim() || !timePart?.trim()) return null;
  const combined = new Date(`${datePart}T${timePart}`);
  if (Number.isNaN(combined.getTime())) return null;
  return combined.toISOString();
}

function isValidMeetingUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function OpportunityDiscoveryMeetingForm({
  lead,
  client,
  onSaved,
  onCancel,
  title = "Create discovery meeting",
}: {
  lead: CrmLead;
  client: ManagedClient | null;
  onSaved: () => void;
  onCancel: () => void;
  title?: string;
}) {
  const [draftName, setDraftName] = useState(lead.contactName?.trim() || client?.primaryContact?.trim() || "");
  const [draftOrg, setDraftOrg] = useState(lead.companyName?.trim() || client?.companyName?.trim() || "");
  const [draftEmail, setDraftEmail] = useState(lead.email?.trim() || client?.email?.trim() || "");
  const [draftMeetingDate, setDraftMeetingDate] = useState("");
  const [draftMeetingTime, setDraftMeetingTime] = useState("");
  const [draftMeetingLink, setDraftMeetingLink] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setCreating(true);
    setError(null);
    try {
      const startsAt = combineDateAndTime(draftMeetingDate, draftMeetingTime);
      if (!startsAt) {
        setError("Select a valid meeting date and time.");
        return;
      }
      if (!isValidMeetingUrl(draftMeetingLink)) {
        setError("Enter a valid meeting link URL (https://…).");
        return;
      }

      const response = await fetch("/api/crm/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draftName,
          organization: draftOrg,
          email: draftEmail,
          startsAt,
          meetingLink: draftMeetingLink.trim(),
          crmLeadId: lead.id,
        }),
      });
      const data = await readApiJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to save discovery meeting");
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save discovery meeting");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="rounded-xl border border-violet-400/25 bg-violet-500/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="mt-1 text-xs text-white/50">
            Linked to opportunity {lead.companyName}. Uses the shared CRM discovery meeting register.
          </p>
        </div>
        <button type="button" onClick={onCancel} className="text-xs text-white/45 hover:text-white/70">
          Back to opportunity
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
          Name
          <input
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
          />
        </label>
        <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
          Organisation
          <input
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white"
            value={draftOrg}
            onChange={(e) => setDraftOrg(e.target.value)}
          />
        </label>
        <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-white/45 sm:col-span-2">
          Email
          <input
            type="email"
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white"
            value={draftEmail}
            onChange={(e) => setDraftEmail(e.target.value)}
          />
        </label>
        <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
          Meeting date
          <input
            type="date"
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white [color-scheme:dark]"
            value={draftMeetingDate}
            onChange={(e) => setDraftMeetingDate(e.target.value)}
          />
        </label>
        <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
          Meeting time
          <input
            type="time"
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white [color-scheme:dark]"
            value={draftMeetingTime}
            onChange={(e) => setDraftMeetingTime(e.target.value)}
          />
        </label>
        <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-white/45 sm:col-span-2">
          Meeting link
          <input
            type="url"
            placeholder="https://zoom.us/… or https://teams.microsoft.com/…"
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white"
            value={draftMeetingLink}
            onChange={(e) => setDraftMeetingLink(e.target.value)}
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={creating}
          onClick={() => void handleSave()}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save discovery meeting
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
