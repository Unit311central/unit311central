"use client";

import { Mail, Plus, Send, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";

import {
  deleteMailingCampaign,
  sendMailingCampaignNow,
  upsertMailingCampaign,
  type AbhiMailingCampaign,
  type AbhiRecipientMode,
} from "@/lib/abhi-marketing-store";
import { cn } from "@/lib/utils";
import { useAbhiMarketingStore } from "./useAbhiMarketingStore";
import {
  TqmsEmpty,
  TqmsKpiTile,
  TqmsSection,
  TqmsStatusPill,
  tqmsInputClass,
  tqmsLabelClass,
  tqmsPrimaryButtonClass,
  tqmsSecondaryButtonClass,
} from "./tqms-ui";

type FormState = {
  id: string | null;
  subject: string;
  body: string;
  recipientMode: AbhiRecipientMode;
  recipientMemberIds: string[];
  manualEmailsText: string;
};

function emptyForm(): FormState {
  return { id: null, subject: "", body: "", recipientMode: "all", recipientMemberIds: [], manualEmailsText: "" };
}

function formFromCampaign(item: AbhiMailingCampaign): FormState {
  return {
    id: item.id,
    subject: item.subject,
    body: item.body,
    recipientMode: item.recipientMode,
    recipientMemberIds: item.recipientMemberIds,
    manualEmailsText: item.manualEmails.join("\n"),
  };
}

function statusPillClass(status: AbhiMailingCampaign["status"]) {
  if (status === "sent") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  if (status === "scheduled") return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  return "border-white/15 bg-white/[0.04] text-white/55";
}

function formatWhen(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function recipientCount(item: AbhiMailingCampaign, totalMembers: number) {
  if (item.recipientMode === "all") return totalMembers;
  if (item.recipientMode === "selected") return item.recipientMemberIds.length;
  return item.manualEmails.length;
}

export default function AbhiMailingListWorkspace() {
  const store = useAbhiMarketingStore();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [notice, setNotice] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...store.mailingCampaigns].sort((a, b) => {
        const rank = (item: AbhiMailingCampaign) => (item.status === "sent" ? 1 : 0);
        if (rank(a) !== rank(b)) return rank(a) - rank(b);
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      }),
    [store.mailingCampaigns],
  );
  const sentCount = store.mailingCampaigns.filter((row) => row.status === "sent").length;
  const draftCount = store.mailingCampaigns.filter((row) => row.status === "draft").length;

  function patchForm(patch: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function loadCampaign(item: AbhiMailingCampaign) {
    setForm(formFromCampaign(item));
    setNotice(null);
  }

  function startNew() {
    setForm(emptyForm());
    setNotice(null);
  }

  function toggleMember(memberId: string) {
    patchForm({
      recipientMemberIds: form.recipientMemberIds.includes(memberId)
        ? form.recipientMemberIds.filter((id) => id !== memberId)
        : [...form.recipientMemberIds, memberId],
    });
  }

  function buildPayload() {
    const manualEmails = form.manualEmailsText
      .split(/[\n,]/)
      .map((value) => value.trim())
      .filter(Boolean);
    return {
      id: form.id ?? undefined,
      subject: form.subject.trim() || "Untitled campaign",
      body: form.body,
      recipientMode: form.recipientMode,
      recipientMemberIds: form.recipientMode === "selected" ? form.recipientMemberIds : [],
      manualEmails: form.recipientMode === "manual" ? manualEmails : [],
    };
  }

  function handleSaveDraft() {
    const saved = upsertMailingCampaign({ ...buildPayload(), status: "draft" });
    setForm((current) => ({ ...current, id: saved.id }));
    setNotice("Draft saved.");
  }

  function handleSend() {
    const saved = upsertMailingCampaign(buildPayload());
    sendMailingCampaignNow(saved.id);
    setForm((current) => ({ ...current, id: saved.id }));
    setNotice("Email sent.");
  }

  function handleDelete(id: string) {
    deleteMailingCampaign(id);
    if (form.id === id) startNew();
  }

  const canSend = form.subject.trim().length > 0 && form.body.trim().length > 0;

  return (
    <div className="space-y-5">
      {notice ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <TqmsKpiTile label="Member companies" value={store.members.length} hint="Available recipients" />
        <TqmsKpiTile label="Emails sent" value={sentCount} />
        <TqmsKpiTile label="Drafts" value={draftCount} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <TqmsSection
          title="Campaigns"
          subtitle="Ad-hoc emails to members."
          actions={
            <button type="button" onClick={startNew} className={tqmsPrimaryButtonClass()}>
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
          }
          className="h-fit"
        >
          {sorted.length === 0 ? (
            <TqmsEmpty message="No mailing campaigns yet." />
          ) : (
            <ul className="space-y-2">
              {sorted.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => loadCampaign(item)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
                      form.id === item.id
                        ? "border-sky-400/40 bg-sky-500/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-medium text-white">{item.subject}</p>
                      <TqmsStatusPill className={statusPillClass(item.status)}>{item.status}</TqmsStatusPill>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-white/40">
                      <Users className="h-3 w-3" />
                      {recipientCount(item, store.members.length)} recipients ·{" "}
                      {item.status === "sent" ? formatWhen(item.sentAt) : formatWhen(item.createdAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </TqmsSection>

        <TqmsSection title={form.id ? "Edit email" : "Compose email"}>
          <div className="space-y-3">
            <label className="block">
              <span className={tqmsLabelClass()}>Subject</span>
              <input
                value={form.subject}
                onChange={(e) => patchForm({ subject: e.target.value })}
                placeholder="Subject line"
                className={tqmsInputClass()}
              />
            </label>

            <label className="block">
              <span className={tqmsLabelClass()}>Message</span>
              <textarea
                value={form.body}
                onChange={(e) => patchForm({ body: e.target.value })}
                rows={7}
                placeholder="Write your email…"
                className={cn(tqmsInputClass(), "resize-none")}
              />
            </label>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-sm font-medium text-white">Recipients</p>
              <div className="mt-2 flex flex-wrap gap-4">
                {(
                  [
                    ["all", "All members"],
                    ["selected", "Selected members"],
                    ["manual", "Manual emails"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-sm text-white/75">
                    <input
                      type="radio"
                      name="mailingRecipientMode"
                      checked={form.recipientMode === value}
                      onChange={() => patchForm({ recipientMode: value })}
                      className="h-3.5 w-3.5 border-white/30 bg-transparent"
                    />
                    {label}
                  </label>
                ))}
              </div>

              {form.recipientMode === "selected" ? (
                <div className="mt-3 max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02] p-2 pr-1">
                  {store.members.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs text-white/65 hover:bg-white/[0.04]"
                    >
                      <input
                        type="checkbox"
                        checked={form.recipientMemberIds.includes(member.id)}
                        onChange={() => toggleMember(member.id)}
                        className="h-3.5 w-3.5 rounded border-white/30 bg-transparent"
                      />
                      {member.companyName}
                    </label>
                  ))}
                </div>
              ) : null}

              {form.recipientMode === "manual" ? (
                <textarea
                  value={form.manualEmailsText}
                  onChange={(e) => patchForm({ manualEmailsText: e.target.value })}
                  rows={3}
                  placeholder={"one email per line"}
                  className={cn(tqmsInputClass(), "mt-3 resize-none")}
                />
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" onClick={handleSaveDraft} className={tqmsSecondaryButtonClass()}>
                Save draft
              </button>
              <button type="button" onClick={handleSend} disabled={!canSend} className={tqmsPrimaryButtonClass(!canSend)}>
                <Send className="h-3.5 w-3.5" />
                Send now
              </button>
              {form.id ? (
                <button
                  type="button"
                  onClick={() => handleDelete(form.id!)}
                  className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 px-3 text-xs font-medium text-white/40 transition-colors hover:border-rose-400/40 hover:text-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        </TqmsSection>
      </div>

      <TqmsSection title="Member directory" subtitle="Companies available for mailing list campaigns.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {store.members.map((member) => (
            <div key={member.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <Mail className="h-3.5 w-3.5 shrink-0 text-white/35" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-white/85">{member.companyName}</p>
                <p className="truncate text-[10px] text-white/40">{member.contactEmail}</p>
              </div>
            </div>
          ))}
        </div>
      </TqmsSection>
    </div>
  );
}
