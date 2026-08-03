"use client";

import { useMemo, useState } from "react";
import { Mail, Pencil, Plus, Send, Trash2, Users } from "lucide-react";

import {
  addMailingContact,
  deleteMailingCampaign,
  deleteMailingContact,
  sendMailingCampaignNow,
  updateMailingContact,
  upsertMailingCampaign,
  type MailingCampaign,
  type MailingContact,
  type RecipientMode,
} from "@/lib/talanton/marketing-stories-store";
import { cn } from "@/lib/utils";
import {
  TalantonImpactMetric,
  TalantonIntelligenceHeader,
} from "./talanton-intelligence-ui";
import { useTalantonMarketingStoriesStore } from "./useTalantonMarketingStoriesStore";

type ContactForm = {
  id: string | null;
  name: string;
  organisation: string;
  email: string;
  segment: MailingContact["segment"];
};

type CampaignForm = {
  id: string | null;
  subject: string;
  body: string;
  recipientMode: RecipientMode;
  recipientContactIds: string[];
  manualEmailsText: string;
};

function emptyContact(): ContactForm {
  return { id: null, name: "", organisation: "", email: "", segment: "Investor" };
}

function emptyCampaign(): CampaignForm {
  return {
    id: null,
    subject: "",
    body: "",
    recipientMode: "all",
    recipientContactIds: [],
    manualEmailsText: "",
  };
}

