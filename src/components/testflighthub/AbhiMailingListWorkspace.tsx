"use client";

import { Mail, Pencil, Plus, Send, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";

import {
  addMember,
  deleteMailingCampaign,
  deleteMember,
  sendMailingCampaignNow,
  updateMember,
  upsertMailingCampaign,
  type AbhiMailingCampaign,
  type AbhiMemberCompany,
  type AbhiRecipientMode,
} from "@/lib/abhi-marketing-store";
import { cn } from "@/lib/utils";
import { useAbhiMarketingStore } from "./useAbhiMarketingStore";
import {
  TqmsEmpty,
  TqmsKpiTile,
  TqmsSection,
  TqmsSlideOver,
  TqmsStatusPill,
  tqmsInputClass,
  tqmsLabelClass,
  tqmsPrimaryButtonClass,
  tqmsSecondaryButtonClass,
} from "./tqms-ui";

type MemberFormState = {
  id: string | null;
  companyName: string;
  contactEmail: string;
};

function emptyMemberForm(): MemberFormState {
  return { id: null, companyName: "", contactEmail: "" };
}

function memberFormFrom(member: AbhiMemberCompany): MemberFormState {
  return {
    id: member.id,
    companyName: member.companyName,
    contactEmail: member.contactEmail,
  };
}

type FormState = {
  id: string | null;
  name: string;
  purpose: string;
  listName: string;
  subject: string;
  body: string;
  recipientMode: AbhiRecipientMode;
  recipientMemberIds: string[];
  manualEmailsText: string;
};

function emptyForm(): FormState {
  return {
    id: null,
    name: "",
    purpose: "",
    listName: "",
    subject: "",
    body: "",
    recipientMode: "all",
    recipientMemberIds: [],
    manualEmailsText: "",
  };
}

function formFromCampaign(item: AbhiMailingCampaign): FormState {
  return {
    id: item.id,
    name: item.name ?? "",
    purpose: item.purpose ?? "",
    listName: item.listName ?? "",
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
  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [memberForm, setMemberForm] = useState<MemberFormState>(emptyMemberForm());

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
      name: form.name.trim() || form.subject.trim() || "Untitled campaign",
      purpose: form.purpose.trim(),
      listName: form.listName.trim(),
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

  function openAddMember() {
    setMemberForm(emptyMemberForm());
    setMemberFormOpen(true);
  }

  function openEditMember(member: AbhiMemberCompany) {
    setMemberForm(memberFormFrom(member));
    setMemberFormOpen(true);
  }

  function handleMemberSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!memberForm.companyName.trim()) return;
    const contactEmail =
      memberForm.contactEmail.trim() ||
      `contact@${memberForm.companyName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`;
    if (memberForm.id) {
      updateMember(memberForm.id, {
        companyName: memberForm.companyName.trim(),
        contactEmail,
      });
      setNotice("Member updated.");
    } else {
      addMember({
        companyName: memberForm.companyName.trim(),
        contactEmail,
      });
      setNotice("Member added.");
    }
    setMemberFormOpen(false);
  }

  function handleDeleteMember(member: AbhiMemberCompany) {
    const ok = window.confirm(`Remove “${member.companyName}” from the member directory?`);
    if (!ok) return;
    deleteMember(member.id);
    patchForm({
      recipientMemberIds: form.recipientMemberIds.filter((id) => id !== member.id),
    });
    if (memberForm.id === member.id) setMemberFormOpen(false);
    setNotice("Member removed.");
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
                      <p className="min-w-0 truncate text-sm font-medium text-white">
                        {item.name?.trim() || item.subject}
                      </p>
                      <TqmsStatusPill className={statusPillClass(item.status)}>{item.status}</TqmsStatusPill>
                    </div>
                    {item.purpose || item.listName ? (
                      <p className="mt-0.5 truncate text-[11px] text-white/45">
                        {[item.purpose, item.listName].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-white/40">
                      <Users className="h-3 w-3" />
                      {recipientCount(item, store.members.length)} recipients · Last sent{" "}
                      {formatWhen(item.lastSent ?? item.sentAt ?? item.createdAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </TqmsSection>

        <TqmsSection title={form.id ? "Edit email" : "Compose email"}>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={tqmsLabelClass()}>Campaign name</span>
                <input
                  value={form.name}
                  onChange={(e) => patchForm({ name: e.target.value })}
                  placeholder="e.g. Smart Mfg Expo invite"
                  className={tqmsInputClass()}
                />
              </label>
              <label className="block">
                <span className={tqmsLabelClass()}>Purpose</span>
                <input
                  value={form.purpose}
                  onChange={(e) => patchForm({ purpose: e.target.value })}
                  placeholder="Event promotion, lead nurture…"
                  className={tqmsInputClass()}
                />
              </label>
            </div>
            <label className="block">
              <span className={tqmsLabelClass()}>Saved list</span>
              <input
                value={form.listName}
                onChange={(e) => patchForm({ listName: e.target.value })}
                placeholder="e.g. Manufacturing accounts Q3"
                className={tqmsInputClass()}
              />
            </label>
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

      <TqmsSection
        title="Member directory"
        subtitle="Companies available for mailing list campaigns."
        actions={
          <button type="button" onClick={openAddMember} className={tqmsPrimaryButtonClass()}>
            <Plus className="h-3.5 w-3.5" />
            Add member
          </button>
        }
      >
        {store.members.length === 0 ? (
          <TqmsEmpty message="No member companies yet." />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {store.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
              >
                <Mail className="h-3.5 w-3.5 shrink-0 text-white/35" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white/85">{member.companyName}</p>
                  <p className="truncate text-[10px] text-white/40">{member.contactEmail}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditMember(member)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-white/40 transition-colors hover:border-sky-400/40 hover:text-sky-200"
                    aria-label={`Edit ${member.companyName}`}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMember(member)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-white/30 transition-colors hover:border-rose-400/40 hover:text-rose-300"
                    aria-label={`Delete ${member.companyName}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </TqmsSection>

      {memberFormOpen ? (
        <TqmsSlideOver
          title={memberForm.id ? "Edit member" : "Add member"}
          subtitle="Company and contact email for mailing campaigns."
          onClose={() => setMemberFormOpen(false)}
        >
          <form className="space-y-4" onSubmit={handleMemberSubmit}>
            <label className="block">
              <span className={tqmsLabelClass()}>Company name</span>
              <input
                value={memberForm.companyName}
                onChange={(e) =>
                  setMemberForm((current) => ({ ...current, companyName: e.target.value }))
                }
                className={tqmsInputClass()}
                required
              />
            </label>
            <label className="block">
              <span className={tqmsLabelClass()}>Contact email</span>
              <input
                type="email"
                value={memberForm.contactEmail}
                onChange={(e) =>
                  setMemberForm((current) => ({ ...current, contactEmail: e.target.value }))
                }
                placeholder="contact@company.com"
                className={tqmsInputClass()}
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMemberFormOpen(false)}
                className={tqmsSecondaryButtonClass()}
              >
                Cancel
              </button>
              <button type="submit" className={tqmsPrimaryButtonClass()}>
                {memberForm.id ? "Save changes" : "Add member"}
              </button>
            </div>
          </form>
        </TqmsSlideOver>
      ) : null}
    </div>
  );
}