function statusClass(status: MailingCampaign["status"]) {
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

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none placeholder:text-white/30 focus:border-emerald-400/40";
const labelClass = "mb-1.5 block text-[11px] font-medium text-white/45";
const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/25";
const secondaryBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10";

export default function StoriesMailingListWorkspace() {
  const store = useTalantonMarketingStoriesStore();
  const [campaign, setCampaign] = useState<CampaignForm>(emptyCampaign());
  const [contactForm, setContactForm] = useState<ContactForm>(emptyContact());
  const [contactOpen, setContactOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const sortedCampaigns = useMemo(
    () =>
      [...store.campaigns].sort((a, b) => {
        const rank = (c: MailingCampaign) => (c.status === "sent" ? 1 : 0);
        if (rank(a) !== rank(b)) return rank(a) - rank(b);
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      }),
    [store.campaigns],
  );

  const sentCount = store.campaigns.filter((c) => c.status === "sent").length;

  function patchCampaign(patch: Partial<CampaignForm>) {
    setCampaign((c) => ({ ...c, ...patch }));
  }

  function saveCampaign() {
    const id = campaign.id ?? `camp-${Math.random().toString(36).slice(2, 9)}`;
    upsertMailingCampaign({
      id,
      subject: campaign.subject.trim() || "Untitled campaign",
      body: campaign.body,
      status: "draft",
      recipientMode: campaign.recipientMode,
      recipientContactIds: campaign.recipientContactIds,
      manualEmails: campaign.manualEmailsText
        .split(/[\n,;]+/)
        .map((e) => e.trim())
        .filter(Boolean),
      scheduledAt: null,
      sentAt: null,
    });
    patchCampaign({ id });
    setNotice("Campaign saved as draft.");
  }

  function saveContact() {
    if (!contactForm.name.trim() || !contactForm.email.trim()) {
      setNotice("Name and email are required.");
      return;
    }
    if (contactForm.id) {
      updateMailingContact(contactForm.id, {
        name: contactForm.name.trim(),
        organisation: contactForm.organisation.trim(),
        email: contactForm.email.trim(),
        segment: contactForm.segment,
      });
      setNotice("Contact updated.");
    } else {
      addMailingContact({
        name: contactForm.name.trim(),
        organisation: contactForm.organisation.trim(),
        email: contactForm.email.trim(),
        segment: contactForm.segment,
      });
      setNotice("Contact added.");
    }
    setContactForm(emptyContact());
    setContactOpen(false);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Marketing & Stories"
        title="Mailing List Management"
        description="Manage investor, LP, supporter and partner contacts — and run targeted mailing campaigns that share Talanton portfolio impact."
        actions={
          <button
            type="button"
            className={primaryBtn}
            onClick={() => {
              setContactForm(emptyContact());
              setContactOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add contact
          </button>
        }
      />

      {notice ? (
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-100">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <TalantonImpactMetric label="Contacts" value={store.contacts.length} hint="Mailing list" />
        <TalantonImpactMetric label="Campaigns" value={store.campaigns.length} hint="All statuses" />
        <TalantonImpactMetric label="Sent" value={sentCount} hint="Completed mailings" tone="good" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
              Campaigns
            </p>
            <button
              type="button"
              className="text-[11px] text-emerald-300/80 hover:text-emerald-200"
              onClick={() => setCampaign(emptyCampaign())}
            >
              New
            </button>
          </div>
          {sortedCampaigns.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setCampaign({
                  id: item.id,
                  subject: item.subject,
                  body: item.body,
                  recipientMode: item.recipientMode,
                  recipientContactIds: item.recipientContactIds,
                  manualEmailsText: item.manualEmails.join("\n"),
                });
                setNotice(null);
              }}
              className={cn(
                "w-full rounded-2xl border px-3.5 py-3 text-left transition",
                campaign.id === item.id
                  ? "border-emerald-400/40 bg-emerald-500/10"
                  : "border-white/10 bg-black/20 hover:border-white/20",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-white">{item.subject}</p>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] capitalize",
                    statusClass(item.status),
                  )}
                >
                  {item.status}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-white/40">
                {item.status === "sent" ? formatWhen(item.sentAt) : formatWhen(item.createdAt)}
              </p>
            </button>
          ))}
        </aside>

        <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f2a1f]/60 via-[#0b1a14]/85 to-[#08110d] p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Mail className="h-5 w-5 text-emerald-300/80" />
            Compose campaign
          </h2>
          <label className="mt-4 block">
            <span className={labelClass}>Subject</span>
            <input
              className={inputClass}
              value={campaign.subject}
              onChange={(e) => patchCampaign({ subject: e.target.value })}
            />
          </label>
          <label className="mt-3 block">
            <span className={labelClass}>Body</span>
            <textarea
              className={cn(inputClass, "min-h-[140px]")}
              value={campaign.body}
              onChange={(e) => patchCampaign({ body: e.target.value })}
            />
          </label>

          <div className="mt-4">
            <p className={labelClass}>Recipients</p>
            <div className="flex flex-wrap gap-3 text-sm text-white/70">
              {(["all", "selected", "manual"] as RecipientMode[]).map((mode) => (
                <label key={mode} className="inline-flex items-center gap-2 capitalize">
                  <input
                    type="radio"
                    name="mailRecipientMode"
                    checked={campaign.recipientMode === mode}
                    onChange={() => patchCampaign({ recipientMode: mode })}
                  />
                  {mode}
                </label>
              ))}
            </div>
            {campaign.recipientMode === "selected" ? (
              <div className="mt-3 max-h-40 space-y-1.5 overflow-auto rounded-xl border border-white/10 bg-black/25 p-3">
                {store.contacts.map((c) => {
                  const checked = campaign.recipientContactIds.includes(c.id);
                  return (
                    <label key={c.id} className="flex items-center gap-2 text-xs text-white/70">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          patchCampaign({
                            recipientContactIds: checked
                              ? campaign.recipientContactIds.filter((id) => id !== c.id)
                              : [...campaign.recipientContactIds, c.id],
                          })
                        }
                      />
                      {c.name} · {c.organisation}
                    </label>
                  );
                })}
              </div>
            ) : null}
            {campaign.recipientMode === "manual" ? (
              <textarea
                className={cn(inputClass, "mt-3 min-h-[80px]")}
                value={campaign.manualEmailsText}
                onChange={(e) => patchCampaign({ manualEmailsText: e.target.value })}
                placeholder="One email per line"
              />
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className={secondaryBtn} onClick={saveCampaign}>
              Save draft
            </button>
            <button
              type="button"
              className={primaryBtn}
              onClick={() => {
                const id = campaign.id ?? `camp-${Math.random().toString(36).slice(2, 9)}`;
                upsertMailingCampaign({
                  id,
                  subject: campaign.subject.trim() || "Untitled campaign",
                  body: campaign.body,
                  status: "draft",
                  recipientMode: campaign.recipientMode,
                  recipientContactIds: campaign.recipientContactIds,
                  manualEmails: campaign.manualEmailsText
                    .split(/[\n,;]+/)
                    .map((e) => e.trim())
                    .filter(Boolean),
                  scheduledAt: null,
                  sentAt: null,
                });
                sendMailingCampaignNow(id);
                patchCampaign({ id });
                setNotice(`Campaign sent · ${campaign.subject || "Untitled"}`);
              }}
            >
              <Send className="h-4 w-4" />
              Send now
            </button>
            {campaign.id ? (
              <button
                type="button"
                className={cn(secondaryBtn, "border-rose-400/20 text-rose-200")}
                onClick={() => {
                  deleteMailingCampaign(campaign.id!);
                  setCampaign(emptyCampaign());
                  setNotice("Campaign deleted.");
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            ) : null}
          </div>
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-300/80" />
          <h2 className="text-lg font-semibold text-white">Mailing list directory</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {store.contacts.map((c) => (
            <article
              key={c.id}
              className="rounded-2xl border border-white/10 bg-black/25 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">{c.name}</p>
                  <p className="mt-0.5 text-xs text-white/50">{c.organisation}</p>
                  <p className="mt-1 text-xs text-emerald-200/70">{c.email}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/55">
                  {c.segment}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className={secondaryBtn}
                  onClick={() => {
                    setContactForm({
                      id: c.id,
                      name: c.name,
                      organisation: c.organisation,
                      email: c.email,
                      segment: c.segment,
                    });
                    setContactOpen(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  className={cn(secondaryBtn, "border-rose-400/20 text-rose-200")}
                  onClick={() => {
                    deleteMailingContact(c.id);
                    setNotice(`Removed ${c.name}.`);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {contactOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0b1a14] p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">
              {contactForm.id ? "Edit contact" : "Add contact"}
            </h3>
            <div className="mt-4 space-y-3">
              <label>
                <span className={labelClass}>Name</span>
                <input
                  className={inputClass}
                  value={contactForm.name}
                  onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>
              <label>
                <span className={labelClass}>Organisation</span>
                <input
                  className={inputClass}
                  value={contactForm.organisation}
                  onChange={(e) =>
                    setContactForm((f) => ({ ...f, organisation: e.target.value }))
                  }
                />
              </label>
              <label>
                <span className={labelClass}>Email</span>
                <input
                  className={inputClass}
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                />
              </label>
              <label>
                <span className={labelClass}>Segment</span>
                <select
                  className={inputClass}
                  value={contactForm.segment}
                  onChange={(e) =>
                    setContactForm((f) => ({
                      ...f,
                      segment: e.target.value as MailingContact["segment"],
                    }))
                  }
                >
                  {(["Investor", "LP", "Supporter", "Partner", "Media"] as const).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-auto flex gap-2 pt-6">
              <button type="button" className={secondaryBtn} onClick={() => setContactOpen(false)}>
                Cancel
              </button>
              <button type="button" className={primaryBtn} onClick={saveContact}>
                Save contact
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
